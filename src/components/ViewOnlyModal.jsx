// src/components/ViewOnlyModal.jsx
import { Eye, ShieldAlert } from 'lucide-react';
import { useViewOnlyModalStore } from '../store/useViewOnlyModalStore';

export default function ViewOnlyModal() {
  const { isOpen, closeModal } = useViewOnlyModalStore();

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={closeModal}
    >
      <div
        className="modal"
        style={{
          maxWidth: 400,
          width: '90%',
          textAlign: 'center',
          padding: '28px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.5)',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: 'var(--primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <Eye size={28} />
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px 0', color: 'var(--text)' }}>
          View Only Mode
        </h2>

        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5, marginBottom: 8, fontWeight: 600 }}>
          You cannot make any changes in View Only Mode.
        </div>

        <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, marginBottom: 24 }}>
          You can only view Subham's work.
        </div>

        <button
          className="btn btn-primary"
          onClick={closeModal}
          style={{
            width: '100%',
            height: 42,
            fontSize: 14,
            fontWeight: 700,
            justifyContent: 'center',
            borderRadius: 'var(--radius)'
          }}
          autoFocus
        >
          OK
        </button>
      </div>
    </div>
  );
}
