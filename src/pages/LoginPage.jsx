// src/pages/LoginPage.jsx
// Premium High-Converting Promotional Landing with Instant Pop-up Login Modal

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Fingerprint, KeyRound, ShieldAlert, Check, ArrowRight,
  Sparkles, Calendar, RotateCcw, BarChart3, BookOpen,
  Zap, Bell, Award, Flame, BookMarked, Lock, Key, AlertCircle,
  CheckCircle2, ShieldCheck, Target, TrendingUp, HelpCircle,
  Smartphone, Clock, Brain, Compass, Cpu, Layers, Star, ExternalLink,
  ChevronRight, Eye, Shield, X
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const EXAM_BADGES = [
  { name: 'WBPSC Clerkship', icon: '🏛️' },
  { name: 'WBCS Executive', icon: '🎯' },
  { name: 'WB Miscellaneous', icon: '📜' },
  { name: 'SSC CGL / CHSL', icon: '💼' },
  { name: 'Railways NTPC', icon: '🚆' },
  { name: 'Banking IBPS / SBI', icon: '🏦' },
  { name: 'WB Primary TET', icon: '🏫' },
  { name: 'Food SI & Police SI', icon: '👮' },
];

const METRICS = [
  { value: '99.4%', label: 'Long-Term Retention', sub: '5-Stage Ebbinghaus SRS algorithm' },
  { value: '100%', label: 'Offline & Private', sub: 'Zero cloud latency, Dexie IndexedDB' },
  { value: 'FIDO2', label: 'Hardware Passkeys', sub: 'Biometric fingerprint & Face ID' },
  { value: '0 Mins', label: 'Zero Distractions', sub: 'Ad-free, high-yield focused UI' }
];

const ALL_FEATURES = [
  {
    id: 'planner',
    title: 'Smart Daily Routine Engine',
    badge: 'AI Planner',
    icon: Calendar,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)',
    tagline: 'Intelligent daily scheduling around energy peaks & commitments',
    desc: 'Auto-generates optimized daily study blocks based on target hours while strictly respecting teaching commitments and cognitive focus intervals.',
    chips: ['Day/Week/Month Views', 'Conflict Shield', 'Auto-Optimizer']
  },
  {
    id: 'srs',
    title: '5-Stage Spaced Repetition (SRS)',
    badge: 'Memory Science',
    icon: RotateCcw,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.15)',
    tagline: 'Defeat the forgetting curve with mathematical revision triggers',
    desc: 'Automatically schedules topic reviews at 1, 3, 7, 14, and 30-day intervals so critical concepts transition permanently into your long-term memory.',
    chips: ['Ebbinghaus Curve', 'Mastery Stages', 'Never Forget']
  },
  {
    id: 'diagnostics',
    title: 'Mock Diagnostics & Error Log',
    badge: 'Weakness Killer',
    icon: BarChart3,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    tagline: 'Categorize & eradicate test mistakes to gain guaranteed marks',
    desc: 'Deep-dive into test errors by categorizing mistakes into Conceptual, Silly Mistakes, or Calculation slips. Auto-generates targeted recovery sessions.',
    chips: ['Root-Cause Analysis', 'Subject Radar', 'Error Recovery']
  },
  {
    id: 'gita',
    title: 'Daily Gita Shloka & Wisdom',
    badge: 'Mental Clarity',
    icon: BookOpen,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    tagline: 'Build unbreakable mental focus, resilience & inner calm',
    desc: 'Start each preparation day with inspiring Bhagavad Gita shlokas in Sanskrit, with authentic Bengali pronunciation, deep meaning, and practical reflection.',
    chips: ['Bengali Phonetics', 'Daily Reflections', 'Exam Mindset']
  },
  {
    id: 'vocab',
    title: 'Bilingual Vocabulary Builder',
    badge: 'Language Edge',
    icon: BookMarked,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    tagline: '10 High-Yield words daily with Bengali meanings & audio',
    desc: 'Master English for WBPSC, SSC, and Banking with real-time dictionary lookups, phonetic pronunciation, parts of speech, synonyms, and daily mastery tests.',
    chips: ['10 Words Daily', 'Bengali Meanings', 'Audio Pronounce']
  },
  {
    id: 'pwa',
    title: 'Smart Reminders & Offline PWA',
    badge: 'Offline & Mobile',
    icon: Bell,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    tagline: 'Your complete study companion on Android, iOS & Windows',
    desc: '5-minute pre-study audio-visual alerts, seamless background synchronization, and full offline functionality even without active internet access.',
    chips: ['5-Min Alerts', 'Local Dexie DB', 'Installable PWA']
  }
];

