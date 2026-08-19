import React, { useState, useEffect } from 'react';
import { Lock, LogIn, X, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginModal() {
  const { showPinModal, cancelEditMode, login, pinError } = useAuthStore();
  const [pin, setPin] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (showPinModal) {
      setPin('');
      setLocalError('');
    }
  }, [showPinModal]);

  if (!showPinModal) return null;

  const displayError = localError || pinError;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!pin || pin.length < 4) {
      setLocalError('Please enter at least 4 digits/characters.');
      return;
    }

    setLoading(true);
    setLocalError('');
    try {
      await login(pin);
    } catch (err) {
      setLocalError(err.message || 'Incorrect PIN. Edit Mode remains disabled.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 12) {
      setPin((prev) => prev + num);
      setLocalError('');
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setLocalError('');
  };

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 99999, background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && cancelEditMode()}
    >
      <div className="modal" style={{ maxWidth: 380, textAlign: 'center', padding: '28px 24px' }}>
        <button
          className="modal-close"
          onClick={cancelEditMode}
          style={{ position: 'absolute', right: 16, top: 16 }}
          title="Cancel"
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
          <Lock size={26} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text)' }}>
          Enter PIN to Enable Edit Mode
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 20px 0' }}>
          Enter your Master PIN to unlock full editing and scheduling operations.
        </p>

        {displayError && (
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
            <ShieldAlert size={14} /> {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              className="form-input"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setLocalError(''); }}
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

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={cancelEditMode}
              disabled={loading}
              style={{ flex: 1, height: 42, fontSize: 13, fontWeight: 600, justifyContent: 'center' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ flex: 2, height: 42, fontSize: 13, fontWeight: 700, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <LogIn size={15} /> {loading ? 'Verifying...' : 'Enable Edit Mode'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-3)' }}>
          Default PIN in DB is <strong style={{ color: 'var(--primary-light)' }}>1234</strong>
        </div>
      </div>
    </div>
  );
}
