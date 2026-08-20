// src/pages/GitaShloka.jsx
// Daily Bhagavad Gita Shloka & Spiritual Meditation Portal
// Features: Harmonic 136.1Hz Om (ॐ) Synthesizer, Sacred Chimes, Bengali Translation,
// Exam Focus Reflections, and Complete Mobile Responsiveness.

import { useEffect, useState, useRef } from 'react';
import { format } from 'date-fns';
import {
  BookOpen, Plus, Star, Search, Edit3, Trash2, CheckCircle,
  Flame, X, Sparkles, Eye, Calendar, Volume2, VolumeX, Play,
  Pause, Bell, Sun, Music, Shield, RefreshCw
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

// ─── Web Audio API Cosmic 136.1Hz Om (ॐ) Sound Engine ────────────────────────
class OmSoundEngine {
  constructor() {
    this.ctx = null;
    this.oscillators = [];
    this.masterGain = null;
    this.isPlaying = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a single rich resonant ॐ temple bell chime (5.5s decay)
  playOmChime(volume = 0.5) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Authentic Om harmonic overtones (136.1Hz base frequency of the cosmos / Earth year vibration)
      const frequencies = [136.1, 272.2, 408.3, 544.4, 680.5, 816.6];
      const gains = [0.45, 0.28, 0.16, 0.09, 0.05, 0.02];

      frequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(gains[idx] * volume, now + 0.2);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

        osc.connect(g);
        g.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 6.0);
      });
    } catch (e) {
      console.warn('[OmSoundEngine] playOmChime error:', e);
    }
  }

  // Continuous Meditative Om Drone (ধ্যান ধ্বনি) with gentle breathing LFO
  startContinuousDrone(volume = 0.35) {
    try {
      this.init();
      if (!this.ctx || this.isPlaying) return;
      this.isPlaying = true;
      const now = this.ctx.currentTime;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.001, now);
      this.masterGain.gain.linearRampToValueAtTime(volume, now + 2.5);
      this.masterGain.connect(this.ctx.destination);

      // Low frequency LFO for gentle breath-like pulsating Om vibration (~6.5s breathing rhythm)
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.15, now);
      lfoGain.gain.setValueAtTime(volume * 0.35, now);
      lfo.connect(this.masterGain.gain);
      lfo.start(now);
      this.oscillators.push(lfo);

      // Multi-harmonic Om resonance (136.1Hz fundamental, 204.15Hz perfect fifth, 272.2Hz octave)
      const frequencies = [136.1, 136.1 * 1.5, 272.2, 408.3];
      frequencies.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime(idx * 2 - 3, now);

        const subGain = [0.35, 0.22, 0.15, 0.08][idx] || 0.1;
        g.gain.setValueAtTime(subGain, now);

        osc.connect(g);
        g.connect(this.masterGain);

        osc.start(now);
        this.oscillators.push(osc);
      });
    } catch (e) {
      console.warn('[OmSoundEngine] startContinuousDrone error:', e);
    }
  }

  stopContinuousDrone() {
    try {
      if (!this.isPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      if (this.masterGain) {
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
      }
      setTimeout(() => {
        this.oscillators.forEach((o) => {
          try { o.stop(); o.disconnect(); } catch (_) {}
        });
        this.oscillators = [];
        this.isPlaying = false;
      }, 1300);
    } catch (e) {
      console.warn('[OmSoundEngine] stopContinuousDrone error:', e);
      this.isPlaying = false;
    }
  }
}