const MODULE_PREVIEWS = {
  planner: {
    title: 'Smart Daily Routine Engine',
    subtitle: 'Auto-scheduled flow for peak cognitive retention',
    items: [
      { time: '07:00 – 08:30', title: 'Indian Polity (Fundamental Rights)', type: 'High Yield', color: '#6366f1' },
      { time: '09:00 – 10:00', title: '🏫 Morning Teaching Slot (Protected)', type: 'Teaching', color: '#f59e0b' },
      { time: '10:30 – 11:45', title: 'Quantitative Aptitude (Arithmetic)', type: 'Practice Drill', color: '#06b6d4' },
      { time: '14:00 – 15:00', title: '🔄 SRS Stage-3 Revision (Modern History)', type: 'Revision Due', color: '#22c55e' }
    ]
  },
  srs: {
    title: '5-Stage Spaced Repetition (SRS)',
    subtitle: 'Automated 1, 3, 7, 14, 30 day interval tracking',
    items: [
      { time: 'Stage 1 (Day 1)', title: 'West Bengal Geography & Rivers', type: 'Retention: 98%', color: '#22c55e' },
      { time: 'Stage 3 (Day 7)', title: 'Indian Constitution Amendments', type: 'Retention: 91%', color: '#6366f1' },
      { time: 'Stage 5 (Day 30)', title: 'Percentage & Compound Interest', type: 'Permanent Memory', color: '#ec4899' }
    ]
  },
  diagnostics: {
    title: 'Mock Diagnostics & Error Log',
    subtitle: 'Systematic elimination of repeated exam errors',
    items: [
      { time: 'Conceptual Gaps (35%)', title: 'Governor Powers & Ordinances', type: 'Priority Fix', color: '#ef4444' },
      { time: 'Silly Slips (45%)', title: 'Unit Conversion in Time & Distance', type: 'Avoidable -1.33m', color: '#f59e0b' },
      { time: 'Speed / Timeout (20%)', title: 'Reading Comprehension Passage 2', type: 'Time Drill', color: '#06b6d4' }
    ]
  },
  gita: {
    title: 'Daily Gita Shloka & Wisdom',
    subtitle: 'Authentic Sanskrit verses & Bengali aspirant reflections',
    items: [
      { time: 'BG 2.47', title: 'কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন...', type: 'Sanskrit', color: '#f59e0b' },
      { time: 'Bengali Meaning', title: 'কর্মে তোমার অধিকার, ফলাফলে কখনো নয়—একনিষ্ঠ প্রচেষ্টাই বিজয়ের দ্বার।', type: 'Wisdom', color: '#818cf8' },
      { time: 'Aspirant Takeaway', title: 'ফলাফলের উদ্বেগ ত্যাগ করে আজকের দৈনিক লক্ষ্যে ১০০% মনোনিবেশ করো।', type: 'Mindset', color: '#22c55e' }
    ]
  },
  vocab: {
    title: 'Bilingual Vocabulary Builder',
    subtitle: 'Exam-focused Oxford dictionary lookup & Bengali translation',
    items: [
      { time: 'Word: Resilient (adj.)', title: 'স্থিতিস্থাপক / প্রতিকূলতা কাটিয়ে উঠতে সক্ষম', type: 'High Yield', color: '#ec4899' },
      { time: 'Synonyms & Antonyms', title: 'Tenacious, buoyant (Syn) • Fragile (Ant)', type: 'Exam Context', color: '#06b6d4' },
      { time: 'Sentence Context', title: 'A resilient aspirant transforms failures into milestones.', type: 'Usage Drill', color: '#22c55e' }
    ]
  },
  pwa: {
    title: 'Smart Reminders & Offline PWA',
    subtitle: 'Local-first zero latency indexed database & push triggers',
    items: [
      { time: '🔔 10:25 AM Alert', title: 'Quantitative Aptitude starts in 5 minutes', type: 'Smart Reminder', color: '#8b5cf6' },
      { time: '⚡ Local Dexie DB', title: 'All records synced locally — zero latency', type: 'Offline Ready', color: '#22c55e' },
      { time: '📱 PWA Standalone', title: 'Installed as native app on Windows / Android', type: 'Cross Platform', color: '#6366f1' }
    ]
  }
};

