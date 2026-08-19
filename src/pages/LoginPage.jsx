// src/pages/LoginPage.jsx
// Biometric (WebAuthn / Passkeys) & PIN Fallback Login for Preparation OS

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Fingerprint, KeyRound, ShieldAlert, Check, ArrowRight,
  Sparkles, Calendar, RotateCcw, BarChart3, BookOpen,
  Zap, Bell, Award, Flame, BookMarked, Lock, Key, AlertCircle
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
  { label: 'Security', value: 'WebAuthn', sub: 'FIDO2 / Passkeys' },
  { label: 'Target Focus', value: '100%', sub: 'Exam-ready workflows' },
  { label: 'Spaced Repetition', value: '5 Stages', sub: 'Day 1 · 3 · 7 · 14 · 30' },
  { label: 'Privacy Protection', value: 'View Only', sub: 'Zero unauthorized changes' }
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
    ownerName,
    checkAuth
  } = useAuthStore();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinInput, setShowPinInput] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

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

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 60px' }}>
      {/* ── HEADER BANNER & WELCOME ───────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))',
          border: '1px solid var(--border-accent)',
          padding: '6px 16px', borderRadius: 'var(--radius-full)',
          fontSize: 12, fontWeight: 700, color: 'var(--primary-light)',
          marginBottom: 16
        }}>
          <Sparkles size={14} /> Welcome to Preparation OS
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

      {/* ── MAIN CONTENT GRID: FEATURES ADVERTISEMENT + AUTHENTICATION PORTAL ──── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 28,
        alignItems: 'start'
      }}>
        {/* Left Column: Feature Highlights */}
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

        {/* Right Column: Secure Biometric & PIN Login Portal */}
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
              width: 58, height: 58, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
              border: '1px solid var(--border-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px auto',
              color: 'var(--primary-light)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)'
            }}>
              <Fingerprint size={32} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text)' }}>
              Secure Login
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
              Authenticate with Fingerprint, Windows Hello, Face ID, or PIN.
            </p>
          </div>

          {error && (
            <div style={{
              background: 'var(--danger-glass)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius)',
              padding: '10px 14px',
              fontSize: 12,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <ShieldAlert size={16} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {/* ── BIOMETRIC / PASSKEY PRIMARY LOGIN BUTTON ──────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
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
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  borderRadius: 'var(--radius)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                }}
              >
                <Fingerprint size={20} />
                {loading ? 'Authenticating...' : 'Login with Fingerprint / Passkey'}
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
                Biometric login is not available on this device or browser.
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
                  padding: '8px 12px',
                  borderRadius: 'var(--radius)'
                }}
              >
                ✨ Set up secure biometric login on this device
              </button>
            )}
          </div>

          {/* ── DIVIDER / OR ──────────────────────────────────────── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '16px 0',
            color: 'var(--text-3)',
            fontSize: 12
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
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
                fontWeight: 600,
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'var(--surface-2)'
              }}
            >
              <KeyRound size={16} /> Use PIN instead
            </button>
          ) : (
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>Enter Master PIN</span>
                <button
                  type="button"
                  onClick={() => setShowPinInput(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-light)', fontSize: 11, cursor: 'pointer' }}
                >
                  Hide PIN
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
                    fontSize: 24,
                    textAlign: 'center',
                    letterSpacing: '0.3em',
                    padding: '12px',
                    fontWeight: 800
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
                  {loading ? '...' : <ArrowRight size={16} />}
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}
              >
                <KeyRound size={16} /> {loading ? 'Verifying PIN...' : 'Log In with PIN'}
              </button>
            </form>
          )}

          <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'var(--text-3)' }}>
            Biometric credentials are securely verified by your device hardware.
          </div>
        </div>
      </div>
    </div>
  );
}
