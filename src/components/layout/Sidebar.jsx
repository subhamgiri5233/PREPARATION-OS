// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Calendar, Timer, FileText,
  RotateCcw, BookMarked, TrendingUp, BarChart3, Bell,
  Clock, Settings, ChevronLeft, ChevronRight, GraduationCap
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

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
  const location = useLocation();

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

        {/* Collapse Toggle (desktop only) */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
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
        </div>
      </aside>
    </>
  );
}
