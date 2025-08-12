import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    // initial load
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.user || null);
      setLoading(false);
    });
    // subscribe to auth changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      const { error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, fullName) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (err) throw err;
      // Best-effort profile row
      const userId = data?.user?.id;
      if (userId) {
        await supabase
          .from('user_profiles')
          .upsert({ id: userId, full_name: fullName, email });
      }
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
      });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOtp = async phone => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async ({ phone, token, fullName }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'sms',
        phone,
        token,
      });
      if (error) throw error;
      const userId = data?.user?.id || data?.session?.user?.id;
      if (userId) {
        await supabase
          .from('user_profiles')
          .upsert({ id: userId, full_name: fullName || null, phone });
      }
      return { success: true };
    } catch (e) {
      setError(e);
      return { success: false, error: e };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithApple,
    sendPhoneOtp,
    verifyPhoneOtp,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
