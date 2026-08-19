// src/pages/GitaShloka.jsx
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  BookOpen, Plus, Star, Search, Filter, Edit3, Trash2, CheckCircle,
  Flame, Zap, Calendar, Heart, Eye, X, RefreshCw
} from 'lucide-react';
import {
  getAllGitaShlokas,
  getTodayGitaShloka,
  addGitaShloka,
  updateGitaShloka,
  deleteGitaShloka,
  toggleGitaFavorite,
  getGitaStats,
  searchShlokas
} from '../services/gitaService';

export default function GitaShloka() {
  const [todayShloka, setTodayShloka] = useState(null);
  const [shlokas, setShlokas] = useState([]);
  const [stats, setStats] = useState({ totalShlokas: 0, thisMonth: 0, favorites: 0, currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [editingShloka, setEditingShloka] = useState(null);
  const [viewingShloka, setViewingShloka] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    chapter: '',
    verse: '',
    sanskritText: '',
    transliteration: '',
    meaning: '',
    personalReflection: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const today = await getTodayGitaShloka();
      setTodayShloka(today || null);

      const s = await getGitaStats();
      setStats(s);

      const list = await searchShlokas({
        query: searchQuery,
        chapter: chapterFilter,
        favoritesOnly
      });
      setShlokas(list);
    } catch (err) {
      console.error('[GitaShloka] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, chapterFilter, favoritesOnly]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenAddToday = () => {
    setEditingShloka(null);
    setFormData({
      chapter: '',
      verse: '',
      sanskritText: '',
      transliteration: '',
      meaning: '',
      personalReflection: '',
      date: format(new Date(), 'yyyy-MM-dd')
    });
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (shloka) => {
    setEditingShloka(shloka);
    setFormData({
      chapter: shloka.chapter || '',
      verse: shloka.verse || '',
      sanskritText: shloka.sanskritText || '',
      transliteration: shloka.transliteration || '',
      meaning: shloka.meaning || '',
      personalReflection: shloka.personalReflection || '',
      date: shloka.date || format(new Date(), 'yyyy-MM-dd')
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.sanskritText || !formData.sanskritText.trim()) {
      setFormError('Sanskrit text is required.');
      return;
    }

    try {
      if (editingShloka) {
        await updateGitaShloka(editingShloka.id, formData);
        showToast('Shloka Updated Successfully ✓');
      } else {
        await addGitaShloka(formData);
        showToast("Today's Shloka Saved ✓");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('[GitaShloka] Save error:', err);
      setFormError('Failed to save shloka. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shloka entry?')) {
      await deleteGitaShloka(id);
      showToast('Shloka deleted.');
      if (viewingShloka && viewingShloka.id === id) setViewingShloka(null);
      loadData();
    }
  };

  const handleToggleFavorite = async (id) => {
    await toggleGitaFavorite(id);
    loadData();
  };

  if (loading && shlokas.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: 'var(--success)', color: '#fff',
          padding: '12px 20px', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Daily Gita Shloka</h1>
          <p className="page-subtitle">Personal daily entry, contemplation, and well-being reflection</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddToday}>
          <Plus size={16} /> Add Today's Shloka
        </button>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid-4 mb-24">
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📖</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.totalShlokas}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Total Shlokas</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📅</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.thisMonth}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>This Month</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⭐</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.favorites}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Favorites</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🔥</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)' }}>
            {stats.currentStreak} <span style={{ fontSize: 13, color: 'var(--text-2)' }}>/ max {stats.longestStreak}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>Daily Streak (Days)</div>
        </div>
      </div>

      {/* Today's Shloka Card */}
      <div className="card mb-24" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)',
        padding: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📖</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Today's Gita Shloka</h2>
            {todayShloka && (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> Today's Shloka Saved ✓
              </span>
            )}
          </div>

          {todayShloka ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleToggleFavorite(todayShloka.id)}
                title="Favorite"
              >
                <Star size={16} fill={todayShloka.favorite ? 'var(--warning)' : 'none'} color={todayShloka.favorite ? 'var(--warning)' : 'var(--text-2)'} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(todayShloka)}>
                <Edit3 size={16} /> Edit
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddToday}>
              <Plus size={14} /> + Add Today's Shloka
            </button>
          )}
        </div>

        {todayShloka ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {(todayShloka.chapter || todayShloka.verse) && (
                <span className="badge badge-primary" style={{ fontSize: 12, fontWeight: 600 }}>
                  Chapter {todayShloka.chapter || '?'} • Verse {todayShloka.verse || '?'}
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                Recorded on {todayShloka.date}
              </span>
            </div>

            {/* Sanskrit Text */}
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.6,
              color: 'var(--primary-light)',
              fontFamily: "'Segoe UI', 'Noto Sans Devanagari', 'Mangal', serif",
              margin: '12px 0 16px 0',
              padding: '16px 20px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius)',
              borderLeft: '4px solid var(--primary)',
              whiteSpace: 'pre-wrap'
            }}>
              {todayShloka.sanskritText}
            </div>

            {/* Transliteration */}
            {todayShloka.transliteration && (
              <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--text-2)', marginBottom: 12 }}>
                "{todayShloka.transliteration}"
              </div>
            )}

            {/* Meaning */}
            {todayShloka.meaning && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-3)', marginBottom: 4 }}>
                  Meaning
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                  {todayShloka.meaning}
                </div>
              </div>
            )}

            {/* Personal Reflection */}
            {todayShloka.personalReflection && (
              <div style={{
                background: 'var(--surface-3)',
                padding: '14px 18px',
                borderRadius: 'var(--radius)',
                borderLeft: '3px solid var(--warning)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>
                  💭 Personal Reflection
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {todayShloka.personalReflection}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <div className="empty-icon">📖</div>
            <div className="empty-title">No shloka added today</div>
            <div className="empty-desc">Choose a Bhagavad Gita shloka and record your personal reflection for today</div>
            <button className="btn btn-primary mt-12" onClick={handleOpenAddToday}>
              <Plus size={14} /> Add Today's Shloka
            </button>
          </div>
        )}
      </div>

      {/* Shloka History / Search Section */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div className="card-title">📜 Previous Shlokas</div>

          {/* Search & Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-3)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 30, fontSize: 12, height: 34 }}
                placeholder="Search Sanskrit, meaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-select"
              style={{ width: 140, fontSize: 12, height: 34 }}
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
            >
              <option value="">All Chapters</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((ch) => (
                <option key={ch} value={ch}>Chapter {ch}</option>
              ))}
            </select>

            <button
              className={`btn btn-sm ${favoritesOnly ? 'btn-warning' : 'btn-ghost'}`}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              style={{ height: 34 }}
            >
              <Star size={14} fill={favoritesOnly ? '#fff' : 'none'} />
              Favorites
            </button>
          </div>
        </div>

        {/* History List */}
        {shlokas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <div className="empty-title">No shlokas found</div>
            <div className="empty-desc">
              {searchQuery || chapterFilter || favoritesOnly
                ? 'Try adjusting your search query or filters'
                : 'Your historical shloka entries will appear here'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
            {shlokas.map((shloka) => (
              <div
                key={shloka.id}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span className="badge badge-primary" style={{ fontSize: 11 }}>
                        {(shloka.chapter || shloka.verse)
                          ? `Chapter ${shloka.chapter || '?'} • Verse ${shloka.verse || '?'}`
                          : 'General Entry'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{shloka.date}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => handleToggleFavorite(shloka.id)}
                      title="Favorite"
                    >
                      <Star size={14} fill={shloka.favorite ? 'var(--warning)' : 'none'} color={shloka.favorite ? 'var(--warning)' : 'var(--text-3)'} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => setViewingShloka(shloka)}
                      title="View Details"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => handleOpenEdit(shloka)}
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => handleDelete(shloka.id)}
                      style={{ color: 'var(--danger)' }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Sanskrit Preview */}
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 6,
                  fontFamily: "'Segoe UI', 'Noto Sans Devanagari', 'Mangal', serif"
                }} className="truncate">
                  {shloka.sanskritText}
                </div>

                {/* Meaning Preview */}
                {shloka.meaning && (
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }} className="truncate">
                    {shloka.meaning}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingShloka ? 'Edit Gita Shloka' : 'Add Today\'s Gita Shloka'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{
                  background: 'var(--danger-glass)', color: 'var(--danger)',
                  padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 13
                }}>
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Chapter Number</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 2"
                    min="1"
                    max="18"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Verse Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 47"
                    value={formData.verse}
                    onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sanskrit Text *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="कर्मण्येवाधिकारस्ते मा फलेषु कदाचन..."
                  value={formData.sanskritText}
                  onChange={(e) => setFormData({ ...formData, sanskritText: e.target.value })}
                  style={{ fontFamily: "'Segoe UI', 'Noto Sans Devanagari', 'Mangal', serif", fontSize: 16 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Transliteration (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Karmanye vadhikaraste ma phaleshu kadachana..."
                  value={formData.transliteration}
                  onChange={(e) => setFormData({ ...formData, transliteration: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meaning (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="You have a right to perform your prescribed duty, but you are not entitled to the fruits of action..."
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">My Reflection (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="What did I learn from this shloka today? How does it apply to my preparation?"
                  value={formData.personalReflection}
                  onChange={(e) => setFormData({ ...formData, personalReflection: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Shloka
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingShloka && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewingShloka(null)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {(viewingShloka.chapter || viewingShloka.verse)
                  ? `Chapter ${viewingShloka.chapter || '?'} • Verse ${viewingShloka.verse || '?'}`
                  : 'Gita Shloka'}
              </h2>
              <button className="modal-close" onClick={() => setViewingShloka(null)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                Recorded on {viewingShloka.date}
              </div>

              <div style={{
                fontSize: 18,
                fontWeight: 600,
                color: 'var(--primary-light)',
                background: 'var(--surface-2)',
                padding: 16,
                borderRadius: 'var(--radius)',
                fontFamily: "'Segoe UI', 'Noto Sans Devanagari', 'Mangal', serif",
                whiteSpace: 'pre-wrap',
                borderLeft: '4px solid var(--primary)'
              }}>
                {viewingShloka.sanskritText}
              </div>

              {viewingShloka.transliteration && (
                <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-2)' }}>
                  "{viewingShloka.transliteration}"
                </div>
              )}

              {viewingShloka.meaning && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    Meaning
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>
                    {viewingShloka.meaning}
                  </div>
                </div>
              )}

              {viewingShloka.personalReflection && (
                <div style={{
                  background: 'var(--surface-3)',
                  padding: 14,
                  borderRadius: 'var(--radius)',
                  borderLeft: '3px solid var(--warning)'
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>
                    💭 Personal Reflection
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                    {viewingShloka.personalReflection}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    handleOpenEdit(viewingShloka);
                    setViewingShloka(null);
                  }}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button className="btn btn-primary" onClick={() => setViewingShloka(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
