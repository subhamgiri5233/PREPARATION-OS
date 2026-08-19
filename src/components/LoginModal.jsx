import React, { useState, useEffect } from 'react';
import { Lock, Unlock, LogIn, KeyRound, X, ShieldAlert, Check } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginModal() {
  const { showLoginModal, closeLoginModal, login, ownerName, isConfigured } = useAuthStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showLoginModal) {
      setPin('');
      setError('');
    }
  }, [showLoginModal]);

  if (!showLoginModal) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setError('Please enter at least 4 digits/characters.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(pin);
      closeLoginModal();
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

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeLoginModal()}>
      <div className="modal" style={{ maxWidth: 380, textAlign: 'center', padding: '28px 24px' }}>
        <button
          className="modal-close"
          onClick={closeLoginModal}
          style={{ position: 'absolute', right: 16, top: 16 }}
        >
          <X size={16} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))',
          border: '1px solid var(--border-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'var(--primary-light)'
        }}>
          <LogIn size={26} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text)' }}>
          Account Login
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 20px 0' }}>
          Enter Master PIN to log in and manage your private study tasks and notes.
        </p>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              className="form-input"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              placeholder="••••"
              autoFocus
              style={{
                fontSize: 22,
                textAlign: 'center',
                letterSpacing: '0.25em',
                padding: '12px',
                fontWeight: 700
              }}
            />
          </div>

          {/* Numeric Keypad for fast mobile / desktop PIN unlock */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            margin: '4px 0'
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
                  height: 48,
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
                height: 48,
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
                height: 48,
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
                height: 48,
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
            style={{ width: '100%', justifyContent: 'center', height: 42, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <LogIn size={16} /> {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-3)' }}>
          Initial default PIN is <strong style={{ color: 'var(--primary-light)' }}>1234</strong> (customizable in Settings)
        </div>
      </div>
    </div>
  );
}
