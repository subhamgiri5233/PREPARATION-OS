// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn, LogOut, Lock, ShieldAlert, Check, ArrowRight,
  Sparkles, Calendar, RotateCcw, BarChart3, BookOpen,
  Zap, Bell, CheckCircle2, Award, Flame, BookMarked
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const FEATURES = [
  {
    icon: Calendar,
    color: '#6366f1',
    bg: 'rgba(99, 102, 241, 0.12)',
    title: 'Smart Daily Routine Engine',
    desc: 'Auto-generates optimal daily study blocks based on target hours while respecting teaching commitments and energy peaks.'
  },
  {
    icon: RotateCcw,
    color: '#22c55e',
    bg: 'rgba(34, 197, 94, 0.12)',
    title: 'Spaced Repetition (SRS)',
    desc: 'Science-backed revision intervals (1, 3, 7, 14, 30 days) ensures 100% long-term memory retention of high-yield topics.'
  },
  {
    icon: BarChart3,
    color: '#06b6d4',
    bg: 'rgba(6, 182, 212, 0.12)',
    title: 'Mock Diagnostics & Error Log',
    desc: 'Categorizes test mistakes into Conceptual, Silly, or Calculation errors to systematically eliminate weak spots.'
  },
  {
    icon: BookOpen,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    title: 'Daily Gita Shloka & Wisdom',
    desc: 'Full Sanskrit verses with Bengali pronunciation, meaning, and personal reflections for clarity and mental focus.'
  },
  {
    icon: BookMarked,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    title: 'Bilingual Vocabulary Builder',
    desc: 'Master English & Bengali vocabulary with real-time word lookup, parts of speech, synonyms, and progress tests.'
  },
  {
    icon: Bell,
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.12)',
    title: 'Smart Push Reminders & PWA',
    desc: 'Receive push notifications 5 minutes before scheduled study sessions. Installable on Android, iOS, and desktop.'
  }
];

const HIGHLIGHTS = [
  { label: 'Target Focus', value: '100%', sub: 'Exam-ready workflows' },
  { label: 'Spaced Repetition', value: '5 Stages', sub: 'Day 1 · 3 · 7 · 14 · 30' },
  { label: 'Bengali Support', value: 'বাংলা', sub: 'Native Gita & Vocab' },
  { label: 'Data Privacy', value: 'AES / PIN', sub: 'Zero unauthorized access' }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, login, lock, ownerName } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter at least 4 digits.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(pin);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Incorrect Master PIN');
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

  if (isAuthenticated) {
    return (
      <div style={{
        maxWidth: 500,
        margin: '60px auto',
        textAlign: 'center',
        padding: '40px 28px',
        background: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.15)',
          color: 'var(--success)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto',
          border: '1px solid rgba(34, 197, 94, 0.3)'
        }}>
          <Check size={32} />
        </div>

        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)' }}>
          Workspace Unlocked
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>
          Logged in as <strong style={{ color: 'var(--primary-light)' }}>{ownerName || 'Subham'}</strong>. All study routines, preparation courses, and private notes are active.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Open Dashboard <ArrowRight size={14} />
          </button>
          <button className="btn btn-ghost" onClick={lock} style={{ color: 'var(--danger)' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 60px' }}>
      {/* ── HERO BANNER & ADVERTISEMENT ───────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
          border: '1px solid var(--border-accent)',
          padding: '6px 16px', borderRadius: 'var(--radius-full)',
          fontSize: 12, fontWeight: 700, color: 'var(--primary-light)',
          marginBottom: 16
        }}>
          <Sparkles size={14} /> Premium Aspirant Operating System · Preparation OS
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 42px)',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          margin: '0 0 12px 0',
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Everything You Need to Crack Your Dream Exam
        </h1>

        <p style={{
          fontSize: 15,
          color: 'var(--text-2)',
          maxWidth: 680,
          margin: '0 auto 24px auto',
          lineHeight: 1.6
        }}>
          A unified, distraction-free preparation command center featuring smart daily routine scheduling, spaced repetition, weakness analytics, and daily Bengali Gita reflections.
        </p>

        {/* Highlights Ticker */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          maxWidth: 800,
          margin: '0 auto'
        }}>
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)' }}>{h.value}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{h.label}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{h.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT GRID: FEATURES ADVERTISEMENT + LOGIN FORM ──── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 28,
        alignItems: 'start'
      }}>
        {/* Left Column: Feature Highlights (Advertisement) */}
        <div>
          <div style={{
            fontSize: 18,
            fontWeight: 800,
            marginBottom: 16,
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Flame size={20} color="#f59e0b" /> Core OS Modules & Capabilities
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '14px 16px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: feat.bg, color: feat.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2
                  }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>
                      {feat.desc}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Master PIN Login Portal */}
        <div style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-accent)',
          padding: '28px 24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          position: 'sticky',
          top: 20
        }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
              border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px auto',
              color: 'var(--primary-light)'
            }}>
              <LogIn size={26} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text)' }}>
              Owner Portal Login
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
              Enter Master PIN to access your private daily schedule and workspace.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-glass)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius)',
              padding: '8px 12px',
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              justifyContent: 'center'
            }}>
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <input
                type="password"
                className="form-input"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setError(''); }}
                placeholder="••••"
                autoFocus
                style={{
                  fontSize: 24,
                  textAlign: 'center',
                  letterSpacing: '0.3em',
                  padding: '12px',
                  fontWeight: 800
                }}
              />
            </div>

            {/* Numeric Keypad for fast 1-click pin unlock */}
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
                    fontWeight: 700,
                    height: 44,
                    borderRadius: 'var(--radius)',
                    background: 'var(--surface-2)',
                    border: '1px solid var(--border)'
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
                  fontSize: 13,
                  fontWeight: 600,
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
                  fontWeight: 700,
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
                  fontWeight: 700,
                  height: 44,
                  borderRadius: 'var(--radius)'
                }}
              >
                {loading ? '...' : <LogIn size={16} />}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}
            >
              <LogIn size={16} /> {loading ? 'Logging in...' : 'Log In to Preparation OS'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
            Default initial Master PIN is <strong style={{ color: 'var(--primary-light)' }}>1234</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