const COMPARISON_ROWS = [
  {
    feature: 'Daily Routine Planning',
    traditional: 'Manual diary / static timetable (gets abandoned in 3 days)',
    prepOS: 'Smart availability engine auto-adjusts around teaching & energy peaks'
  },
  {
    feature: 'Long-term Syllabus Retention',
    traditional: 'Forget 80% of concepts within 7 days without revision triggers',
    prepOS: 'Automated 5-Stage Spaced Repetition (SRS) at 1, 3, 7, 14, 30 days'
  },
  {
    feature: 'Mock Test Analysis',
    traditional: 'Only tracking marks with no breakdown of root-cause mistakes',
    prepOS: 'Categorizes Silly vs Conceptual vs Speed errors to eliminate weak spots'
  },
  {
    feature: 'Mental Focus & Stamina',
    traditional: 'Exam anxiety, burnout, and social media distractions',
    prepOS: 'Daily Gita mindfulness & Bengali wisdom reflections for steady calm'
  },
  {
    feature: 'Security & Access Control',
    traditional: 'Plain insecure passwords or scattered notes',
    prepOS: 'FIDO2 WebAuthn Passkeys (Fingerprint / Face ID) + Privacy Public Mode'
  }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isAuthenticated,
    isBiometricSupported,
    hasPasskeys,
    loginWithPasskey,
    registerPasskey,
    loginWithPinFallback,
    checkAuth
  } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activePreviewTab, setActivePreviewTab] = useState('planner');

  useEffect(() => {
    checkAuth();
  }, []);

  const from = location.state?.from?.pathname || '/';

  // Biometric / Passkey Login Handler
  const handleBiometricLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithPasskey();
      setShowLoginModal(false);
      navigate(from, { replace: true });
    } catch (err) {
      console.warn('[LoginPage] Passkey login error:', err);
      if (err.message && err.message.includes('not found')) {
        setError('No passkey registered on this device yet. Please login with PIN first, then enable Biometrics in Settings.');
        setShowPinInput(true);
      } else {
        setError(err.message || 'Biometric authentication failed. Please try again or use PIN.');
      }
    } finally {
      setLoading(false);
    }
  };

  // First-time biometric registration handler
  const handleRegisterBiometrics = async () => {
    setLoading(true);
    setError('');
    try {
      await registerPasskey('Primary Device Passkey');
      setShowLoginModal(false);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to register biometric passkey.');
    } finally {
      setLoading(false);
    }
  };

  // PIN Login Handler
  const handlePinSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter at least 4 digits.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await loginWithPinFallback(pin);
      setShowLoginModal(false);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Incorrect PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 12) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const currentPreview = MODULE_PREVIEWS[activePreviewTab] || MODULE_PREVIEWS.planner;

  return (
    <div className="landing-container">
      {/* ── AMBIENT AURORA GLOWS ──────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: -80,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '85%',
        maxWidth: 800,
        height: 350,
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.15) 45%, rgba(6, 182, 212, 0.05) 75%, transparent 100%)',
        filter: 'blur(70px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* ── TOP ANNOUNCEMENT BAR ──────────────────────────────────── */}
      <div className="landing-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            background: 'var(--primary-glass)',
            color: 'var(--primary-light)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.03em',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}>
            <Sparkles size={12} /> PRO 2026
          </span>
          <span className="landing-topbar-title truncate">
            Preparation OS • The Ultimate Command Center
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => setShowLoginModal(true)}
            className="btn btn-xs btn-primary"
            style={{
              fontSize: 12,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Lock size={12} /> Log In
          </button>
        </div>
      </div>

      {/* ── HERO BANNER & VALUE PROPOSITION ──────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(236, 72, 153, 0.12))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          padding: '5px 14px',
          borderRadius: 'var(--radius-full)',
          fontSize: 11,
          fontWeight: 800,
          color: '#c7d2fe',
          marginBottom: 14,
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)',
          maxWidth: '100%'
        }}>
          <Flame size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span className="truncate">Designed for Competitive Exam Aspirants</span>
        </div>

        <h1 className="landing-hero-title">
          Master Your Syllabus. Retain 100%. Crack Your Dream Exam.
        </h1>

        <p className="landing-hero-desc">
          A unified, distraction-free preparation command center combining <strong>Smart AI Routine Scheduling</strong>, 
          science-backed <strong>5-Stage Spaced Repetition (SRS)</strong>, real-time <strong>Mock Error Diagnostics</strong>, 
          bilingual vocabulary drills, and daily <strong>Gita reflections</strong> for unwavering focus.
        </p>

        {/* Exam Badges Ticker Ribbon */}
        <div className="landing-badges-ribbon">
          {EXAM_BADGES.map((b, i) => (
            <span key={i} className="landing-badge-item">
              <span>{b.icon}</span> {b.name}
            </span>
          ))}
        </div>

        {/* ── PRIMARY CALL TO ACTION BUTTON ───────────────────────── */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 10
        }}>
          <button
            onClick={() => setShowLoginModal(true)}
            className="btn btn-primary landing-cta-btn"
          >
            <Fingerprint size={22} /> Log In to Command Center
          </button>
        </div>
      </div>

      {/* ── METRICS STRIP ─────────────────────────────────────────── */}
      <div className="landing-metrics-grid">
        {METRICS.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: 'linear-gradient(135deg, rgba(30, 30, 53, 0.7), rgba(26, 26, 46, 0.9))',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '14px 12px',
              textAlign: 'center',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(8px)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, transparent, var(--primary-light), transparent)'
            }} />
            <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 900, color: 'var(--primary-light)', letterSpacing: '-0.02em' }}>
              {m.value}
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 3 }}>
              {m.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── SECTION 2: 6-CARD FULL WIDTH CAPABILITIES GRID ───────── */}
      <div style={{ marginBottom: 48, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <span className="badge badge-primary" style={{ fontSize: 10, padding: '2px 10px', marginBottom: 6 }}>
            ⚡ CORE ARCHITECTURE
          </span>
          <h2 style={{ fontSize: 'clamp(20px, 4.5vw, 26px)', fontWeight: 900, color: 'var(--text)', margin: '0 0 6px 0' }}>
            Engineered to Deliver Guaranteed Preparation Mastery
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 640, margin: '0 auto' }}>
            Every module is designed to eliminate cognitive fatigue and enforce flawless spaced retention.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="landing-capabilities-grid">
          {ALL_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                style={{
                  background: 'linear-gradient(135deg, var(--card), var(--surface-2))',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius)',
                    background: feat.bg,
                    color: feat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255,255,255,0.06)',
                      color: feat.color,
                      border: `1px solid ${feat.bg}`
                    }}
                  >
                    {feat.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>
                    {feat.title}
                  </h3>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary-light)', marginBottom: 6 }}>
                    {feat.tagline}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                    {feat.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 'auto', paddingTop: 6 }}>
                  {feat.chips.map((chip, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--surface-3)',
                        color: 'var(--text-3)'
                      }}
                    >
                      ✓ {chip}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION 3: INTERACTIVE SIMULATION & MODULE DEEP DIVE ───── */}
      <div className="landing-card-section">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginBottom: 16
        }}>
          <div>
            <span className="badge badge-primary" style={{ fontSize: 10, padding: '2px 8px', marginBottom: 4 }}>
              ⚡ LIVE ENGINE SIMULATION
            </span>
            <h3 style={{ fontSize: 'clamp(17px, 4vw, 20px)', fontWeight: 900, color: 'var(--text)', margin: 0 }}>
              Test Drive Preparation OS Modules
            </h3>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Click any module below to inspect live data flow</span>
        </div>

        {/* Tab Buttons */}
        <div className="landing-sim-tabs">
          {ALL_FEATURES.map((feat) => {
            const Icon = feat.icon;
            const isActive = activePreviewTab === feat.id;
            return (
              <button
                key={feat.id}
                onClick={() => setActivePreviewTab(feat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius)',
                  background: isActive ? 'var(--primary)' : 'var(--surface-3)',
                  border: `1px solid ${isActive ? 'var(--primary-light)' : 'var(--border)'}`,
                  color: isActive ? '#ffffff' : 'var(--text-2)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none',
                  flexShrink: 0
                }}
              >
                <Icon size={13} color={isActive ? '#ffffff' : feat.color} />
                <span>{feat.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Simulation Output Card */}
        <div style={{
          background: 'var(--bg-2)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 12px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            flexWrap: 'wrap',
            gap: 6
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
                {currentPreview.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--primary-light)' }}>
                {currentPreview.subtitle}
              </div>
            </div>
            <span className="badge" style={{ fontSize: 9, background: 'var(--surface-3)', color: 'var(--text-2)' }}>
              Realtime Dexie Engine
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
            {currentPreview.items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--surface-2)',
                  borderLeft: `3px solid ${item.color}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '9px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{item.time}</span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255,255,255,0.06)',
                      color: item.color
                    }}
                  >
                    {item.type}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{item.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SECTION 4: COMPARISON MATRIX ───────────────────────────── */}
      <div className="landing-card-section">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 8px', marginBottom: 6 }}>
            ⚔️ THE ADVANTAGE
          </span>
          <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 900, color: 'var(--text)', margin: '0 0 4px 0' }}>
            Traditional Study Habits vs. Preparation OS
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text-2)', maxWidth: 620, margin: '0 auto' }}>
            Why top rankers don't rely on willpower alone — they rely on high-leverage algorithmic systems.
          </p>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', minWidth: 500, borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--text-2)' }}>
                  Preparation Dimension
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: '#f87171' }}>
                  ❌ Traditional
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 800, color: 'var(--success-light)' }}>
                  ✨ With PrepOS
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--text)' }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-3)', lineHeight: 1.4 }}>
                    {row.traditional}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 600, lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--success)', marginRight: 6 }}>✓</span>
                    {row.prepOS}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOTTOM CALL TO ACTION ─────────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => setShowLoginModal(true)}
          className="btn btn-primary landing-cta-btn"
        >
          <Fingerprint size={20} /> Access Full Workspace Now
        </button>
      </div>

      {/* ── SECTION 5: BENGALI ASPIRANT QUOTE & FOOTER ─────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '20px 16px',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--primary-light)',
          fontStyle: 'italic',
          marginBottom: 6
        }}>
          “স্মার্ট পরিকল্পনা, নির্ভুল পুনরাবৃত্তি এবং অবিচল নিষ্ঠা — সাফল্যের একমাত্র পথ।”
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          Preparation OS • Engineered with React 19, Dexie IndexedDB, WebAuthn FIDO2 & Spaced Repetition Algorithms.
        </div>
      </div>

      {/* ── POP-UP MODAL: COMMAND CENTER LOGIN PORTAL ──────────────── */}
      {showLoginModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 12,
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLoginModal(false);
          }}
        >
          <div className="landing-modal-box">
            {/* Close Button */}
            <button
              onClick={() => setShowLoginModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'var(--surface-3)',
                border: '1px solid var(--border)',
                color: 'var(--text-2)',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Close Login Modal"
            >
              <X size={16} />
            </button>

            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))',
                border: '1px solid var(--border-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
                color: 'var(--primary-light)',
                boxShadow: '0 0 25px rgba(99, 102, 241, 0.35)'
              }}>
                <Fingerprint size={36} />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 6px 0', color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Command Center Login
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0, lineHeight: 1.5 }}>
                Hardware-authenticated via WebAuthn Biometrics, Face ID, or PIN.
              </p>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-glass)',
                border: '1px solid var(--danger)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius)',
                padding: '12px 14px',
                fontSize: 12,
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                lineHeight: 1.4
              }}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <div>{error}</div>
              </div>
            )}

            {/* ── BIOMETRIC / PASSKEY PRIMARY LOGIN BUTTON ──────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              {isBiometricSupported ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleBiometricLogin}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontSize: 15,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    borderRadius: 'var(--radius)',
                    boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45)',
                    letterSpacing: '0.02em'
                  }}
                >
                  <Fingerprint size={22} />
                  {loading ? 'Authenticating...' : 'Instant Biometric Login'}
                </button>
              ) : (
                <div style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  fontSize: 12,
                  color: 'var(--text-3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={16} />
                  Biometric passkeys not supported on this browser. Use PIN below.
                </div>
              )}

              {/* First-time Biometric Setup Option */}
              {isBiometricSupported && !hasPasskeys && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={handleRegisterBiometrics}
                  disabled={loading}
                  style={{
                    fontSize: 12,
                    color: 'var(--primary-light)',
                    border: '1px dashed var(--border-accent)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  <Sparkles size={14} /> Register new device biometric passkey
                </button>
              )}
            </div>

            {/* ── DIVIDER / OR ──────────────────────────────────────── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '16px 0',
              color: 'var(--text-3)',
              fontSize: 11,
              fontWeight: 700
            }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or verify with PIN</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* ── PIN FALLBACK TOGGLE / FORM ────────────────────────── */}
            {!showPinInput ? (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowPinInput(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 13,
                  fontWeight: 700,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--surface-2)',
                  borderRadius: 'var(--radius)'
                }}
              >
                <KeyRound size={16} /> Enter PIN Manually
              </button>
            ) : (
              <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-2)' }}>Master Security PIN</span>
                  <button
                    type="button"
                    onClick={() => setShowPinInput(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                  >
                    Collapse PIN
                  </button>
                </div>

                <div>
                  <input
                    type="password"
                    className="form-input"
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setError(''); }}
                    placeholder="••••"
                    autoFocus
                    style={{
                      fontSize: 26,
                      textAlign: 'center',
                      letterSpacing: '0.35em',
                      padding: '12px',
                      fontWeight: 900,
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface-3)',
                      border: '1px solid var(--border-accent)'
                    }}
                  />
                </div>

                {/* Numeric Keypad */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  margin: '2px 0'
                }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => handleKeyPress(num)}
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        height: 44,
                        borderRadius: 'var(--radius)',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={handleBackspace}
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      height: 44,
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    ⌫
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => handleKeyPress(0)}
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      height: 44,
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    0
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      fontSize: 14,
                      fontWeight: 800,
                      height: 44,
                      borderRadius: 'var(--radius)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {loading ? '...' : <ArrowRight size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    height: 44,
                    fontSize: 14,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                    borderRadius: 'var(--radius)'
                  }}
                >
                  <KeyRound size={16} /> {loading ? 'Verifying PIN...' : 'Log In to Workspace'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
