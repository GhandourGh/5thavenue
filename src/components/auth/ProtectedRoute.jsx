import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (!user) {
    try {
      // Where to go after successful login
      sessionStorage.setItem(
        'redirect_after_auth',
        location.pathname + location.search
      );
      // Where to go if the user cancels login (previous route)
      if (!sessionStorage.getItem('redirect_prev_path')) {
        let fallback = '/';
        try {
          const ref = document.referrer;
          if (ref) {
            const u = new URL(ref);
            if (u.origin === window.location.origin) {
              fallback = u.pathname + u.search;
            }
          }
        } catch {}
        sessionStorage.setItem('redirect_prev_path', fallback);
      }
    } catch {}
    return <Navigate to="/?login=1" replace />;
  }
  return children;
};

export default ProtectedRoute;
