import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useAuth } from './AuthContext';
import { userData } from '../services/supabase';
import { useLoading } from './LoadingContext';

const UserPreferencesContext = createContext();

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      'useUserPreferences must be used within a UserPreferencesProvider'
    );
  }
  return context;
};

export const UserPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const { setMessage } = useLoading();
  const PREFERENCES_KEY = '5thavenue_preferences';
  const memoryPrefsRef = useRef(null);

  // Hydrate synchronously from local storage first for guests
  const [preferences, setPreferences] = useState(() => {
    try {
      const raw = localStorage.getItem(PREFERENCES_KEY);
      if (!raw)
        return { theme: 'light', language: 'es', notifications_enabled: true };
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object')
        return {
          theme: parsed.theme || 'light',
          language: parsed.language || 'es',
          notifications_enabled:
            typeof parsed.notifications_enabled === 'boolean'
              ? parsed.notifications_enabled
              : true,
        };
    } catch {
      // fall through to default
    }
    return { theme: 'light', language: 'es', notifications_enabled: true };
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Persist preferences changes immediately for both guests and logged-in users
  useEffect(() => {
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      memoryPrefsRef.current = preferences;
    }
  }, [preferences]);

  // Load user preferences from Supabase when logged in and merge with local
  useEffect(() => {
    let cancelled = false;
    const loadUserData = async () => {
      if (!user) return;
      setLoading(true);
      setMessage('Cargando preferencias...');
      try {
        const [{ data: prefsData }, { data: ordersData }] = await Promise.all([
          userData.getUserPreferences(user.id),
          userData.getUserOrders(user.id),
        ]);
        // Merge: server prefs win, but fallback to local for missing fields
        if (!cancelled) {
          const localRaw = (() => {
            try {
              return localStorage.getItem(PREFERENCES_KEY);
            } catch {
              return null;
            }
          })();
          const localPrefs = (() => {
            try {
              return localRaw ? JSON.parse(localRaw) : null;
            } catch {
              return null;
            }
          })();
          const merged = {
            theme: prefsData?.theme || localPrefs?.theme || 'light',
            language: prefsData?.language || localPrefs?.language || 'es',
            notifications_enabled:
              typeof prefsData?.notifications_enabled === 'boolean'
                ? prefsData.notifications_enabled
                : typeof localPrefs?.notifications_enabled === 'boolean'
                  ? localPrefs.notifications_enabled
                  : true,
          };
          setPreferences(merged);
          // Best-effort: persist merged preferences to account so server is source of truth
          try {
            await userData.updateUserPreferences(user.id, merged);
          } catch {}
        }
        if (!cancelled && ordersData) setOrders(ordersData);
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadUserData();
    return () => {
      cancelled = true;
    };
  }, [user, setMessage]);

  // Update preferences
  const updatePreferences = async newPreferences => {
    if (!user) return;

    try {
      const { data, error } = await userData.updateUserPreferences(
        user.id,
        newPreferences
      );
      if (!error && data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  // Order functions
  const createOrder = async orderData => {
    if (!user) return;

    try {
      const { data, error } = await userData.createUserOrder(
        user.id,
        orderData
      );
      if (!error && data) {
        setOrders(prev => [data, ...prev]);
        return { success: true, order: data };
      }
      return { success: false, error };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error };
    }
  };

  const value = {
    preferences,
    orders,
    loading,
    updatePreferences,
    createOrder,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
};
