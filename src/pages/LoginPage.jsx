// src/pages/LoginPage.jsx
// Premium High-Converting Promotional Landing & Biometric/PIN Login Portal

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Fingerprint, KeyRound, ShieldAlert, Check, ArrowRight,
  Sparkles, Calendar, RotateCcw, BarChart3, BookOpen,
  Zap, Bell, Award, Flame, BookMarked, Lock, Key, AlertCircle,
  CheckCircle2, ShieldCheck, Target, TrendingUp, HelpCircle,
  Smartphone, Clock, Brain, Compass, Cpu, Layers, Star, ExternalLink,
  ChevronRight, Eye, Shield
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

const MODULE_TABS = [
  {
    id: 'planner',
    title: 'Smart Daily Routine Engine',
    badge: 'AI Planner',
    icon: Calendar,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.15)',
    tagline: 'Never waste time deciding what to study next.',
    desc: 'Intelligently auto-schedules high-priority topics into your free slots while strictly respecting teaching commitments and high-energy cognitive windows.',
    highlights: [
      'Automatic conflict detection with teaching hours',
      'Day, Week, and Month multi-calendar views',
      'One-click routine optimization preserving manual edits'
    ],
    preview: {
      title: 'Today’s AI Generated Flow',
      items: [
        { time: '07:00 – 08:30', title: 'Indian Polity (Fundamental Rights)', type: 'High Yield', color: '#6366f1' },
        { time: '09:00 – 10:00', title: '🏫 Morning Teaching Slot (Blocked)', type: 'Teaching', color: '#f59e0b' },
        { time: '10:30 – 11:45', title: 'Quantitative Aptitude (Arithmetic)', type: 'Practice', color: '#06b6d4' },
        { time: '14:00 – 15:00', title: '🔄 SRS Stage-3 Revision (Modern History)', type: 'Revision', color: '#22c55e' }
      ]
    }
  },
  {
    id: 'srs',
    title: '5-Stage Spaced Repetition (SRS)',
    badge: 'Memory Science',
    icon: RotateCcw,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.15)',
    tagline: 'Beat the forgetting curve with mathematical precision.',
    desc: 'Automatically schedules topic reviews at 1, 3, 7, 14, and 30-day intervals so critical concepts transition permanently into your long-term memory.',
    highlights: [
      'Automated revision queue based on Ebbinghaus curve',
      'Topic mastery rating (Learning → Reviewing → Mastered)',
      'Spaced repetition alerts preventing syllabus fade'
    ],
    preview: {
      title: 'Retention Curve Status',
      items: [
        { time: 'Stage 1 (Day 1)', title: 'West Bengal Geography & Rivers', type: 'Retention: 98%', color: '#22c55e' },
        { time: 'Stage 3 (Day 7)', title: 'Indian Constitution Amendments', type: 'Retention: 91%', color: '#6366f1' },
        { time: 'Stage 5 (Day 30)', title: 'Percentage & Compound Interest', type: 'Permanent Memory', color: '#ec4899' }
      ]
    }
  },
  {
    id: 'diagnostics',
    title: 'Mock Diagnostics & Error Log',
    badge: 'Weakness Killer',
    icon: BarChart3,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.15)',
    tagline: 'Turn every mock test mistake into guaranteed exam marks.',
    desc: 'Deep-dive into test errors by categorizing mistakes into Conceptual, Silly Mistakes, or Calculation slips. Auto-generates targeted recovery sessions.',
    highlights: [
      'Error root-cause categorization (Silly / Conceptual / Speed)',
      'Subject-wise accuracy breakdown & percentile tracking',
      'Instant topic-level remediation workflows'
    ],
    preview: {
      title: 'Error Diagnostic Radar',
      items: [
        { time: 'Conceptual Gaps (35%)', title: 'Governor Powers & Ordinances', type: 'Priority Fix', color: '#ef4444' },
        { time: 'Silly Slips (45%)', title: 'Unit Conversion in Time & Distance', type: 'Avoidable -1.33m', color: '#f59e0b' },
        { time: 'Speed / Timeout (20%)', title: 'Reading Comprehension Passage 2', type: 'Time Drill', color: '#06b6d4' }
      ]
    }
  },
  {
    id: 'gita',
    title: 'Daily Gita Shloka & Mindfulness',
    badge: 'Mental Clarity',
    icon: BookOpen,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
    tagline: 'Build unbreakable mental focus, resilience & inner calm.',
    desc: 'Start each preparation day with inspiring Bhagavad Gita shlokas in Sanskrit, with authentic Bengali pronunciation, deep meaning, and practical aspirant reflection.',
    highlights: [
      'Authentic Sanskrit verses with Bengali phonetics',
      'Daily practical reflection for exam stress & focus',
      'Bookmark favorite verses with personal study notes'
    ],
    preview: {
      title: 'Today’s Verse Reflection',
      items: [
        { time: 'BG 2.47', title: 'কর্মণ্যেবাধিকারস্তে মা ফলেষু কদাচন...', type: 'Sanskrit', color: '#f59e0b' },
        { time: 'Bengali Meaning', title: 'কর্মে তোমার অধিকার, ফলাফলে কখনো নয়—একনিষ্ঠ প্রচেষ্টাই বিজয়ের দ্বার।', type: 'Wisdom', color: '#818cf8' },
        { time: 'Aspirant Takeaway', title: 'ফলাফলের উদ্বেগ ত্যাগ করে আজকের দৈনিক লক্ষ্যে ১০০% মনোনিবেশ করো।', type: 'Mindset', color: '#22c55e' }
      ]
    }
  },
  {
    id: 'vocab',
    title: 'Bilingual Vocabulary Builder',
    badge: 'Language Edge',
    icon: BookMarked,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.15)',
    tagline: '10 High-Yield words daily with Bengali meanings & audio.',
    desc: 'Master English for WBPSC, SSC, and Banking with real-time dictionary lookups, phonetic pronunciation, parts of speech, synonyms, and daily mastery tests.',
    highlights: [
      'Instant online dictionary lookup with Bengali definitions',
      'Audio pronunciation & sentence examples',
      'Daily 10-word target tracker with quiz drills'
    ],
    preview: {
      title: 'Daily Word Master Card',
      items: [
        { time: 'Word: Resilient (adj.)', title: 'স্থিতিস্থাপক / প্রতিকূলতা কাটিয়ে উঠতে সক্ষম', type: 'Exam High-Yield', color: '#ec4899' },
        { time: 'Synonyms', title: 'Tenacious, buoyant, invincible, sturdy', type: 'Antonyms: Fragile', color: '#06b6d4' },
        { time: 'Exam Context', title: 'A resilient aspirant transforms failures into milestones.', type: 'Usage Drill', color: '#22c55e' }
      ]
    }
  },
  {
    id: 'pwa',
    title: 'Smart Reminders & Desktop/Mobile PWA',
    badge: 'Offline & Mobile',
    icon: Bell,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.15)',
    tagline: 'Your complete study companion on Android, iOS & Windows.',
    desc: '5-minute pre-study audio-visual alerts, seamless background synchronization, and full offline functionality even without active internet access.',
    highlights: [
      'Smart 5-minute pre-session browser & push alerts',
      'Installable PWA app for mobile home screen & desktop',
      'Complete local Dexie database — 100% private'
    ],
    preview: {
      title: 'Alerts & Offline Engine',
      items: [
        { time: '🔔 10:25 AM Alert', title: 'Quantitative Aptitude starts in 5 minutes', type: 'Smart Reminder', color: '#8b5cf6' },
        { time: '⚡ Local Dexie DB', title: 'All records synced locally — zero latency', type: 'Offline Ready', color: '#22c55e' },
        { time: '📱 PWA Standalone', title: 'Installed as native app on Windows / Android', type: 'Cross Platform', color: '#6366f1' }
      ]
    }
  }
];

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
  const [activeModuleTab, setActiveModuleTab] = useState('planner');

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

  const currentTab = MODULE_TABS.find((t) => t.id === activeModuleTab) || MODULE_TABS[0];
  const CurrentIcon = currentTab.icon;

  return (
    <div style={{
      maxWidth: 1200,
      margin: '0 auto',
      padding: '24px 16px 80px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ── AMBIENT AURORA GLOWS ──────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: 900,
        height: 380,
        background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.22) 0%, rgba(139, 92, 246, 0.12) 45%, rgba(6, 182, 212, 0.04) 75%, transparent 100%)',
        filter: 'blur(60px)',
        zIndex: 0,
        pointerEvents: 'none'
      }} />

      {/* ── TOP ANNOUNCEMENT BAR ──────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(26, 26, 46, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-accent)',
        padding: '8px 18px',
        borderRadius: 'var(--radius-full)',
        marginBottom: 32,
        position: 'relative',
        zIndex: 1,
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--primary-glass)',
            color: 'var(--primary-light)',
            padding: '2px 10px',
            borderRadius: 'var(--radius-full)',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.04em'
          }}>
            <Sparkles size={12} /> PRO EDITION 2026
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>
            Preparation OS • The High-Performance Command Center for Aspirants
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--success)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
            System Online • 100% Offline Capable
          </span>
          <Link
            to="/"
            className="btn btn-xs btn-ghost"
            style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary-light)' }}
          >
            <Eye size={12} /> Explore Public Mode
          </Link>
        </div>
      </div>

      {/* ── HERO BANNER & VALUE PROPOSITION ──────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 44, position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.18), rgba(236, 72, 153, 0.12))',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          padding: '6px 18px',
          borderRadius: 'var(--radius-full)',
          fontSize: 12,
          fontWeight: 800,
          color: '#c7d2fe',
          marginBottom: 16,
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)'
        }}>
          <Flame size={14} color="#f59e0b" /> Designed Specifically for Competitive Exam Aspirants
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 4.5vw, 54px)',
          fontWeight: 900,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          margin: '0 auto 16px auto',
          maxWidth: 950,
          background: 'linear-gradient(135deg, #ffffff 10%, #e2e8f0 45%, #818cf8 80%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          Master Your Syllabus. Retain 100%. Crack Your Dream Exam.
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--text-2)',
          maxWidth: 780,
          margin: '0 auto 28px auto',
          lineHeight: 1.65,
          fontWeight: 400
        }}>
          A unified, distraction-free preparation command center combining <strong>Smart AI Routine Scheduling</strong>, 
          science-backed <strong>5-Stage Spaced Repetition (SRS)</strong>, real-time <strong>Mock Error Diagnostics</strong>, 
          bilingual vocabulary drills, and daily <strong>Gita reflections</strong> for unwavering focus.
        </p>

        {/* Exam Badges Ticker Ribbon */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          maxWidth: 980,
          margin: '0 auto 32px auto'
        }}>
          {EXAM_BADGES.map((b, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease'
              }}
            >
              <span>{b.icon}</span> {b.name}
            </span>
          ))}
        </div>

        {/* Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          maxWidth: 900,
          margin: '0 auto'
        }}>
          {METRICS.map((m, idx) => (
            <div
              key={idx}
              style={{
                background: 'linear-gradient(135deg, rgba(30, 30, 53, 0.7), rgba(26, 26, 46, 0.9))',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 16px',
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
              <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary-light)', letterSpacing: '-0.02em' }}>
                {m.value}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
                {m.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN SECTION: INTERACTIVE MODULE SHOWCASE + AUTHENTICATION ──── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 28,
        alignItems: 'start',
        position: 'relative',
        zIndex: 1,
        marginBottom: 50
      }}>
        {/* Left Column: Interactive Feature Showcase */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14
          }}>
            <div style={{
              fontSize: 18,
              fontWeight: 900,
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <Zap size={20} color="var(--primary-light)" />
              <span>Core OS Capabilities</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Click to preview module</span>
          </div>

          {/* Module Selector Pill Buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 8,
            marginBottom: 16
          }}>
            {MODULE_TABS.map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModuleTab === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModuleTab(mod.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius)',
                    background: isActive ? 'var(--primary)' : 'var(--surface-2)',
                    border: `1px solid ${isActive ? 'var(--primary-light)' : 'var(--border)'}`,
                    color: isActive ? '#ffffff' : 'var(--text-2)',
                    fontSize: 12,
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(99, 102, 241, 0.4)' : 'none'
                  }}
                >
                  <Icon size={16} color={isActive ? '#ffffff' : mod.color} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mod.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Module Spotlight Card */}
          <div style={{
            background: 'linear-gradient(135deg, var(--card), var(--surface-2))',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius)',
                background: currentTab.bg,
                color: currentTab.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 0 16px ${currentTab.bg}`
              }}>
                <CurrentIcon size={24} />
              </div>
              <div>
                <span className="badge badge-primary" style={{ fontSize: 10, padding: '2px 8px', marginBottom: 4 }}>
                  {currentTab.badge}
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  {currentTab.title}
                </h3>
              </div>
            </div>

            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary-light)', marginBottom: 8 }}>
              {currentTab.tagline}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 16 }}>
              {currentTab.desc}
            </p>

            {/* Bullet Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
              {currentTab.highlights.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text)' }}>
                  <CheckCircle2 size={14} color="var(--success)" style={{ flexShrink: 0 }} />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            {/* Live Interactive UI Preview */}
            <div style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: 14
            }}>
              <div style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-3)',
                marginBottom: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>⚡ Live Simulation: {currentTab.preview.title}</span>
                <span className="badge" style={{ fontSize: 9, background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                  Realtime Dexie Engine
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {currentTab.preview.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--surface-2)',
                      borderLeft: `3px solid ${item.color}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: 12
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text)' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{item.time}</div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255,255,255,0.06)',
                        color: item.color
                      }}
                    >
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Secure Biometric & PIN Login Portal */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(26, 26, 46, 0.95), rgba(30, 30, 53, 0.9))',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-accent)',
          padding: '30px 26px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(99, 102, 241, 0.15)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 24
        }}>
          {/* Top Lock Badge */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
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
              Hardware-authenticated via WebAuthn Biometrics, Windows Hello, Face ID, or PIN.
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

          {/* Public Visitor Link */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
              Looking to preview the preparation syllabus & structure?
            </div>
            <Link
              to="/"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--primary-light)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Browse in Public View-Only Mode <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── SECTION 3: COMPARISON MATRIX (TRADITIONAL VS PREPARATION OS) ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface-2), var(--card))',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 28px',
        marginBottom: 44,
        boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span className="badge badge-warning" style={{ fontSize: 10, padding: '3px 10px', marginBottom: 8 }}>
            ⚔️ THE ADVANTAGE
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', margin: '0 0 6px 0' }}>
            Traditional Study Habits vs. Preparation OS
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 620, margin: '0 auto' }}>
            Why top rankers don't rely on willpower alone — they rely on high-leverage algorithmic systems.
          </p>
        </div>

        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-3)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--text-2)' }}>
                  Preparation Dimension
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: '#f87171' }}>
                  ❌ Traditional Preparation
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800, color: 'var(--success-light)' }}>
                  ✨ With Preparation OS
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text)' }}>
                    {row.feature}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-3)', lineHeight: 1.45 }}>
                    {row.traditional}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text)', fontWeight: 600, lineHeight: 1.45 }}>
                    <span style={{ color: 'var(--success)', marginRight: 6 }}>✓</span>
                    {row.prepOS}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 4: BENGALI ASPIRANT QUOTE & FOOTER ─────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '24px 20px',
        borderTop: '1px solid var(--border)',
        position: 'relative',
        zIndex: 1
      }}>
        <div style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--primary-light)',
          fontStyle: 'italic',
          marginBottom: 8
        }}>
          “স্মার্ট পরিকল্পনা, নির্ভুল পুনরাবৃত্তি এবং অবিচল নিষ্ঠা — সাফল্যের একমাত্র পথ।”
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Preparation OS • Engineered with React 19, Dexie IndexedDB, WebAuthn FIDO2 & Spaced Repetition Algorithms.
        </div>
      </div>
    </div>
  );
}
