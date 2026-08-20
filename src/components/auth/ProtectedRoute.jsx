// src/components/auth/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isCheckingSession, isChecking, checkAuth } = useAuthStore();
  const stillChecking = isChecking || isCheckingSession;

  useEffect(() => {
    // Re-verify session on every protected route mount
    checkAuth();
  }, []);

  if (stillChecking) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 16, background: 'var(--bg)', color: 'var(--text)'
      }}>
        <div style={{
          width: 54, height: 54, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 4
        }}>🎯</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Preparation OS</div>
        <div className="spinner" style={{ width: 28, height: 28 }} />
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Verifying secure session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL as ?returnTo so login can redirect back
    return (
      <Navigate
        to={`/login`}
        state={{ from: location }}
        replace
      />
    );
  }

  return children;
}
