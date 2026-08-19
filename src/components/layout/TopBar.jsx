import { useState } from 'react';
import { Menu, Bell, Zap, Search, X, BookOpen, GraduationCap, FileText, BookMarked, Lock, Unlock, LogIn, LogOut, Eye, Edit3 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { searchGlobal } from '../../services/searchService';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/preparation': 'Preparation',
  '/planner': 'Study Planner',
  '/sessions': 'Study Sessions',
  '/mock-tests': 'Mock Tests',
  '/revision': 'Revision',
  '/vocabulary': 'Vocabulary',
  '/progress': 'Progress',
  '/analytics': 'Analytics',
  '/gita-shloka': 'Daily Gita Shloka',
  '/gita': 'Daily Gita Shloka',
  '/notifications': 'Notifications',
  '/teaching': 'Teaching Schedule',
  '/settings': 'Settings',
};

export default function TopBar({ onMobileMenuOpen }) {
  const { unreadCount, settings } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const title = PAGE_TITLES[location.pathname] || 'Preparation OS';
  const today = format(new Date(), 'EEE, MMM d');

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ topics: [], courses: [], subjects: [], vocabulary: [], shlokas: [] });
  const [searching, setSearching] = useState(false);

  const handleSearchChange = async (q) => {
    setSearchQuery(q);
    if (!q || !q.trim()) {
      setSearchResults({ topics: [], courses: [], subjects: [], vocabulary: [], shlokas: [] });
      return;
    }
    setSearching(true);
    try {
      const res = await searchGlobal(q);
      setSearchResults(res);
    } catch (e) {
      console.error('[TopBar] Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const handleNavigate = (path) => {
    setShowSearchModal(false);
    setSearchQuery('');
    navigate(path);
  };

  const { isEditMode, toggleEditMode, logout } = useAuthStore();

  return (
    <>
      <header className="topbar">
        {/* Mobile hamburger */}
        <button
          className="topbar-btn mobile-only"
          onClick={onMobileMenuOpen}
          id="mobile-menu-btn"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-8" style={{ flex: 1 }}>
          <h1 className="topbar-title">{title}</h1>
          <span className="text-sm text-muted">{today}</span>
        </div>

        <div className="topbar-actions">
          {/* Global Search Button */}
          <button
            className="topbar-btn"
            onClick={() => setShowSearchModal(true)}
            title="Global Search"
            aria-label="Global Search"
          >
            <Search size={16} />
          </button>

          {/* Active session indicator */}
          <ActiveSessionIndicator />

          {/* Edit Mode vs View-Only Toggle Switch */}
          {isEditMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className="btn btn-xs"
                onClick={toggleEditMode}
                title="Edit Mode is ON. Click to switch to View-Only Mode."
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(34, 197, 94, 0.15)',
                  color: 'var(--success)',
                  border: '1px solid var(--success)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 10px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Edit3 size={13} />
                <span>Edit Mode</span>
                <div style={{
                  width: 26,
                  height: 14,
                  borderRadius: 7,
                  background: 'var(--success)',
                  position: 'relative',
                  marginLeft: 2
                }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: '#fff',
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    transition: 'all 0.2s ease'
                  }} />
                </div>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-xs btn-ghost"
              onClick={toggleEditMode}
              title="View-Only Mode. Click to enter Master PIN and turn ON Edit Mode."
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface-2)',
                color: 'var(--text-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Eye size={13} />
              <span>View Only</span>
              <div style={{
                width: 26,
                height: 14,
                borderRadius: 7,
                background: 'var(--surface-3)',
                position: 'relative',
                marginLeft: 2
              }}>
                <div style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: 'var(--text-3)',
                  position: 'absolute',
                  top: 2,
                  left: 2,
                  transition: 'all 0.2s ease'
                }} />
              </div>
            </button>
          )}

          {/* Logout button */}
          <button
            className="topbar-btn"
            onClick={logout}
            title="Logout of Preparation OS"
            aria-label="Logout"
            style={{ color: 'var(--text-3)' }}
          >
            <LogOut size={16} />
          </button>

          {/* Notifications */}
          <a href="/notifications" className="topbar-btn" aria-label="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </a>
        </div>
      </header>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowSearchModal(false)}>
          <div className="modal" style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <Search size={18} style={{ color: 'var(--primary)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Global Search (topics, courses, vocab, Gita shlokas...)"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  autoFocus
                  style={{ border: 'none', background: 'transparent', fontSize: 16, width: '100%' }}
                />
              </div>
              <button className="modal-close" onClick={() => setShowSearchModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: 400, overflowY: 'auto', padding: '8px 0' }}>
              {searching && (
                <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-3)' }}>
                  Searching...
                </div>
              )}

              {!searching && searchQuery && (
                searchResults.topics.length === 0 &&
                searchResults.courses.length === 0 &&
                searchResults.subjects.length === 0 &&
                searchResults.vocabulary.length === 0 &&
                searchResults.shlokas.length === 0
              ) && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)' }}>
                  No matching items found for "{searchQuery}"
                </div>
              )}

              {/* Topics */}
              {searchResults.topics.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', padding: '4px 12px' }}>
                    Topics ({searchResults.topics.length})
                  </div>
                  {searchResults.topics.slice(0, 5).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => handleNavigate('/preparation')}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius)', background: 'var(--card)', marginBottom: 4 }}
                      className="nav-item"
                    >
                      <GraduationCap size={14} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Status: {t.status} · Priority: {t.priority}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Courses */}
              {searchResults.courses.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--success)', padding: '4px 12px' }}>
                    Courses ({searchResults.courses.length})
                  </div>
                  {searchResults.courses.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleNavigate('/preparation')}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius)', background: 'var(--card)', marginBottom: 4 }}
                      className="nav-item"
                    >
                      <GraduationCap size={14} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                        {c.provider && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Provider: {c.provider}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vocabulary */}
              {searchResults.vocabulary.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--warning)', padding: '4px 12px' }}>
                    Vocabulary ({searchResults.vocabulary.length})
                  </div>
                  {searchResults.vocabulary.slice(0, 5).map((v) => (
                    <div
                      key={v.id}
                      onClick={() => handleNavigate('/vocabulary')}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius)', background: 'var(--card)', marginBottom: 4 }}
                      className="nav-item"
                    >
                      <BookMarked size={14} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{v.word}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.meaning} {v.bengaliMeaning ? `(${v.bengaliMeaning})` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gita Shlokas */}
              {searchResults.shlokas.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--info)', padding: '4px 12px' }}>
                    Gita Shlokas ({searchResults.shlokas.length})
                  </div>
                  {searchResults.shlokas.slice(0, 5).map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleNavigate('/gita-shloka')}
                      style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius)', background: 'var(--card)', marginBottom: 4 }}
                      className="nav-item"
                    >
                      <BookOpen size={14} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {(s.chapter || s.verse) ? `Chapter ${s.chapter || '?'} • Verse ${s.verse || '?'}` : 'Gita Entry'} - {s.date}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }} className="truncate">{s.sanskritText}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ActiveSessionIndicator() {
  const { activeSession } = useAppStore();
  if (!activeSession) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'var(--success-glass)', color: 'var(--success)',
      padding: '5px 12px', borderRadius: 'var(--radius-full)',
      fontSize: 12, fontWeight: 600, border: '1px solid var(--success)',
      animation: 'pulse-glow 2s infinite'
    }}>
      <Zap size={12} />
      Session Active
    </div>
  );
}
