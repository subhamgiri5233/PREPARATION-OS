import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar, Timer, FileText,
  RotateCcw, BookMarked, TrendingUp, BarChart3, Bell,
  Clock, Settings, ChevronLeft, ChevronRight, GraduationCap,
  LogIn, LogOut, User, ShieldCheck, Eye, Edit3
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';

const NAV_ITEMS = [
  { group: 'Main', items: [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { group: 'Preparation', items: [
    { path: '/preparation', icon: GraduationCap, label: 'Preparation' },
    { path: '/planner', icon: Calendar, label: 'Study Planner' },
    { path: '/sessions', icon: Timer, label: 'Study Sessions' },
  ]},
  { group: 'Assessment', items: [
    { path: '/mock-tests', icon: FileText, label: 'Mock Tests' },
    { path: '/revision', icon: RotateCcw, label: 'Revision' },
    { path: '/vocabulary', icon: BookMarked, label: 'Vocabulary' },
  ]},
  { group: 'Insights', items: [
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ]},
  { group: 'Personal', items: [
    { path: '/gita-shloka', icon: BookOpen, label: 'Gita Shloka' },
  ]},
  { group: 'System', items: [
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/teaching', icon: Clock, label: 'Teaching Schedule' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { sidebarOpen, toggleSidebar, unreadCount } = useAppStore();
  const { isEditMode, isAuthenticated, toggleEditMode, lock, openLoginModal, ownerName, logout } = useAuthStore();
  const location = useLocation();

  const handleAuthAction = () => {
    toggleEditMode();
    if (mobileOpen) onMobileClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎯</div>
          {sidebarOpen && (
            <div className="sidebar-logo-text">
              PrepOS
              <span>Preparation OS</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              {sidebarOpen && <div className="nav-section-label">{group.group}</div>}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isNotif = item.path === '/notifications';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    onClick={onMobileClose}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <Icon className="nav-icon" size={16} />
                    {sidebarOpen && <span>{item.label}</span>}
                    {isNotif && unreadCount > 0 && (
                      <span className="nav-badge">{unreadCount}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Mode Toggle Switch & User Profile */}
        <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
          {isEditMode ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'space-between' : 'center',
              padding: sidebarOpen ? '8px 10px' : '8px 0',
              borderRadius: 'var(--radius)',
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              marginBottom: 6
            }}>
              {sidebarOpen && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'var(--primary)', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0
                  }}>
                    {ownerName ? ownerName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {ownerName || 'Subham'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Edit3 size={10} /> Edit Mode ON
                    </div>
                  </div>
                </div>
              )}
              <button
                className="btn btn-xs btn-ghost"
                onClick={handleAuthAction}
                title="Switch to View-Only Mode"
                style={{
                  color: 'var(--text-3)',
                  padding: sidebarOpen ? '4px 8px' : '6px',
                  display: 'flex', alignItems: 'center', gap: 4
                }}
              >
                <Eye size={14} />
                {sidebarOpen && <span style={{ fontSize: 11, fontWeight: 600 }}>View Only</span>}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-ghost w-full"
              onClick={handleAuthAction}
              title="Click and enter Master PIN to enable Edit Mode"
              style={{
                justifyContent: sidebarOpen ? 'space-between' : 'center',
                padding: sidebarOpen ? '8px 12px' : '8px',
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 6,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Eye size={15} color="var(--text-2)" />
                {sidebarOpen && <span>View Only</span>}
              </div>
              {sidebarOpen && (
                <span className="badge badge-primary" style={{ fontSize: 9, padding: '2px 6px' }}>
                  Enable Edit
                </span>
              )}
            </button>
          )}

          {/* Collapse Toggle (desktop only) */}
          <button
            className="nav-item w-full"
            onClick={toggleSidebar}
            style={{ justifyContent: sidebarOpen ? 'flex-start' : 'center' }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen
              ? <ChevronLeft size={16} className="nav-icon" />
              : <ChevronRight size={16} className="nav-icon" />}
            {sidebarOpen && <span>Collapse</span>}
          </button>

          {/* Logout Button */}
          <button
            className="nav-item w-full"
            onClick={() => { logout(); if (mobileOpen) onMobileClose(); }}
            style={{
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              color: 'var(--danger)',
              marginTop: 2
            }}
            title="Logout — return to login screen"
            aria-label="Logout"
          >
            <LogOut size={16} className="nav-icon" style={{ color: 'var(--danger)' }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
