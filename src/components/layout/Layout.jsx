// src/components/layout/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import InstallAppBanner from '../InstallAppBanner';
import { useAppStore } from '../../store/useAppStore';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { sidebarOpen } = useAppStore();

  return (
    <div className="app-layout">
      <InstallAppBanner />

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
