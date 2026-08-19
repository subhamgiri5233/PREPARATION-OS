// src/components/layout/BottomNav.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  RotateCcw,
  Menu
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function BottomNav({ onOpenMenu }) {
  const { unreadCount } = useAppStore();

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/preparation', label: 'Prep', icon: GraduationCap },
    { to: '/planner', label: 'Planner', icon: Calendar },
    { to: '/revision', label: 'Revision', icon: RotateCcw },
  ];

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-items">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `bottom-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className="bottom-nav-item bottom-nav-btn"
          onClick={onOpenMenu}
          aria-label="More navigation options"
        >
          <div style={{ position: 'relative' }}>
            <Menu size={20} />
            {unreadCount > 0 && <span className="bottom-nav-dot" />}
          </div>
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
