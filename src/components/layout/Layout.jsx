// src/components/layout/Layout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import InstallAppBanner from '../InstallAppBanner';
import LoginModal from '../LoginModal';
import LoginPage from '../../pages/LoginPage';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarOpen } = useAppStore();
  const { isAuthenticated, isChecking, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isChecking) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 16, background: 'var(--bg)', color: 'var(--text)'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26
        }}>🎯</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Preparation OS</div>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  // Strict Authentication Gate: Without login, only show the Login Screen
  if (!isAuthenticated) {
    return (
      <div className="app-layout" style={{ display: 'block', minHeight: '100vh', background: 'var(--bg)' }}>
        <InstallAppBanner />
        <LoginModal />
        <div style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '40px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20
            }}>🎯</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Preparation OS</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Secure Study & Revision System</div>
            </div>
          </div>

          <LoginPage />
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <InstallAppBanner />
      <LoginModal />

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <TopBar onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <BottomNav onOpenMenu={() => setMobileOpen(true)} />
    </div>
  );
}
