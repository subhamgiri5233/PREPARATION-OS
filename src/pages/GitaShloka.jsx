// src/pages/GitaShloka.jsx
// Complete Bengali Text support, Bengali meanings, reflections, and quick-pick Bengali Gita Shlokas

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  BookOpen, Plus, Star, Search, Filter, Edit3, Trash2, CheckCircle,
  Flame, Zap, Calendar, Heart, Eye, X, RefreshCw, Sparkles, BookMarked
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

export const popularBengaliShlokas = [
  {
    chapter: '2',
    verse: '47',
    sanskritText: 'কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন ।\nমা কর্মফলহেতুর্ভূর্মা তে সঙ্গোঽস্ত্বকর্মণি ॥',
    transliteration: 'কৰ্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন । মা কৰ্মফলহেতুৰ্ভূৰ্মা তে সঙ্গোঽস্ত্বকৰ্মণি ॥',
    meaning: 'কর্মে তোমার একমাত্র অধিকার আছে, কিন্তু কর্মের ফলে কখনো তোমার অধিকার নেই। কর্মফল যেন তোমার কর্মপ্রবৃত্তির হেতু না হয় এবং কর্মত্যাগেও যেন তোমার প্রবৃত্তি না হয়।',
    personalReflection: 'ফলাফলের অতিরিক্ত চিন্তা না করে সম্পূর্ণ একাগ্রতা নিয়ে নিজের কর্তব্য ও পড়াশোনায় মনোনিবেশ করাই আমার মূল লক্ষ্য।'
  },
  {
    chapter: '2',
    verse: '14',
    sanskritText: 'মাত্রাস্পর্শাস্তু কৌন্তেয় শীতোষ্ণসুখদুঃখদাঃ ।\nআগমাপায়িনোঽনিত্যাস্তাংস্তিতিক্ষস্ব ভারত ॥',
    transliteration: 'মাত্ৰাস্পৰ্শাস্তু কৌন্তেয় শীতোষ্ণসুখদুঃখদাঃ । আগমাপায়িনোঽনিত্যাস্তাংস্তিতিক্ষস্ব ভাৰত ॥',
    meaning: 'হে কৌন্তেয়! ইন্দ্রিয় ও বিষয়ের সংযোগেই শীত-উষ্ণ, সুখ-দুঃখ প্রভৃতির অনুভূতি ঘটে। এগুলি উৎপত্তি ও বিনাশশীল, অতএব অনিত্য। হে ভারত! তুমি এই সমস্ত সহ্য করার অভ্যাস করো।',
    personalReflection: 'পড়াশোনার কঠিন পরিশ্রমে অধৈর্য না হয়ে স্থির মনে নিজের লক্ষ্যে অবিচল থাকতে হবে।'
  },
  {
    chapter: '4',
    verse: '38',
    sanskritText: 'ন হি জ্ঞানেন সদৃশং পবিত্রমিহ বিদ্যতে ।\nতৎ স্বয়ং যোগসংসিদ্ধঃ কালেনাত্মনি বিন্দতি ॥',
    transliteration: 'ন হি জ্ঞানেন সদৃশং পবিত্ৰমিহ বিদ্যতে । তৎ স্বয়ং যোগসংসিদ্ধঃ কালেনাত্মনি বিন্দতি ॥',
    meaning: 'এই জগতে জ্ঞানের মতো পবিত্র আর কিছুই নেই। সাধনায় সিদ্ধ ব্যক্তি কালক্রমে নিজের অন্তরে সেই আত্মজ্ঞান উপলব্ধি করতে পারেন।',
    personalReflection: 'প্রতিদিনের পড়া ও জ্ঞান অর্জনই জীবনের প্রকৃত শুদ্ধি ও শক্তির উৎস।'
  },
  {
    chapter: '6',
    verse: '5',
    sanskritText: 'উদ্ধরেদাত্মনাত্মানং নাত্মানমবসাদয়েৎ ।\nআত্মৈব হ্যাত্মনো বন্ধুরাত্মৈব রিপুরাত্মনঃ ॥',
    transliteration: 'উদ্ধৰেদাত্মনাত্মানং নাত্মানমবসাদয়েৎ । আত্মৈব হ্যাত্মনো বন্ধুৰাত্মৈব ৰিপুৰাত্মনঃ ॥',
    meaning: 'নিজের মনের দ্বারাই নিজেকে উন্নত করতে হবে, নিজেকে কখনও অবসাদগ্রস্ত বা অধঃপতিত করবে না। কারণ মনই নিজের প্রকৃত বন্ধু এবং মনই নিজের সবচেয়ে বড় শত্রু।',
    personalReflection: 'নিজের মনকে নিয়ন্ত্রণ করতে হবে। অলসতা ও হতাশা পরিহার করে আত্মবিশ্বাস বাড়াতে হবে।'
  },
  {
    chapter: '18',
    verse: '66',
    sanskritText: 'সর্বধর্মান্পরিত্যজ্য মামেকং শরণং ব্রজ ।\nঅহং ত্বাং সর্বপাপেভ্যো মোক্ষয়িষ্যামি মা শুচঃ ॥',
    transliteration: 'সৰ্বধৰ্মান্পৰিত্যাজ্য মামেকং শৰণং ব্ৰজ । অহং ত্বাং সৰ্বপাপেভ্যো মোক্ষয়িষ্যামি মা শুচঃ ॥',
    meaning: 'সমস্ত ধর্ম বা বাহ্যিক চিন্তা ত্যাগ করে কেবল আমারই শরণ গ্রহণ করো। আমি তোমাকে সমস্ত পাপ ও ভয় থেকে মুক্ত করব, শোক করো না।',
    personalReflection: 'সম্পূর্ণ সমর্পণ ও নিষ্ঠার সাথে পরিশ্রম করে ঈশ্বরের ওপর ভরসা রাখলে সমস্ত ভয় দূর হয়।'
  }
];

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
  const [showQuickPick, setShowQuickPick] = useState(false);
  const [editingShloka, setEditingShloka] = useState(null);
  const [viewingShloka, setViewingShloka] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form State in Bengali
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

  const handleSelectPopular = (pop) => {
    setFormData({
      ...formData,
      chapter: pop.chapter,
      verse: pop.verse,
      sanskritText: pop.sanskritText,
      transliteration: pop.transliteration,
      meaning: pop.meaning,
      personalReflection: pop.personalReflection || formData.personalReflection,
    });
    setShowQuickPick(false);
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
      setFormError('শ্লোক টেক্সট (বাংলা বা সংস্কৃত অক্ষরে) আবশ্যক।');
      return;
    }

    try {
      if (editingShloka) {
        await updateGitaShloka(editingShloka.id || editingShloka._id, formData);
        showToast('শ্লোক সফলভাবে আপডেট করা হয়েছে ✓');
      } else {
        await addGitaShloka(formData);
        showToast("আজকের শ্লোক সফলভাবে সংরক্ষিত হয়েছে ✓");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('[GitaShloka] Save error:', err);
      setFormError('শ্লোক সংরক্ষণ করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('আপনি কি এই গীতা শ্লোকটি মুছে ফেলতে চান?')) {
      await deleteGitaShloka(id);
      showToast('শ্লোক মুছে ফেলা হয়েছে।');
      if (viewingShloka && (viewingShloka.id === id || viewingShloka._id === id)) setViewingShloka(null);
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
          <h1 className="page-title">দৈনিক গীতা শ্লোক (Daily Gita Shloka)</h1>
          <p className="page-subtitle">বাংলা অর্থ, উপলব্ধি ও আত্মিক অনুপ্রেরণা সহ দৈনিক গীতা পাঠ</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleOpenAddToday}>
            <Plus size={16} /> + আজকের শ্লোক যোগ করুন
          </button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid-4 mb-24">
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📖</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.totalShlokas}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>মোট শ্লোক (Total)</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>📅</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.thisMonth}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>এই মাসে (This Month)</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>⭐</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{stats.favorites}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>পছন্দের শ্লোক (Favorites)</div>
        </div>
        <div className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 24, marginBottom: 4 }}>🔥</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)' }}>
            {stats.currentStreak} <span style={{ fontSize: 13, color: 'var(--text-2)' }}>/ সর্বোচ্চ {stats.longestStreak}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>ধারাবাহিকতা (Streak Days)</div>
        </div>
      </div>

      {/* Today's Shloka Card */}
      <div className="card mb-24" style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)',
        padding: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>📖</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>আজকের গীতা শ্লোক (Today's Shloka)</h2>
            {todayShloka && (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> সংরক্ষিত ✓
              </span>
            )}
          </div>

          {todayShloka ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleToggleFavorite(todayShloka.id || todayShloka._id)}
                title="পছন্দের তালিকা"
              >
                <Star size={16} fill={todayShloka.favorite ? 'var(--warning)' : 'none'} color={todayShloka.favorite ? 'var(--warning)' : 'var(--text-2)'} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(todayShloka)}>
                <Edit3 size={16} /> সম্পাদনা (Edit)
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => handleDelete(todayShloka.id || todayShloka._id)}
                style={{ color: 'var(--danger)' }}
                title="মুছে ফেলুন"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddToday}>
              <Plus size={14} /> + আজকের শ্লোক যোগ করুন
            </button>
          )}
        </div>

        {todayShloka ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
              {(todayShloka.chapter || todayShloka.verse) && (
                <span className="badge badge-primary" style={{ fontSize: 12, fontWeight: 600 }}>
                  অধ্যায় {todayShloka.chapter || '?'} • শ্লোক {todayShloka.verse || '?'}
                </span>
              )}
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>
                তারিখ: {todayShloka.date}
              </span>
            </div>

            {/* Shloka Bengali / Sanskrit Text */}
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              lineHeight: 1.7,
              color: 'var(--primary-light)',
              fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Kalpurush', 'Segoe UI', sans-serif",
              margin: '12px 0 16px 0',
              padding: '18px 22px',
              background: 'var(--surface-2)',
              borderRadius: 'var(--radius)',
              borderLeft: '4px solid var(--primary)',
              whiteSpace: 'pre-wrap'
            }}>
              {todayShloka.sanskritText}
            </div>

            {/* Transliteration */}
            {todayShloka.transliteration && (
              <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 14, fontStyle: 'italic' }}>
                🗣️ <em>{todayShloka.transliteration}</em>
              </div>
            )}

            {/* Bengali Meaning */}
            {todayShloka.meaning && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>
                  📜 বাংলা ভাবার্থ ও অনুবাদ:
                </div>
                <div style={{
                  fontSize: 15,
                  color: 'var(--text)',
                  lineHeight: 1.6,
                  fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Segoe UI', sans-serif"
                }}>
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
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 6 }}>
                  💭 ব্যক্তিগত উপলব্ধি ও লক্ষ্য:
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {todayShloka.personalReflection}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-2)' }}>
            <p style={{ margin: '0 0 12px 0', fontSize: 14 }}>আজকের জন্য এখনও কোনো গীতা শ্লোক এন্ট্রি করা হয়নি।</p>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddToday}>
              + বাংলা ভাষায় আজকের শ্লোক লিখুন
            </button>
          </div>
        )}
      </div>

      {/* History & Search Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>পূর্ববর্তী শ্লোক সংগ্রহ (Shloka History)</h2>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="বাংলা শব্দ বা শ্লোক খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 30, width: 220 }}
              />
            </div>

            <select
              className="form-select form-select-sm"
              value={chapterFilter}
              onChange={(e) => setChapterFilter(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="">সকল অধ্যায় (All)</option>
              {Array.from({ length: 18 }, (_, i) => i + 1).map((ch) => (
                <option key={ch} value={ch}>অধ্যায় {ch}</option>
              ))}
            </select>

            <button
              className={`btn btn-sm ${favoritesOnly ? 'btn-warning' : 'btn-ghost'}`}
              onClick={() => setFavoritesOnly(!favoritesOnly)}
            >
              <Star size={14} fill={favoritesOnly ? '#fff' : 'none'} /> পছন্দের ({stats.favorites})
            </button>
          </div>
        </div>

        {shlokas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <div className="empty-title">কোনো শ্লোক পাওয়া যায়নি</div>
            <div className="empty-desc">বাংলায় আপনার পছন্দের গীতা শ্লোক ও উপলব্ধি লিপিবদ্ধ করে রাখুন।</div>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAddToday} style={{ marginTop: 12 }}>
              + নতুন শ্লোক যোগ করুন
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shlokas.map((shloka) => (
              <div
                key={shloka.id || shloka._id}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: 16,
                  transition: 'var(--transition)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ fontSize: 11 }}>
                      {(shloka.chapter || shloka.verse)
                        ? `অধ্যায় ${shloka.chapter || '?'} • শ্লোক ${shloka.verse || '?'}`
                        : 'গীতা পাঠ'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{shloka.date}</span>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => handleToggleFavorite(shloka.id || shloka._id)}
                      title="পছন্দের তালিকা"
                    >
                      <Star size={14} fill={shloka.favorite ? 'var(--warning)' : 'none'} color={shloka.favorite ? 'var(--warning)' : 'var(--text-3)'} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => setViewingShloka(shloka)}
                      title="বিস্তারিত দেখুন"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => handleOpenEdit(shloka)}
                      title="সম্পাদনা"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn btn-icon btn-ghost btn-sm"
                      onClick={() => handleDelete(shloka.id || shloka._id)}
                      style={{ color: 'var(--danger)' }}
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Shloka Bengali / Sanskrit Preview */}
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 6,
                  fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Segoe UI', sans-serif"
                }} className="truncate">
                  {shloka.sanskritText}
                </div>

                {/* Bengali Meaning Preview */}
                {shloka.meaning && (
                  <div style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Segoe UI', sans-serif" }} className="truncate">
                    {shloka.meaning}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal with Bengali text inputs */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingShloka ? 'গীতা শ্লোক সম্পাদনা' : 'আজকের গীতা শ্লোক যুক্ত করুন'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={14} />
              </button>
            </div>

            {/* Quick Pick Banner */}
            {!editingShloka && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid var(--border-accent)',
                borderRadius: 'var(--radius)',
                padding: '10px 14px',
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>
                  💡 জনপ্রিয় গীতা শ্লোক বাংলা অর্থ সহ সরাসরি নির্বাচন করতে চান?
                </span>
                <button
                  type="button"
                  className="btn btn-xs btn-primary"
                  onClick={() => setShowQuickPick(!showQuickPick)}
                >
                  <Sparkles size={12} /> {showQuickPick ? 'বন্ধ করুন' : 'শ্লোক নির্বাচন'}
                </button>
              </div>
            )}

            {/* Quick Pick Dropdown / List */}
            {showQuickPick && (
              <div style={{
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: 12,
                marginBottom: 14,
                maxHeight: 220,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>
                  জনপ্রিয় বাংলা গীতা শ্লোক নির্বাচন করুন:
                </div>
                {popularBengaliShlokas.map((pop) => (
                  <div
                    key={`${pop.chapter}-${pop.verse}`}
                    onClick={() => handleSelectPopular(pop)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      fontSize: 12,
                      transition: 'var(--transition)'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                      অধ্যায় {pop.chapter} • শ্লোক {pop.verse}
                    </div>
                    <div style={{ color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pop.sanskritText.split('\n')[0]}
                    </div>
                    <div style={{ color: 'var(--text-2)', fontSize: 11 }} className="truncate">
                      {pop.meaning}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                  <label className="form-label">অধ্যায় নং (Chapter Number)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="যেমন: ২ বা 2"
                    min="1"
                    max="18"
                    value={formData.chapter}
                    onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">শ্লোক নং (Verse Number)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="যেমন: ৪৭ বা 47"
                    value={formData.verse}
                    onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">মূল শ্লোক (বাংলা বা দেবনাগরী হরফে) *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন ।&#10;মা কর্মফলহেতুর্ভূর্মা তে সঙ্গোঽস্ত্বকর্মণি ॥"
                  value={formData.sanskritText}
                  onChange={(e) => setFormData({ ...formData, sanskritText: e.target.value })}
                  style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Segoe UI', sans-serif", fontSize: 16 }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">উচ্চারণ ও লিপ্যন্তর (Transliteration - ঐচ্ছিক)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="কৰ্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন..."
                  value={formData.transliteration}
                  onChange={(e) => setFormData({ ...formData, transliteration: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">বাংলা ভাবার্থ ও অনুবাদ (Bengali Meaning) *</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="কর্মে তোমার একমাত্র অধিকার আছে, কিন্তু কর্মের ফলে কখনো তোমার অধিকার নেই..."
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                  style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Segoe UI', sans-serif", fontSize: 14 }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ব্যক্তিগত উপলব্ধি ও চিন্তন (Personal Reflection - ঐচ্ছিক)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="আজকের এই শ্লোকটি থেকে আমার কী শিক্ষা হলো? আমার পড়াশোনা ও লক্ষ্যে কীভাবে এটি প্রয়োগ করব..."
                  value={formData.personalReflection}
                  onChange={(e) => setFormData({ ...formData, personalReflection: e.target.value })}
                  style={{ fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Segoe UI', sans-serif", fontSize: 14 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  বাতিল (Cancel)
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingShloka ? 'পরিবর্তন সংরক্ষণ করুন' : 'শ্লোক সংরক্ষণ করুন'}
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
                  ? `অধ্যায় ${viewingShloka.chapter || '?'} • শ্লোক ${viewingShloka.verse || '?'}`
                  : 'গীতা শ্লোক'}
              </h2>
              <button className="modal-close" onClick={() => setViewingShloka(null)}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                তারিখ: {viewingShloka.date}
              </div>

              <div style={{
                fontSize: 19,
                fontWeight: 600,
                color: 'var(--primary-light)',
                background: 'var(--surface-2)',
                padding: 18,
                borderRadius: 'var(--radius)',
                fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Kalpurush', 'Segoe UI', sans-serif",
                whiteSpace: 'pre-wrap',
                borderLeft: '4px solid var(--primary)',
                lineHeight: 1.7
              }}>
                {viewingShloka.sanskritText}
              </div>

              {viewingShloka.transliteration && (
                <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-2)' }}>
                  🗣️ "{viewingShloka.transliteration}"
                </div>
              )}

              {viewingShloka.meaning && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>
                    📜 বাংলা ভাবার্থ:
                  </div>
                  <div style={{
                    fontSize: 15,
                    color: 'var(--text)',
                    lineHeight: 1.6,
                    fontFamily: "'Noto Sans Bengali', 'Hind Siliguri', 'Segoe UI', sans-serif"
                  }}>
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--warning)', marginBottom: 6 }}>
                    💭 ব্যক্তিগত উপলব্ধি:
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
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
                  <Edit3 size={14} /> সম্পাদনা (Edit)
                </button>
                <button className="btn btn-primary" onClick={() => setViewingShloka(null)}>
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
