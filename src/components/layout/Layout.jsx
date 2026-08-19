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
