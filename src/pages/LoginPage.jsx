// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Lock, ShieldAlert, Check, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

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
        maxWidth: 440,
        margin: '60px auto',
        textAlign: 'center',
        padding: '36px 24px',
        background: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)'
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

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px 0', color: 'var(--text)' }}>
          You are Logged In
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>
          Logged in as <strong style={{ color: 'var(--primary-light)' }}>{ownerName || 'Subham'}</strong>. All study routines and private tasks are visible.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Go to Dashboard <ArrowRight size={14} />
          </button>
          <button className="btn btn-ghost" onClick={lock} style={{ color: 'var(--danger)' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: 400,
      margin: '40px auto',
      textAlign: 'center',
      padding: '32px 24px',
      background: 'var(--card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border)',
      boxShadow: '0 12px 36px rgba(0,0,0,0.2)'
    }}>
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

      <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text)' }}>
        Preparation OS Login
      </h2>
      <p style={{ fontSize: 12, color: 'var(--text-2)', margin: '0 0 20px 0' }}>
        Enter Master PIN to log in and unlock full editing access.
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
              letterSpacing: '0.25em',
              padding: '12px',
              fontWeight: 700
            }}
          />
        </div>

        {/* Numeric Keypad */}
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
          style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LogIn size={16} /> {loading ? 'Logging in...' : 'Log In to Preparation OS'}
        </button>
      </form>

      <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-3)' }}>
        Default initial PIN is <strong style={{ color: 'var(--primary-light)' }}>1234</strong>
      </div>
    </div>
  );
}
