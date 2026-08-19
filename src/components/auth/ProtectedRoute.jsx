// src/components/auth/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isCheckingSession, checkAuth } = useAuthStore();

  useEffect(() => {
    // Re-verify session on mount
    checkAuth();
  }, []);

  if (isCheckingSession) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 16, background: 'var(--bg)', color: 'var(--text)'
      }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Verifying secure session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