const omAudioEngine = new OmSoundEngine();

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

  // ── Om (ॐ) Sound State ──────────────────────────────────────────────────────
  const [isOmPlaying, setIsOmPlaying] = useState(false);

  useEffect(() => {
    return () => {
      // Cleanup sound when navigating away from Gita page
      omAudioEngine.stopContinuousDrone();
    };
  }, []);

  const toggleOmDrone = () => {
    if (isOmPlaying) {
      omAudioEngine.stopContinuousDrone();
      setIsOmPlaying(false);
      showToast('ওঁ ধ্যান ধ্বনি বিরতি দেওয়া হয়েছে ⏸');
    } else {
      omAudioEngine.startContinuousDrone(0.4);
      setIsOmPlaying(true);
      showToast('🕉️ পবিত্র ওঁ ধ্যান ধ্বনি শুরু হয়েছে (136.1Hz Cosmic Resonance)');
    }
  };

  const playChimeBell = () => {
    omAudioEngine.playOmChime(0.6);
    showToast('🔔 পবিত্র ওঁ ঘণ্টা ধ্বনি বাজানো হয়েছে');
  };

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
    playChimeBell();
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
    playChimeBell();
    setFormData((prev) => ({
      ...prev,
      chapter:            pop.chapter,
      verse:              pop.verse,
      sanskritText:       pop.sanskritText,
      meaning:            pop.meaning,
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
      playChimeBell();
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
    <div style={{ position: 'relative' }}>
      {/* Ambient Divine Saffron Aura */}
      <div style={{
        position: 'absolute',
        top: -60,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        height: 280,
        background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.18) 0%, rgba(234, 88, 12, 0.08) 50%, transparent 100%)',
        filter: 'blur(50px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

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
      <div className="page-header" style={{ position: 'relative', zIndex: 1 }}>
        <div className="page-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 28,
              fontWeight: 900,
              color: '#f59e0b',
              textShadow: '0 0 15px rgba(245, 158, 11, 0.6)'
            }}>
              ॐ
            </span>
            <h1 className="page-title" style={{ fontFamily: BENGALI_FONT }}>
              দৈনিক গীতা শ্লোক (Daily Gita Shloka)
            </h1>
          </div>
          <p className="page-subtitle" style={{ fontFamily: BENGALI_FONT }}>
            বাংলা অর্থ, বাস্তব প্রয়োগ ও আত্মিক অনুপ্রেরণা সহ দৈনিক গীতা পাঠ ও প্রশান্তি
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`btn ${isOmPlaying ? 'btn-warning' : 'btn-ghost'}`}
            onClick={toggleOmDrone}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: isOmPlaying ? '0 0 16px rgba(245, 158, 11, 0.5)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isOmPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isOmPlaying ? 'ওঁ ধ্বনি থামান' : '🕉️ ওঁ ধ্যান ধ্বনি'}</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> আজকের শ্লোক যোগ করুন
          </button>
        </div>
      </div>

      {/* ── SACRED OM (ॐ) MEDITATION SOUND CARD ─────────────────────── */}
      <div
        className="card mb-24"
        style={{
          background: isOmPlaying
            ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.16), rgba(234, 88, 12, 0.1))'
            : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(26, 26, 46, 0.6))',
          border: `1px solid ${isOmPlaying ? 'rgba(245, 158, 11, 0.6)' : 'rgba(245, 158, 11, 0.25)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '18px 22px',
          boxShadow: isOmPlaying ? '0 8px 30px rgba(245, 158, 11, 0.25)' : 'var(--shadow)',
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.3s ease'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              onClick={playChimeBell}
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(234, 88, 12, 0.15))',
                border: '1px solid rgba(245, 158, 11, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 900,
                color: '#f59e0b',
                cursor: 'pointer',
                boxShadow: isOmPlaying ? '0 0 25px rgba(245, 158, 11, 0.6)' : '0 0 12px rgba(245, 158, 11, 0.25)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              title="ক্লিক করে পবিত্র ওঁ ঘণ্টা ধ্বনি শুনুন"
            >
              ॐ
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', margin: 0, fontFamily: BENGALI_FONT }}>
                  পবিত্র ওঁ ধ্যান ও চিত্তশুদ্ধি ধ্বনি (Om Meditation Resonance)
                </h3>
                {isOmPlaying && (
                  <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 8px' }}>
                    ● ধ্বনি সক্রিয় (136.1Hz)
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '3px 0 0 0', fontFamily: BENGALI_FONT }}>
                “ওঁ তৎ সৎ” — গীতা শ্লোক পাঠ ও গভীর অধ্যয়নের পূর্বে মনকে স্থির, শান্ত ও একাগ্র করতে পবিত্র ওঁ ধ্বনি শুনুন।
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={playChimeBell}
              className="btn btn-ghost btn-sm"
              style={{
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="একবার ঘণ্টা ধ্বনি বাজান"
            >
              <Bell size={14} /> <span>ঘণ্টা ধ্বনি</span>
            </button>
            <button
              onClick={toggleOmDrone}
              className={`btn btn-sm ${isOmPlaying ? 'btn-warning' : 'btn-primary'}`}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              {isOmPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isOmPlaying ? 'থামান' : 'ধ্যান ধ্বনি চালান'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4 mb-24" style={{ position: 'relative', zIndex: 1 }}>
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
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(245,158,11,0.04))',
        border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-xl)', padding: 24,
        position: 'relative', zIndex: 1
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
              <button className="btn btn-ghost btn-sm" onClick={playChimeBell} title="পবিত্র ঘণ্টা ধ্বনি">
                <Bell size={14} color="#f59e0b" />
              </button>
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
      <div className="card" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, fontFamily: BENGALI_FONT }}>পূর্ববর্তী শ্লোক সংগ্রহ</h2>
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
                    <button className="btn btn-icon btn-ghost btn-sm" onClick={() => { playChimeBell(); setViewingShloka(shloka); }}>
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
                <div style={{
                  fontSize: 14, color: 'var(--text)', lineHeight: 1.6,
                  fontFamily: BENGALI_FONT, marginBottom: 6,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  {shloka.sanskritText}
                </div>
                {shloka.meaning && (
                  <div style={{
                    fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5,
                    fontFamily: BENGALI_FONT,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {shloka.meaning}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingShloka && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewingShloka(null)}>
          <div className="modal" style={{ maxWidth: 540, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>ॐ</span>
                <h2 className="modal-title" style={{ fontFamily: BENGALI_FONT }}>
                  {(viewingShloka.chapter || viewingShloka.verse) ? `অধ্যায় ${viewingShloka.chapter || '?'} • শ্লোক ${viewingShloka.verse || '?'}` : 'গীতা শ্লোক'}
                </h2>
              </div>
              <button className="modal-close" onClick={() => setViewingShloka(null)} aria-label="বন্ধ করুন">
                <X size={16} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              {/* Sanskrit Text */}
              <div style={{
                fontSize: 18, fontWeight: 600, lineHeight: 1.8, color: 'var(--primary-light)',
                fontFamily: BENGALI_FONT, padding: '16px 18px',
                background: 'var(--surface-2)', borderRadius: 'var(--radius)',
                borderLeft: '4px solid var(--primary)', whiteSpace: 'pre-wrap'
              }}>
                {viewingShloka.sanskritText}
              </div>

              {viewingShloka.meaning && (
                <ViewSection emoji="📜" label="বাংলা ভাবার্থ ও অনুবাদ" text={viewingShloka.meaning}
                  borderColor="var(--primary)" bgColor="rgba(99,102,241,0.05)" textColor="var(--primary-light)" />
              )}
              {viewingShloka.realLifeApplication && (
                <ViewSection emoji="🌍" label="বাস্তব জীবনে প্রয়োগ" text={viewingShloka.realLifeApplication}
                  borderColor="#10b981" bgColor="rgba(16,185,129,0.05)" textColor="#10b981" />
              )}
              {viewingShloka.studyApplication && (
                <ViewSection emoji="📚" label="পড়াশোনায় সাহায্য" text={viewingShloka.studyApplication}
                  borderColor="#3b82f6" bgColor="rgba(59,130,246,0.05)" textColor="#60a5fa" />
              )}
              {viewingShloka.personalReflection && (
                <ViewSection emoji="🧘" label="ব্যক্তিগত উপলব্ধি" text={viewingShloka.personalReflection}
                  borderColor="var(--warning)" bgColor="rgba(245,158,11,0.05)" textColor="var(--warning)" />
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { playChimeBell(); handleToggleFavorite(viewingShloka.id || viewingShloka._id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Star size={14} fill={viewingShloka.favorite ? 'var(--warning)' : 'none'} color={viewingShloka.favorite ? 'var(--warning)' : 'var(--text-2)'} />
                <span>{viewingShloka.favorite ? 'পছন্দের তালিকাভুক্ত' : 'পছন্দ করুন'}</span>
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { handleOpenEdit(viewingShloka); setViewingShloka(null); }}>
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>ॐ</span>
                <h2 className="modal-title" style={{ fontFamily: BENGALI_FONT }}>
                  {editingShloka ? 'শ্লোক সম্পাদনা করুন' : 'নতুন গীতা শ্লোক যোগ করুন'}
                </h2>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            {/* Quick Pick Banner */}
            <div style={{ padding: '10px 20px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', fontFamily: BENGALI_FONT }}>
                ✨ বিখ্যাত শ্লোক বেছে নিতে চান?
              </span>
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                style={{ color: 'var(--primary-light)', fontWeight: 600, fontFamily: BENGALI_FONT }}
                onClick={() => setShowQuickPick(!showQuickPick)}
              >
                {showQuickPick ? 'বন্ধ করুন ▲' : 'বাছাই করুন ▼'}
              </button>
            </div>

            {/* Quick Pick Dropdown list */}
            {showQuickPick && (
              <div style={{ padding: '10px 20px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto', flexShrink: 0 }}>
                {popularBengaliShlokas.map((pop, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectPopular(pop)}
                    style={{
                      padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-2)',
                      cursor: 'pointer', fontSize: 12, transition: 'var(--transition)'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>অধ্যায় {pop.chapter}, শ্লোক {pop.verse}: </span>
                    <span style={{ color: 'var(--text-2)', fontFamily: BENGALI_FONT }}>{pop.sanskritText.slice(0, 40)}...</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSave} style={{ overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              {formError && (
                <div style={{ padding: '8px 12px', background: 'var(--danger-glass)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                  {formError}
                </div>
              )}

              {/* Chapter and Verse */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <SectionLabel title="অধ্যায়" required={false} />
                  <input type="number" min="1" max="18" className="form-input" placeholder="যেমন: 2" value={formData.chapter} onChange={set('chapter')} />
                </div>
                <div className="form-group">
                  <SectionLabel title="শ্লোক নম্বর" required={false} />
                  <input type="number" min="1" className="form-input" placeholder="যেমন: 47" value={formData.verse} onChange={set('verse')} />
                </div>
              </div>

              {/* Sanskrit Text */}
              <div className="form-group">
                <SectionLabel emoji="📖" title="মূল শ্লোক (সংস্কৃত / বাংলা হরফে)" sub="গীতার মূল শ্লোকটি লিখুন বা পেস্ট করুন" required={true} />
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="যেমন: কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন..."
                  value={formData.sanskritText}
                  onChange={set('sanskritText')}
                  style={{ fontFamily: BENGALI_FONT, fontSize: 14 }}
                  required
                />
              </div>

              {/* Bengali Meaning */}
              <div className="form-group">
                <SectionLabel emoji="📜" title="বাংলা ভাবার্থ ও অনুবাদ" sub="শ্লোকটির বাংলা সরল অর্থ" required={false} />
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="শ্লোকের বাংলা অর্থ লিখুন..."
                  value={formData.meaning}
                  onChange={set('meaning')}
                  style={{ fontFamily: BENGALI_FONT, fontSize: 13 }}
                />
              </div>

              {/* Real Life Application */}
              <div className="form-group">
                <SectionLabel emoji="🌍" title="বাস্তব জীবনে কীভাবে প্রয়োগ করব" sub="দৈনন্দিন জীবনে এই শ্লোকের শিক্ষা" required={false} />
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="যেমন: ফলাফলের চিন্তা না করে কাজে মনোযোগ দেওয়া..."
                  value={formData.realLifeApplication}
                  onChange={set('realLifeApplication')}
                  style={{ fontFamily: BENGALI_FONT, fontSize: 13 }}
                />
              </div>

              {/* Study Application */}
              <div className="form-group">
                <SectionLabel emoji="📚" title="পড়াশোনায় কীভাবে সাহায্য করবে" sub="পরীক্ষার প্রস্তুতি ও অধ্যবসায়ে এই শ্লোকের ভূমিকা" required={false} />
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="যেমন: কঠিন সাবজেক্ট পড়ার সময় ভয় না পেয়ে নিষ্ঠার সাথে চেষ্টা করা..."
                  value={formData.studyApplication}
                  onChange={set('studyApplication')}
                  style={{ fontFamily: BENGALI_FONT, fontSize: 13 }}
                />
              </div>

              {/* Personal Reflection */}
              <div className="form-group">
                <SectionLabel emoji="🧘" title="ব্যক্তিগত উপলব্ধি ও চিন্তন" sub="আপনার নিজের মনের চিন্তা বা অনুভূতি" required={false} />
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="আপনার নিজস্ব উপলব্ধি লিখুন..."
                  value={formData.personalReflection}
                  onChange={set('personalReflection')}
                  style={{ fontFamily: BENGALI_FONT, fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingShloka ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
