// src/pages/GitaShloka.jsx
// Redesigned: clean form order, studyApplication field, scrollable view modal,
// distinct visual sections, Bengali typography, full mobile responsiveness.

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  BookOpen, Plus, Star, Search, Edit3, Trash2, CheckCircle,
  Flame, X, Sparkles, Eye, Calendar
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
import { requireEditPermission, canEdit } from '../services/mutationGuard.js';

const BENGALI_FONT = "'Noto Sans Bengali', 'Hind Siliguri', 'Kalpurush', 'Segoe UI', sans-serif";

// ─── Popular Shlokas (Quick Pick presets) ────────────────────────────────────
export const popularBengaliShlokas = [
  {
    chapter: '2', verse: '47',
    sanskritText: 'কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন ।\nমা কর্মফলহেতুর্ভূর্মা তে সঙ্গোঽস্ত্বকর্মণি ॥',
    meaning: 'কর্মে তোমার একমাত্র অধিকার আছে, কিন্তু কর্মের ফলে কখনো তোমার অধিকার নেই। কর্মফল যেন তোমার কর্মপ্রবৃত্তির হেতু না হয় এবং কর্মত্যাগেও যেন তোমার প্রবৃত্তি না হয়।',
    realLifeApplication: '',
    studyApplication: '',
    personalReflection: 'ফলাফলের অতিরিক্ত চিন্তা না করে সম্পূর্ণ একাগ্রতা নিয়ে নিজের কর্তব্য ও পড়াশোনায় মনোনিবেশ করাই আমার মূল লক্ষ্য।'
  },
  {
    chapter: '2', verse: '14',
    sanskritText: 'মাত্রাস্পর্শাস্তু কৌন্তেয় শীতোষ্ণসুখদুঃখদাঃ ।\nআগমাপায়িনোঽনিত্যাস্তাংস্তিতিক্ষস্ব ভারত ॥',
    meaning: 'হে কৌন্তেয়! ইন্দ্রিয় ও বিষয়ের সংযোগেই শীত-উষ্ণ, সুখ-দুঃখ প্রভৃতির অনুভূতি ঘটে। এগুলি উৎপত্তি ও বিনাশশীল, অতএব অনিত্য। তুমি এই সমস্ত সহ্য করার অভ্যাস করো।',
    realLifeApplication: '', studyApplication: '',
    personalReflection: 'পড়াশোনার কঠিন পরিশ্রমে অধৈর্য না হয়ে স্থির মনে নিজের লক্ষ্যে অবিচল থাকতে হবে।'
  },
  {
    chapter: '4', verse: '38',
    sanskritText: 'ন হি জ্ঞানেন সদৃশং পবিত্রমিহ বিদ্যতে ।\nতৎ স্বয়ং যোগসংসিদ্ধঃ কালেনাত্মনি বিন্দতি ॥',
    meaning: 'এই জগতে জ্ঞানের মতো পবিত্র আর কিছুই নেই। সাধনায় সিদ্ধ ব্যক্তি কালক্রমে নিজের অন্তরে সেই আত্মজ্ঞান উপলব্ধি করতে পারেন।',
    realLifeApplication: '', studyApplication: '',
    personalReflection: 'প্রতিদিনের পড়া ও জ্ঞান অর্জনই জীবনের প্রকৃত শুদ্ধি ও শক্তির উৎস।'
  },
  {
    chapter: '6', verse: '5',
    sanskritText: 'উদ্ধরেদাত্মনাত্মানং নাত্মানমবসাদয়েৎ ।\nআত্মৈব হ্যাত্মনো বন্ধুরাত্মৈব রিপুরাত্মনঃ ॥',
    meaning: 'নিজের মনের দ্বারাই নিজেকে উন্নত করতে হবে, নিজেকে কখনও অবসাদগ্রস্ত বা অধঃপতিত করবে না। কারণ মনই নিজের প্রকৃত বন্ধু এবং মনই নিজের সবচেয়ে বড় শত্রু।',
    realLifeApplication: '', studyApplication: '',
    personalReflection: 'নিজের মনকে নিয়ন্ত্রণ করতে হবে। অলসতা ও হতাশা পরিহার করে আত্মবিশ্বাস বাড়াতে হবে।'
  },
  {
    chapter: '18', verse: '66',
    sanskritText: 'সর্বধর্মান্পরিত্যজ্য মামেকং শরণং ব্রজ ।\nঅহং ত্বাং সর্বপাপেভ্যো মোক্ষয়িষ্যামি মা শুচঃ ॥',
    meaning: 'সমস্ত ধর্ম বা বাহ্যিক চিন্তা ত্যাগ করে কেবল আমারই শরণ গ্রহণ করো। আমি তোমাকে সমস্ত পাপ ও ভয় থেকে মুক্ত করব, শোক করো না।',
    realLifeApplication: '', studyApplication: '',
    personalReflection: 'সম্পূর্ণ সমর্পণ ও নিষ্ঠার সাথে পরিশ্রম করে ঈশ্বরের ওপর ভরসা রাখলে সমস্ত ভয় দূর হয়।'
  }
];

