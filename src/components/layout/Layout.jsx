// src/components/layout/Layout.jsx
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import InstallAppBanner from '../InstallAppBanner';
import LoginModal from '../LoginModal';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarOpen } = useAppStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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