// ─── Empty form state ─────────────────────────────────────────────────────────
const emptyForm = () => ({
  chapter: '', verse: '',
  sanskritText: '',
  meaning: '',
  realLifeApplication: '',
  studyApplication: '',
  personalReflection: '',
  date: format(new Date(), 'yyyy-MM-dd')
});

// ─── Section label component ─────────────────────────────────────────────────
function SectionLabel({ emoji, title, sub, required, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <label style={{
        fontSize: 13, fontWeight: 700,
        color: color || 'var(--text)',
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: BENGALI_FONT,
      }}>
        {emoji && <span>{emoji}</span>}
        {title}
        {required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
        {!required && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400, marginLeft: 4 }}>(ঐচ্ছিক)</span>}
      </label>
      {sub && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: BENGALI_FONT }}>{sub}</div>
      )}
    </div>
  );
}

// ─── Section card for view modal ─────────────────────────────────────────────
function ViewSection({ emoji, label, text, borderColor, bgColor, textColor }) {
  if (!text) return null;
  return (
    <div style={{
      background: bgColor || 'var(--surface-2)',
      border: `1px solid ${borderColor ? borderColor + '33' : 'var(--border)'}`,
      borderLeft: `3px solid ${borderColor || 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '14px 16px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: textColor || borderColor || 'var(--text-2)', marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        {emoji && <span>{emoji}</span>} {label}
      </div>
      <div style={{
        fontSize: 14, color: 'var(--text)', lineHeight: 1.8,
        whiteSpace: 'pre-wrap', fontFamily: BENGALI_FONT,
      }}>
        {text}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GitaShloka() {
  const [todayShloka, setTodayShloka] = useState(null);
  const [shlokas, setShlokas] = useState([]);
  const [stats, setStats] = useState({ totalShlokas: 0, thisMonth: 0, favorites: 0, currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [chapterFilter, setChapterFilter] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showQuickPick, setShowQuickPick] = useState(false);
  const [editingShloka, setEditingShloka] = useState(null);
  const [viewingShloka, setViewingShloka] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [formData, setFormData] = useState(emptyForm());
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const today = await getTodayGitaShloka();
      setTodayShloka(today || null);
      const s = await getGitaStats();
      setStats(s);
      const list = await searchShlokas({ query: searchQuery, chapter: chapterFilter, favoritesOnly });
      setShlokas(list);
    } catch (err) {
      console.error('[GitaShloka] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [searchQuery, chapterFilter, favoritesOnly]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleOpenAdd = () => {
    if (!canEdit()) { requireEditPermission('add gita shloka'); return; }
    setEditingShloka(null);
    setFormData(emptyForm());
    setFormError('');
    setShowQuickPick(false);
    setShowModal(true);
  };

  const handleOpenEdit = (shloka) => {
    if (!canEdit()) { requireEditPermission('edit gita shloka'); return; }
    setEditingShloka(shloka);
    setFormData({
      chapter:            shloka.chapter || '',
      verse:              shloka.verse || '',
      sanskritText:       shloka.sanskritText || '',
      meaning:            shloka.meaning || '',
      realLifeApplication:shloka.realLifeApplication || '',
      studyApplication:   shloka.studyApplication || '',
      personalReflection: shloka.personalReflection || '',
      date:               shloka.date || format(new Date(), 'yyyy-MM-dd'),
    });
    setFormError('');
    setShowQuickPick(false);
    setShowModal(true);
  };

  const handleSelectPopular = (pop) => {
    if (!canEdit()) { requireEditPermission('select popular shloka'); return; }
    setFormData((prev) => ({
      ...prev,
      chapter:            pop.chapter,
      verse:              pop.verse,
      sanskritText:       pop.sanskritText,
      meaning:            pop.meaning,
      // Keep user's own application/reflection — don't overwrite with presets
      realLifeApplication: prev.realLifeApplication,
      studyApplication:    prev.studyApplication,
      personalReflection:  pop.personalReflection || prev.personalReflection,
    }));
    setShowQuickPick(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit()) { requireEditPermission('save gita shloka'); return; }
    if (!formData.sanskritText?.trim()) {
      setFormError('মূল শ্লোক আবশ্যক।');
      return;
    }
    try {
      if (editingShloka) {
        await updateGitaShloka(editingShloka.id || editingShloka._id, formData);
        showToast('শ্লোক সফলভাবে আপডেট করা হয়েছে ✓');
      } else {
        await addGitaShloka(formData);
        showToast('আজকের শ্লোক সফলভাবে সংরক্ষিত হয়েছে ✓');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('[GitaShloka] Save error:', err);
      setFormError('সংরক্ষণ করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    }
  };

  const handleDelete = async (id) => {
    if (!canEdit()) { requireEditPermission('delete gita shloka'); return; }
    if (window.confirm('আপনি কি এই গীতা শ্লোকটি মুছে ফেলতে চান?')) {
      await deleteGitaShloka(id);
      showToast('শ্লোক মুছে ফেলা হয়েছে।');
      if (viewingShloka && (viewingShloka.id === id || viewingShloka._id === id)) setViewingShloka(null);
      loadData();
    }
  };

  const handleToggleFavorite = async (id) => {
    if (!canEdit()) { requireEditPermission('toggle gita favorite'); return; }
    await toggleGitaFavorite(id);
    loadData();
  };

  const set = (field) => (e) => setFormData((prev) => ({ ...prev, [field]: e.target.value }));

  if (loading && shlokas.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div>
      {/* Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: 'var(--success)', color: '#fff',
          padding: '12px 20px', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle size={18} /> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">দৈনিক গীতা শ্লোক (Daily Gita Shloka)</h1>
          <p className="page-subtitle">বাংলা অর্থ, বাস্তব প্রয়োগ ও আত্মিক অনুপ্রেরণা সহ দৈনিক গীতা পাঠ</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} /> আজকের শ্লোক যোগ করুন
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24">
        {[
          { icon: '📖', value: stats.totalShlokas, label: 'মোট শ্লোক' },
          { icon: '📅', value: stats.thisMonth, label: 'এই মাসে' },
          { icon: '⭐', value: stats.favorites, label: 'পছন্দের' },
          { icon: '🔥', value: `${stats.currentStreak}`, sub: `/ সর্বোচ্চ ${stats.longestStreak}`, label: 'ধারাবাহিকতা', warn: true },
        ].map((s, i) => (
          <div key={i} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.warn ? 'var(--warning)' : undefined }}>
              {s.value}{s.sub && <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400 }}> {s.sub}</span>}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Today's Shloka Card */}
      <div className="card mb-24" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))',
        border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-xl)', padding: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24 }}>📖</span>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: BENGALI_FONT }}>আজকের গীতা শ্লোক</h2>
            {todayShloka && (
              <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={12} /> সংরক্ষিত ✓
              </span>
            )}
          </div>
          {todayShloka ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleToggleFavorite(todayShloka.id || todayShloka._id)} title="পছন্দের তালিকা">
                <Star size={15} fill={todayShloka.favorite ? 'var(--warning)' : 'none'} color={todayShloka.favorite ? 'var(--warning)' : 'var(--text-2)'} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleOpenEdit(todayShloka)}>
                <Edit3 size={14} /> সম্পাদনা
              </button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(todayShloka.id || todayShloka._id)}>
                <Trash2 size={14} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              <Plus size={14} /> শ্লোক যোগ করুন
            </button>
          )}
        </div>

        {todayShloka ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(todayShloka.chapter || todayShloka.verse) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="badge badge-primary" style={{ fontSize: 12 }}>
                  অধ্যায় {todayShloka.chapter || '?'} • শ্লোক {todayShloka.verse || '?'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-3)' }}>📅 {todayShloka.date}</span>
              </div>
            )}
            {/* Original Shloka */}
            <div style={{
              fontSize: 19, fontWeight: 600, lineHeight: 1.8, color: 'var(--primary-light)',
              fontFamily: BENGALI_FONT, padding: '16px 20px',
              background: 'var(--surface-2)', borderRadius: 'var(--radius)',
              borderLeft: '4px solid var(--primary)', whiteSpace: 'pre-wrap'
            }}>
              {todayShloka.sanskritText}
            </div>
            {/* Bengali Meaning */}
            {todayShloka.meaning && (
              <ViewSection emoji="📜" label="বাংলা ভাবার্থ ও অনুবাদ" text={todayShloka.meaning}
                borderColor="var(--primary)" bgColor="rgba(99,102,241,0.05)" textColor="var(--primary-light)" />
            )}
            {/* Real Life Application */}
            {todayShloka.realLifeApplication && (
              <ViewSection emoji="🌍" label="বাস্তব জীবনে কীভাবে প্রয়োগ করব" text={todayShloka.realLifeApplication}
                borderColor="#10b981" bgColor="rgba(16,185,129,0.05)" textColor="#10b981" />
            )}
            {/* Study Application */}
            {todayShloka.studyApplication && (
              <ViewSection emoji="📚" label="পড়াশোনায় কীভাবে সাহায্য করবে" text={todayShloka.studyApplication}
                borderColor="#3b82f6" bgColor="rgba(59,130,246,0.05)" textColor="#60a5fa" />
            )}
            {/* Personal Reflection */}
            {todayShloka.personalReflection && (
              <ViewSection emoji="🧘" label="ব্যক্তিগত উপলব্ধি ও চিন্তন" text={todayShloka.personalReflection}
                borderColor="var(--warning)" bgColor="rgba(245,158,11,0.05)" textColor="var(--warning)" />
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-2)' }}>
            <p style={{ margin: '0 0 12px', fontSize: 14, fontFamily: BENGALI_FONT }}>
              আজকের জন্য এখনও কোনো গীতা শ্লোক এন্ট্রি করা হয়নি।
            </p>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
              + বাংলা ভাষায় আজকের শ্লোক লিখুন
            </button>
          </div>
        )}
      </div>

      {/* History & Search */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>পূর্ববর্তী শ্লোক সংগ্রহ</h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input type="text" className="form-input form-input-sm" placeholder="শ্লোক বা বাংলা শব্দ খুঁজুন..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ paddingLeft: 30, width: '100%' }} />
          </div>
          <select className="form-select form-select-sm" value={chapterFilter} onChange={(e) => setChapterFilter(e.target.value)}
            style={{ flex: '0 0 auto', minWidth: 110 }}>
            <option value="">সকল অধ্যায়</option>
            {Array.from({ length: 18 }, (_, i) => i + 1).map((ch) => (
              <option key={ch} value={ch}>অধ্যায় {ch}</option>
            ))}
          </select>
          <button className={`btn btn-sm ${favoritesOnly ? 'btn-warning' : 'btn-ghost'}`} onClick={() => setFavoritesOnly(!favoritesOnly)}>
            <Star size={13} fill={favoritesOnly ? '#fff' : 'none'} /> পছন্দের ({stats.favorites})
          </button>
        </div>

        {shlokas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <div className="empty-title">কোনো শ্লোক পাওয়া যায়নি</div>
            <div className="empty-desc">বাংলায় আপনার পছন্দের গীতা শ্লোক ও উপলব্ধি লিপিবদ্ধ করে রাখুন।</div>
            <button className="btn btn-primary btn-sm" onClick={handleOpenAdd} style={{ marginTop: 12 }}>
              + নতুন শ্লোক যোগ করুন
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {shlokas.map((shloka) => (
              <div key={shloka.id || shloka._id} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
                    <span className="badge badge-primary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                      {(shloka.chapter || shloka.verse) ? `অধ্যায় ${shloka.chapter || '?'} • শ্লোক ${shloka.verse || '?'}` : 'গীতা পাঠ'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{shloka.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleToggleFavorite(shloka.id || shloka._id)}>
                      <Star size={13} fill={shloka.favorite ? 'var(--warning)' : 'none'} color={shloka.favorite ? 'var(--warning)' : 'var(--text-3)'} />
                    </button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setViewingShloka(shloka)}>
                      <Eye size={13} />
                    </button>
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => handleOpenEdit(shloka)}>
                      <Edit3 size={13} />
                    </button>
                    <button className="btn btn-icon btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(shloka.id || shloka._id)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', fontFamily: BENGALI_FONT, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {shloka.sanskritText}
                </div>
                {shloka.meaning && (
                  <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4, fontFamily: BENGALI_FONT, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                    {shloka.meaning}
                  </div>
                )}
                {/* Show indicator dots for which optional sections are filled */}
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {shloka.realLifeApplication && <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>🌍 বাস্তব প্রয়োগ</span>}
                  {shloka.studyApplication && <span style={{ fontSize: 10, background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>📚 পড়াশোনা</span>}
                  {shloka.personalReflection && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', padding: '2px 7px', borderRadius: 999, fontWeight: 600 }}>🧘 উপলব্ধি</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 660, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Fixed header */}
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2 className="modal-title" style={{ fontFamily: BENGALI_FONT }}>
                {editingShloka ? '✏️ শ্লোক সম্পাদনা করুন' : '➕ আজকের গীতা শ্লোক যোগ করুন'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="বন্ধ করুন">
                <X size={14} />
              </button>
            </div>

            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 4px' }}>

              {/* Quick Pick banner */}
              {!editingShloka && (
                <div style={{
                  background: 'rgba(99,102,241,0.08)', border: '1px solid var(--border-accent)',
                  borderRadius: 'var(--radius)', padding: '10px 14px', marginBottom: 16,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontFamily: BENGALI_FONT }}>
                    💡 জনপ্রিয় গীতা শ্লোক সরাসরি নির্বাচন করতে চান?
                  </span>
                  <button type="button" className="btn btn-xs btn-primary" onClick={() => setShowQuickPick(!showQuickPick)}>
                    <Sparkles size={12} /> {showQuickPick ? 'বন্ধ করুন' : 'শ্লোক নির্বাচন'}
                  </button>
                </div>
              )}

              {/* Quick Pick list */}
              {showQuickPick && (
                <div style={{
                  background: 'var(--surface-3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: 12, marginBottom: 16,
                  maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>
                    নির্বাচন করুন:
                  </div>
                  {popularBengaliShlokas.map((pop) => (
                    <div key={`${pop.chapter}-${pop.verse}`} onClick={() => handleSelectPopular(pop)} style={{
                      padding: '8px 12px', borderRadius: 6, background: 'var(--surface-2)',
                      border: '1px solid var(--border)', cursor: 'pointer', fontSize: 12,
                      transition: 'var(--transition)', fontFamily: BENGALI_FONT,
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                        অধ্যায় {pop.chapter} • শ্লোক {pop.verse}
                      </div>
                      <div style={{ color: 'var(--text)', marginTop: 2 }}>{pop.sanskritText.split('\n')[0]}</div>
                      <div style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pop.meaning}</div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {formError && (
                  <div style={{ background: 'var(--danger-glass)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 13 }}>
                    ⚠️ {formError}
                  </div>
                )}

                {/* 1 + 2: Chapter & Verse — two cols on desktop, stacked on mobile */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <SectionLabel title="অধ্যায় নং" sub="Chapter Number" />
                    <input type="number" className="form-input" placeholder="যেমন: 2"
                      min="1" max="18" value={formData.chapter} onChange={set('chapter')} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <SectionLabel title="শ্লোক নং" sub="Verse Number" />
                    <input type="text" className="form-input" placeholder="যেমন: 47"
                      value={formData.verse} onChange={set('verse')} />
                  </div>
                </div>

                {/* 3: Original Shloka */}
                <div className="form-group" style={{ margin: 0 }}>
                  <SectionLabel emoji="🕉️" title="মূল শ্লোক" sub="বাংলা বা দেবনাগরী হরফে লিখুন" required />
                  <textarea className="form-textarea" rows={3} required
                    placeholder="এখানে শ্লোকটি লিখুন..."
                    value={formData.sanskritText} onChange={set('sanskritText')}
                    style={{ fontFamily: BENGALI_FONT, fontSize: 16, lineHeight: 1.7 }} />
                </div>

                {/* 4: Bengali Meaning */}
                <div className="form-group" style={{ margin: 0 }}>
                  <SectionLabel emoji="📜" title="বাংলা ভাবার্থ ও অনুবাদ" sub="Bengali Meaning" required />
                  <textarea className="form-textarea" rows={3} required
                    placeholder="শ্লোকটির সহজ বাংলা অর্থ নিজের ভাষায় লিখুন..."
                    value={formData.meaning} onChange={set('meaning')}
                    style={{ fontFamily: BENGALI_FONT, fontSize: 14, lineHeight: 1.7 }} />
                </div>

                {/* 5: Real Life Application */}
                <div className="form-group" style={{ margin: 0 }}>
                  <SectionLabel emoji="🌍" title="বাস্তব জীবনে কীভাবে প্রয়োগ করব"
                    sub="দৈনন্দিন জীবন, আচরণ, সিদ্ধান্ত — পড়াশোনার বাইরে" color="#10b981" />
                  <textarea className="form-textarea" rows={3}
                    placeholder="বাস্তব জীবনে এই শিক্ষাটি কীভাবে প্রয়োগ করবেন..."
                    value={formData.realLifeApplication} onChange={set('realLifeApplication')}
                    style={{
                      fontFamily: BENGALI_FONT, fontSize: 14, lineHeight: 1.7,
                      borderColor: formData.realLifeApplication ? 'rgba(16,185,129,0.5)' : undefined,
                      background: formData.realLifeApplication ? 'rgba(16,185,129,0.03)' : undefined,
                    }} />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: BENGALI_FONT }}>
                    উদাহরণ: সিদ্ধান্ত নেওয়ার সময় ফলের চিন্তা না করে নিজের কাজে মনোযোগ রাখা।
                  </div>
                </div>

                {/* 6: Study Application */}
                <div className="form-group" style={{ margin: 0 }}>
                  <SectionLabel emoji="📚" title="পড়াশোনায় কীভাবে সাহায্য করবে"
                    sub="একাগ্রতা, শৃঙ্খলা, পরীক্ষার প্রস্তুতি, মনোবল" color="#60a5fa" />
                  <textarea className="form-textarea" rows={3}
                    placeholder="পড়াশোনা, মনোযোগ বা পরীক্ষার প্রস্তুতিতে এটি কীভাবে সাহায্য করবে..."
                    value={formData.studyApplication} onChange={set('studyApplication')}
                    style={{
                      fontFamily: BENGALI_FONT, fontSize: 14, lineHeight: 1.7,
                      borderColor: formData.studyApplication ? 'rgba(59,130,246,0.5)' : undefined,
                      background: formData.studyApplication ? 'rgba(59,130,246,0.03)' : undefined,
                    }} />
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4, fontFamily: BENGALI_FONT }}>
                    উদাহরণ: পরীক্ষার ফল নিয়ে অতিরিক্ত চিন্তা না করে প্রতিদিনের পড়াশোনায় মনোযোগ দেওয়া।
                  </div>
                </div>

                {/* 7: Personal Reflection */}
                <div className="form-group" style={{ margin: 0 }}>
                  <SectionLabel emoji="🧘" title="ব্যক্তিগত উপলব্ধি ও চিন্তন"
                    sub="Personal Reflection" color="var(--warning)" />
                  <textarea className="form-textarea" rows={2}
                    placeholder="আজ এই শ্লোক থেকে আমি কী শিখলাম?..."
                    value={formData.personalReflection} onChange={set('personalReflection')}
                    style={{
                      fontFamily: BENGALI_FONT, fontSize: 14, lineHeight: 1.7,
                      borderColor: formData.personalReflection ? 'rgba(245,158,11,0.4)' : undefined,
                      background: formData.personalReflection ? 'rgba(245,158,11,0.03)' : undefined,
                    }} />
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingBottom: 4, flexWrap: 'wrap' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    বাতিল
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingShloka ? '✓ পরিবর্তন সংরক্ষণ করুন' : '✓ শ্লোক সংরক্ষণ করুন'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAIL MODAL ────────────────────────────────────────────── */}
      {viewingShloka && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewingShloka(null)}>
          <div className="modal" style={{ maxWidth: 640, width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            {/* Fixed header */}
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <h2 className="modal-title" style={{ fontFamily: BENGALI_FONT }}>
                {(viewingShloka.chapter || viewingShloka.verse)
                  ? `অধ্যায় ${viewingShloka.chapter || '?'} • শ্লোক ${viewingShloka.verse || '?'}`
                  : '🕉️ গীতা শ্লোক'}
              </h2>
              <button className="modal-close" onClick={() => setViewingShloka(null)} aria-label="বন্ধ করুন">
                <X size={14} />
              </button>
            </div>

            {/* Scrollable content */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Date */}
              <div style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={12} /> তারিখ: {viewingShloka.date}
              </div>

              {/* 1. Original Shloka */}
              <div style={{
                fontSize: 19, fontWeight: 600, lineHeight: 1.8, color: 'var(--primary-light)',
                background: 'var(--surface-2)', padding: '16px 20px', borderRadius: 'var(--radius)',
                fontFamily: BENGALI_FONT, whiteSpace: 'pre-wrap', borderLeft: '4px solid var(--primary)',
              }}>
                {viewingShloka.sanskritText}
              </div>

              {/* 2. Bengali Meaning */}
              <ViewSection emoji="📜" label="বাংলা ভাবার্থ ও অনুবাদ" text={viewingShloka.meaning}
                borderColor="var(--primary)" bgColor="rgba(99,102,241,0.05)" textColor="var(--primary-light)" />

              {/* 3. Real Life Application */}
              <ViewSection emoji="🌍" label="বাস্তব জীবনে কীভাবে প্রয়োগ করব" text={viewingShloka.realLifeApplication}
                borderColor="#10b981" bgColor="rgba(16,185,129,0.05)" textColor="#10b981" />

              {/* 4. Study Application */}
              <ViewSection emoji="📚" label="পড়াশোনায় কীভাবে সাহায্য করবে" text={viewingShloka.studyApplication}
                borderColor="#3b82f6" bgColor="rgba(59,130,246,0.05)" textColor="#60a5fa" />

              {/* 5. Personal Reflection */}
              <ViewSection emoji="🧘" label="ব্যক্তিগত উপলব্ধি ও চিন্তন" text={viewingShloka.personalReflection}
                borderColor="var(--warning)" bgColor="rgba(245,158,11,0.05)" textColor="var(--warning)" />

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, paddingBottom: 2, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                  onClick={() => { handleDelete(viewingShloka.id || viewingShloka._id); }}>
                  <Trash2 size={13} /> মুছুন
                </button>
                <button className="btn btn-ghost btn-sm"
                  onClick={() => { handleOpenEdit(viewingShloka); setViewingShloka(null); }}>
                  <Edit3 size={13} /> সম্পাদনা
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => setViewingShloka(null)}>
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
