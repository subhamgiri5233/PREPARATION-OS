// src/pages/DisciplineCalendar.jsx
// All-Time Discipline Calendar — integrates with FocusOS design system.
// Features:
// 1. Dual Streaks: Partially Stack (≥1 rule completed) & Fully Stack (all 6 rules completed).
// 2. Both WR and WD selectable on a single day (with dedicated "Both (WR & WD)" option).
// 3. WD Amount Prompt: Prompts for the amount, summing into particular month total and all-over total.
// 4. Clean, disciplined layout with no cut-off popups, no arrows, and no clutter.

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, CalendarDays, BarChart3, Settings,
  Check, X, Minus, Circle, CheckCircle2, XCircle, AlertCircle,
  Trophy, Flame, Target, TrendingUp, RotateCcw, Save, Plus, Trash2,
  Star, Clock, BookOpen, RefreshCw, Zap, IndianRupee, Wallet, Layers
} from 'lucide-react';
import {
  getTodayKey, localDateKey, parseLocalDate, formatDateKey,
  getRecord, saveRecord, updateRuleStatus, setDayWithdrawal,
  toggleDayWithdrawalType, updateNotes, updateTasks, resetDayRules,
  getMonthRecords, getAllRecords, isFullyCompleted, isPartiallyCompleted,
  hasAnyData, computeStats, getRules, saveRules, syncDisciplineWithDB
} from '../services/disciplineCalendar';

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const RULE_STATUS_CONFIG = {
  null: { label: 'Unset', color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)' },
  completed: { label: 'Completed', color: 'var(--success)', bg: 'var(--success-glass)', border: 'var(--success)' },
  pd: { label: 'PD (Partially Done)', color: '#f59e0b', bg: 'rgba(245,158,11,0.18)', border: '#f59e0b' },
  not_completed: { label: 'Not Completed', color: 'var(--danger)', bg: 'var(--danger-glass)', border: 'var(--danger)' },
  nt: { label: 'Not Tried', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)' },
};

const WITHDRAWAL_CONFIG = {
  null: { label: 'WR/WD', color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)' },
  WR: { label: 'WR', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)' },
  WD: { label: 'WD', color: 'var(--success)', bg: 'var(--success-glass)', border: 'var(--success)' },
  BOTH: { label: 'WR & WD', color: 'var(--text)', bg: 'rgba(99,102,241,0.15)', border: 'var(--border-accent)' },
};

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Dates' },
  { id: 'fully', label: 'Fully Completed (6/6)' },
  { id: 'partially', label: 'Partially Completed (≥1)' },
  { id: 'incomplete', label: 'Not Done / Incomplete' },
  { id: 'WR', label: 'WR — Requested' },
  { id: 'WD', label: 'WD — Done' },
  { id: 'BOTH', label: 'Both WR & WD' },
];

function formatCurrency(num) {
  return `₹${(Number(num) || 0).toLocaleString('en-IN')}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function buildCalendarGrid(year, month, monthData, filter) {
  const totalDays = getDaysInMonth(year, month);
  const startOffset = getFirstDayOfWeek(year, month);
  const today = getTodayKey();
  const yearMonth = `${year}-${String(month + 1).padStart(2,'0')}`;

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);

  for (let day = 1; day <= totalDays; day++) {
    const dateKey = `${yearMonth}-${String(day).padStart(2,'0')}`;
    const record = monthData[dateKey] || {
      date: dateKey,
      rules: { R1:null,R2:null,R3:null,R4:null,R5:null,R6:null },
      withdrawalStatus: null,
      withdrawalAmount: 0,
      withdrawals: { WR: false, WD: false },
      notes: '',
      tasks: []
    };
    const isToday = dateKey === today;
    const isFuture = dateKey > today;
    const fully = !isFuture && isFullyCompleted(record);
    const partially = !isFuture && isPartiallyCompleted(record);
    const anyData = hasAnyData(record);

    const hasWR = Boolean(record.withdrawals?.WR || record.withdrawalStatus === 'WR' || record.withdrawalStatus === 'BOTH');
    const hasWD = Boolean(record.withdrawals?.WD || record.withdrawalStatus === 'WD' || record.withdrawalStatus === 'BOTH');

    let show = true;
    if (filter !== 'all') {
      if (filter === 'fully') show = fully;
      else if (filter === 'partially') show = partially;
      else if (filter === 'incomplete') show = !isFuture && !fully;
      else if (filter === 'WR') show = hasWR;
      else if (filter === 'WD') show = hasWD;
      else if (filter === 'BOTH') show = hasWR && hasWD;
    }

    const colIndex = (startOffset + day - 1) % 7;

    cells.push({
      day, dateKey, record, isToday, isFuture, fully, partially,
      anyData, show, colIndex, hasWR, hasWD
    });
  }

  return cells;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function RuleStatusIcon({ status, size = 11 }) {
  if (status === 'completed') return <CheckCircle2 size={size} color="var(--success)" />;
  if (status === 'pd') return <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', lineHeight: 1, letterSpacing: '-0.04em' }}>PD</span>;
  if (status === 'not_completed') return <XCircle size={size} color="var(--danger)" />;
  if (status === 'nt') return <Minus size={size} color="#94a3b8" />;
  return <Circle size={size} color="var(--text-muted)" />;
}

/**
 * RuleCircle: Clean 24px circle with single-click status cycling and clamped right-click menu.
 */
function RuleCircle({ status, ruleId, dateKey, onUpdate, rules, colIndex = 0 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = RULE_STATUS_CONFIG[status] || RULE_STATUS_CONFIG[null];
  const rule = rules.find(r => r.id === ruleId);

  const handleCycleClick = (e) => {
    e.stopPropagation();
    const cycle = {
      null: 'completed',
      'completed': 'pd',
      'pd': 'not_completed',
      'not_completed': 'nt',
      'nt': null
    };
    const next = cycle[status ?? null] ?? null;
    onUpdate(dateKey, ruleId, next);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleSelect = (val) => {
    onUpdate(dateKey, ruleId, val);
    setOpen(false);
  };

  const menuAlignStyle = colIndex <= 1
    ? { left: 0 }
    : colIndex >= 5
    ? { right: 0 }
    : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <button
        type="button"
        onClick={handleCycleClick}
        onContextMenu={handleContextMenu}
        title={`${ruleId}: ${rule?.label || ''} (${cfg.label})\nClick: Cycle status | Right-click: Menu`}
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: cfg.bg, border: `2px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s ease',
          flexShrink: 0, padding: 0
        }}
      >
        <RuleStatusIcon status={status} size={11} />
      </button>

      {open && (
        <div
          role="menu"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 28, ...menuAlignStyle,
            background: 'var(--surface-2)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius)', padding: 6, zIndex: 600, width: 170,
            boxShadow: '0 12px 30px rgba(0,0,0,0.6)', animation: 'fadeIn 0.1s ease',
          }}
        >
          <div style={{ fontSize: 11, color: 'var(--primary-light)', padding: '2px 8px 6px', fontWeight: 700, borderBottom: '1px solid var(--border)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {ruleId}: {rule?.label}
          </div>
          {[
            { val: null, icon: <Circle size={12} color="var(--text-muted)" />, label: 'Unset / Clear' },
            { val: 'completed', icon: <CheckCircle2 size={12} color="var(--success)" />, label: '✓ Completed' },
            { val: 'pd', icon: <span style={{ fontSize: 9, fontWeight: 900, color: '#f59e0b', width: 14, textAlign: 'center' }}>PD</span>, label: '⚡ PD (Partially Done)' },
            { val: 'not_completed', icon: <XCircle size={12} color="var(--danger)" />, label: '✕ Not Completed' },
            { val: 'nt', icon: <Minus size={12} color="#94a3b8" />, label: '— NT (Not Tried)' },
          ].map(opt => (
            <button
              key={String(opt.val)}
              type="button"
              role="menuitem"
              onClick={() => handleSelect(opt.val)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                background: status === opt.val ? 'var(--primary-glass)' : 'transparent',
                color: status === opt.val ? 'var(--primary-light)' : 'var(--text-2)',
                fontSize: 12, fontWeight: 500, transition: 'background 0.12s',
                textAlign: 'left', border: 'none', cursor: 'pointer'
              }}
              onMouseEnter={e => { if (status !== opt.val) e.currentTarget.style.background = 'var(--surface-3)'; }}
              onMouseLeave={e => { if (status !== opt.val) e.currentTarget.style.background = 'transparent'; }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * WithdrawalControl: Shows [WR/WD], [WR], [WD], or [BOTH] split badge.
 * Dropdown menu offers:
 * - Clear / Unset
 * - WR (Requested Only)
 * - WD (Done Only - Enter ₹)
 * - Both (WR & WD) (Enter ₹)
 */
function WithdrawalControl({ record, dateKey, onSelectStatus, onPromptWDAmount, colIndex = 0 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const status = record.withdrawalStatus;
  const amount = record.withdrawalAmount || 0;
  const hasWR = Boolean(record.withdrawals?.WR || status === 'WR' || status === 'BOTH');
  const hasWD = Boolean(record.withdrawals?.WD || status === 'WD' || status === 'BOTH');
  const isBoth = hasWR && hasWD;

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleChoose = (e, val) => {
    e.stopPropagation();
    setOpen(false);
    if (val === 'WD' || val === 'BOTH') {
      onPromptWDAmount(dateKey, amount, val);
    } else {
      onSelectStatus(dateKey, val, 0);
    }
  };

  const menuAlignStyle = colIndex <= 1
    ? { left: 0 }
    : colIndex >= 5
    ? { right: 0 }
    : { left: '50%', transform: 'translateX(-50%)' };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      {/* ── CARD BUTTON DISPLAY ── */}
      {isBoth ? (
        /* BOTH WR & WD active simultaneously */
        <div
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
          title={`Both WR & WD active! WD Amount: ${formatCurrency(amount)}. Click to change.`}
          style={{
            display: 'flex', width: '100%', gap: 3, alignItems: 'center', cursor: 'pointer'
          }}
        >
          <span style={{
            background: 'rgba(245, 158, 11, 0.25)',
            color: '#fbbf24',
            border: '1px solid #f59e0b',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 4px',
            fontSize: 10,
            fontWeight: 800,
            lineHeight: 1.2
          }}>
            WR
          </span>
          <span style={{
            flex: 1,
            background: 'var(--success-glass)',
            color: 'var(--success)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 4px',
            fontSize: 10,
            fontWeight: 800,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.2
          }}>
            WD {amount > 0 ? `· ${formatCurrency(amount)}` : ''}
          </span>
        </div>
      ) : (
        /* Single or unselected */
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
          title={status === 'WD' ? `WD Completed: ${formatCurrency(amount)}. Click to change.` : status === 'WR' ? 'WR Requested. Click to change.' : 'Click to set WR, WD or Both'}
          style={{
            width: '100%',
            padding: '3px 6px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 10,
            fontWeight: 700,
            border: status === 'WD' ? '1px solid var(--success)' : status === 'WR' ? '1px solid #f59e0b' : '1px solid var(--border)',
            background: status === 'WD' ? 'var(--success-glass)' : status === 'WR' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
            color: status === 'WD' ? 'var(--success)' : status === 'WR' ? '#fbbf24' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {status === 'WD' ? (
            <span>WD {amount > 0 ? `· ${formatCurrency(amount)}` : ''}</span>
          ) : status === 'WR' ? (
            <span>WR</span>
          ) : (
            <span>WR/WD</span>
          )}
        </button>
      )}

      {/* ── DROPDOWN MENU WITH CLEAR, WR, WD, AND BOTH ── */}
      {open && (
        <div
          role="menu"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: '100%', marginBottom: 6, ...menuAlignStyle,
            background: 'var(--surface-2)', border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius)', padding: 6, zIndex: 700, width: 190,
            boxShadow: '0 12px 30px rgba(0,0,0,0.65)', animation: 'fadeIn 0.1s ease',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '2px 8px 6px', fontWeight: 700, borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
            Withdrawal Options
          </div>

          {/* 1. Clear / Unset option */}
          <button
            type="button"
            role="menuitem"
            onClick={(e) => handleChoose(e, null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)',
              background: (!hasWR && !hasWD) ? 'var(--primary-glass)' : 'transparent',
              color: 'var(--text-2)', fontSize: 12, fontWeight: 500,
              textAlign: 'left', border: 'none', cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={e => e.currentTarget.style.background = (!hasWR && !hasWD) ? 'var(--primary-glass)' : 'transparent'}
          >
            <X size={12} color="var(--text-muted)" />
            <span>Clear / Unset</span>
          </button>

          {/* 2. WR — Requested option */}
          <button
            type="button"
            role="menuitem"
            onClick={(e) => handleChoose(e, 'WR')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)',
              background: (hasWR && !hasWD) ? 'rgba(245,158,11,0.2)' : 'transparent',
              color: '#fbbf24', fontSize: 12, fontWeight: 600,
              textAlign: 'left', border: 'none', cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={e => e.currentTarget.style.background = (hasWR && !hasWD) ? 'rgba(245,158,11,0.2)' : 'transparent'}
          >
            <Circle size={8} fill="#f59e0b" color="#f59e0b" />
            <span>WR — Requested (Only)</span>
          </button>

          {/* 3. WD — Done option (asks amount) */}
          <button
            type="button"
            role="menuitem"
            onClick={(e) => handleChoose(e, 'WD')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)',
              background: (!hasWR && hasWD) ? 'var(--success-glass)' : 'transparent',
              color: 'var(--success)', fontSize: 12, fontWeight: 600,
              textAlign: 'left', border: 'none', cursor: 'pointer'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={e => e.currentTarget.style.background = (!hasWR && hasWD) ? 'var(--success-glass)' : 'transparent'}
          >
            <CheckCircle2 size={12} color="var(--success)" />
            <span>WD — Done (Only)</span>
          </button>

          {/* 4. BOTH WR and WD option */}
          <button
            type="button"
            role="menuitem"
            onClick={(e) => handleChoose(e, 'BOTH')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '6px 8px', borderRadius: 'var(--radius-sm)',
              background: isBoth ? 'var(--primary-glass)' : 'transparent',
              color: 'var(--primary-light)', fontSize: 12, fontWeight: 700,
              textAlign: 'left', border: 'none', cursor: 'pointer',
              borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 2, paddingTop: 6
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
            onMouseLeave={e => e.currentTarget.style.background = isBoth ? 'var(--primary-glass)' : 'transparent'}
          >
            <Layers size={12} color="var(--primary-light)" />
            <span>Both WR & WD (Select Both)</span>
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * DateCard: Well-spaced, balanced 3-zone card layout.
 * Zone 1: Header (day + today/star badge)
 * Zone 2: 6 Rule circles in 2x3 grid
 * Zone 3: Withdrawal control (WR/WD with Clear, WR, WD, and BOTH options)
 */
function DateCard({ cell, rules, onOpenDetail, onRuleUpdate, onSelectStatus, onPromptWDAmount }) {
  if (!cell) {
    return <div style={{ minHeight: 106 }} />;
  }

  const { day, dateKey, record, isToday, isFuture, fully, partially, show, colIndex } = cell;

  return (
    <div
      className="cal-cell-mobile"
      onClick={(e) => {
        if (e.target.closest('[data-no-open]')) return;
        onOpenDetail(dateKey);
      }}
      style={{
        background: fully
          ? 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(99,102,241,0.05))'
          : partially
          ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(245,158,11,0.03))'
          : isToday
          ? 'var(--primary-glass)'
          : 'var(--card)',
        border: `1px solid ${
          fully
            ? 'rgba(16,185,129,0.4)'
            : isToday
            ? 'var(--border-accent)'
            : partially
            ? 'rgba(99,102,241,0.25)'
            : 'var(--border)'
        }`,
        borderRadius: 'var(--radius)',
        padding: '8px 8px 6px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        opacity: show ? 1 : 0.2,
        pointerEvents: show ? 'auto' : 'none',
        position: 'relative',
        minHeight: 108,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: isToday ? '0 0 14px rgba(99, 102, 241, 0.2)' : 'none'
      }}
      onMouseEnter={e => {
        if (!fully) e.currentTarget.style.borderColor = 'var(--primary-light)';
      }}
      onMouseLeave={e => {
        if (!fully) e.currentTarget.style.borderColor = isToday ? 'var(--border-accent)' : partially ? 'rgba(99,102,241,0.25)' : 'var(--border)';
      }}
    >
      {/* ── ZONE 1: DATE NUMBER & BADGES ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{
          fontSize: 13, fontWeight: 700,
          color: isToday ? 'var(--primary-light)' : isFuture ? 'var(--text-muted)' : 'var(--text)',
          lineHeight: 1,
        }}>
          {day}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {fully && <Star size={11} color="#f59e0b" fill="#f59e0b" title="Fully Completed (6/6 rules)!" />}
          {isToday && (
            <span style={{
              fontSize: 8, fontWeight: 800, background: 'var(--primary)', color: 'white',
              borderRadius: 'var(--radius-full)', padding: '1px 5px', letterSpacing: '0.05em'
            }}>TODAY</span>
          )}
        </div>
      </div>

      {/* ── ZONE 2: 6 DISCIPLINE CIRCLES (2x3 Grid with generous spacing) ── */}
      <div data-no-open style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 6,
        justifyItems: 'center',
        padding: '2px 0 6px'
      }}>
        {rules.map(rule => (
          <RuleCircle
            key={rule.id}
            status={record.rules[rule.id]}
            ruleId={rule.id}
            dateKey={dateKey}
            onUpdate={onRuleUpdate}
            rules={rules}
            colIndex={colIndex}
          />
        ))}
      </div>

      {/* ── ZONE 3: WITHDRAWAL CONTROL (WR, WD, or BOTH) ── */}
      <div data-no-open style={{ marginTop: 'auto', paddingTop: 2 }}>
        <WithdrawalControl
          record={record}
          dateKey={dateKey}
          onSelectStatus={onSelectStatus}
          onPromptWDAmount={onPromptWDAmount}
          colIndex={colIndex}
        />
      </div>
    </div>
  );
}

// ─── WD Amount Modal ──────────────────────────────────────────────────────────
function WDAmountModal({ isOpen, dateKey, initialAmount, targetMode, onConfirm, onCancel }) {
  const [amountVal, setAmountVal] = useState(initialAmount > 0 ? String(initialAmount) : '');

  useEffect(() => {
    setAmountVal(initialAmount > 0 ? String(initialAmount) : '');
  }, [initialAmount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = Math.max(0, Number(amountVal) || 0);
    onConfirm(dateKey, parsed, targetMode);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,15,13,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.15s ease'
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
        animation: 'modalScaleIn 0.2s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'var(--success-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <IndianRupee size={18} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {targetMode === 'BOTH' ? 'Both (WR & WD) — Enter WD Amount' : 'Withdrawal Done (WD) Amount'}
            </h3>
          </div>
          <button onClick={onCancel} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
          Date: <strong>{dateKey}</strong>. Enter the settled withdrawal amount for this date.
          {targetMode === 'BOTH' && (
            <span style={{ display: 'block', marginTop: 4, color: 'var(--primary-light)', fontWeight: 600 }}>
              Both WR (Requested) and WD (Settled) will be logged.
            </span>
          )}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Amount (₹)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--success)', fontWeight: 800, fontSize: 16 }}>
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                autoFocus
                value={amountVal}
                onChange={e => setAmountVal(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px 12px 10px 32px',
                  color: 'var(--text)',
                  fontSize: 16,
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: 'var(--font)'
                }}
                onFocus={e => e.target.style.borderColor = 'var(--success)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {/* Quick preset amounts */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            {[500, 1000, 2000, 5000, 10000].map(amt => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountVal(String(amt))}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-2)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                +₹{amt.toLocaleString('en-IN')}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', fontSize: 13, fontWeight: 700, background: 'var(--success)', borderColor: 'var(--success)' }}
            >
              ✓ Save Withdrawal
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-ghost"
              style={{ padding: '10px 16px', fontSize: 13 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
function DayDetailPanel({ dateKey, rules, onClose, onDataChange, onPromptWDAmount }) {
  const [record, setRecord] = useState(null);
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const notesTimer = useRef(null);

  useEffect(() => {
    const r = getRecord(dateKey);
    setRecord(r);
    setNotes(r.notes);
    setTasks(r.tasks);
    setSaved(false);
  }, [dateKey]);

  const handleRuleUpdate = (dk, ruleId, status) => {
    updateRuleStatus(dk, ruleId, status);
    const updated = getRecord(dk);
    setRecord(updated);
    onDataChange();
    flashSaved();
  };

  const handleWithdrawalChange = (status) => {
    if (status === 'WD' || status === 'BOTH') {
      onPromptWDAmount(dateKey, record.withdrawalAmount || 0, status);
    } else {
      setDayWithdrawal(dateKey, status, 0);
      const updated = getRecord(dateKey);
      setRecord(updated);
      onDataChange();
      flashSaved();
    }
  };

  const handleNotesChange = (val) => {
    setNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(() => {
      updateNotes(dateKey, val);
      onDataChange();
      flashSaved();
    }, 600);
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const t = [...tasks, { id: Date.now(), text: newTask.trim(), done: false }];
    setTasks(t);
    updateTasks(dateKey, t);
    setNewTask('');
    onDataChange();
    flashSaved();
  };

  const toggleTask = (id) => {
    const t = tasks.map(task => task.id === id ? { ...task, done: !task.done } : task);
    setTasks(t);
    updateTasks(dateKey, t);
    onDataChange();
  };

  const removeTask = (id) => {
    const t = tasks.filter(task => task.id !== id);
    setTasks(t);
    updateTasks(dateKey, t);
    onDataChange();
  };

  const handleReset = () => {
    if (!confirmReset) { setConfirmReset(true); return; }
    resetDayRules(dateKey);
    const updated = getRecord(dateKey);
    setRecord(updated);
    setConfirmReset(false);
    onDataChange();
    flashSaved();
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  if (!record) return null;

  const today = getTodayKey();
  const isFuture = dateKey > today;
  const fully = isFullyCompleted(record);
  const partially = isPartiallyCompleted(record);

  const hasWR = Boolean(record.withdrawals?.WR || record.withdrawalStatus === 'WR' || record.withdrawalStatus === 'BOTH');
  const hasWD = Boolean(record.withdrawals?.WD || record.withdrawalStatus === 'WD' || record.withdrawalStatus === 'BOTH');

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,15,13,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 580,
        maxHeight: '92vh', overflowY: 'auto', position: 'relative',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        animation: 'modalScaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              {formatDateKey(dateKey)}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              {fully && (
                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={11} fill="#f59e0b" /> Fully Completed (6/6)!
                </span>
              )}
              {partially && !fully && (
                <span style={{ fontSize: 11, color: 'var(--primary-light)', fontWeight: 600 }}>
                  ⚡ Partially Done (≥1 Rule Completed)
                </span>
              )}
              {isFuture && <span className="badge badge-muted">Future Date</span>}
              {saved && <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={10} /> Saved</span>}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={handleReset}
              style={{
                padding: '5px 10px', borderRadius: 'var(--radius-sm)', fontSize: 11, fontWeight: 600,
                background: confirmReset ? 'var(--danger-glass)' : 'var(--surface-2)',
                border: `1px solid ${confirmReset ? 'var(--danger)' : 'var(--border)'}`,
                color: confirmReset ? 'var(--danger)' : 'var(--text-2)',
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer',
              }}
              title="Reset all statuses for this day"
            >
              <RotateCcw size={11} />
              {confirmReset ? 'Confirm Reset?' : 'Reset'}
            </button>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Withdrawal Status & Amount */}
        <div style={{
          marginBottom: 20, padding: '14px 16px', background: 'var(--surface-2)',
          border: '1px solid var(--border)', borderRadius: 'var(--radius)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                Withdrawal Options (WR, WD, or Both)
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {hasWR && hasWD ? `Both Active: WR Requested & WD Completed (${formatCurrency(record.withdrawalAmount)})` : hasWD ? `WD Completed · ${formatCurrency(record.withdrawalAmount)}` : hasWR ? 'WR Requested' : 'No withdrawal recorded'}
              </div>
            </div>
            {hasWD && (
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)', background: 'var(--success-glass)', padding: '2px 8px', borderRadius: 4 }}>
                {formatCurrency(record.withdrawalAmount)}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleWithdrawalChange(null)}
              style={{
                padding: '8px', borderRadius: 'var(--radius-sm)',
                background: (!hasWR && !hasWD) ? 'var(--surface-3)' : 'transparent',
                border: '1px solid var(--border)', color: 'var(--text-2)', fontSize: 11, fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ✕ Clear
            </button>

            <button
              type="button"
              onClick={() => handleWithdrawalChange('WR')}
              style={{
                padding: '8px', borderRadius: 'var(--radius-sm)',
                background: (hasWR && !hasWD) ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                border: `1px solid ${(hasWR && !hasWD) ? '#f59e0b' : 'var(--border)'}`,
                color: '#fbbf24', fontSize: 11, fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🟠 WR (Only)
            </button>

            <button
              type="button"
              onClick={() => handleWithdrawalChange('WD')}
              style={{
                padding: '8px', borderRadius: 'var(--radius-sm)',
                background: (!hasWR && hasWD) ? 'var(--success-glass)' : 'transparent',
                border: `1px solid ${(!hasWR && hasWD) ? 'var(--success)' : 'var(--border)'}`,
                color: 'var(--success)', fontSize: 11, fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🟢 WD (Only)
            </button>

            <button
              type="button"
              onClick={() => handleWithdrawalChange('BOTH')}
              style={{
                padding: '8px', borderRadius: 'var(--radius-sm)',
                background: (hasWR && hasWD) ? 'var(--primary-glass)' : 'transparent',
                border: `1px solid ${(hasWR && hasWD) ? 'var(--primary)' : 'var(--border)'}`,
                color: 'var(--primary-light)', fontSize: 11, fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ Both WR & WD
            </button>
          </div>
        </div>

        {/* Six Rules */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={12} /> Daily Discipline Rules (Click to Cycle)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map((rule) => {
              const status = record.rules[rule.id];
              const cfg = RULE_STATUS_CONFIG[status];
              return (
                <div key={rule.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  background: 'var(--surface-2)', border: `1px solid ${cfg?.border || 'var(--border)'}`,
                  borderRadius: 'var(--radius)', transition: 'border-color 0.2s',
                }}>
                  <div style={{ flexShrink: 0 }}>
                    <RuleCircle
                      status={status}
                      ruleId={rule.id}
                      dateKey={dateKey}
                      onUpdate={handleRuleUpdate}
                      rules={rules}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', background: 'var(--primary-glass)', borderRadius: 3, padding: '1px 5px' }}>{rule.id}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{rule.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-2)', margin: 0, lineHeight: 1.4 }}>{rule.description}</p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: cfg?.color || 'var(--text-muted)' }}>{cfg?.label || 'Unset'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <BookOpen size={12} /> Daily Notes
          </label>
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Daily notes & reflections…"
            rows={3}
            style={{
              width: '100%', background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '10px 12px', color: 'var(--text)',
              fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'var(--font)',
              lineHeight: 1.5,
            }}
            onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Tasks Checklist */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Clock size={12} /> Day Tasks ({tasks.filter(t => t.done).length}/{tasks.length})
          </label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              type="text"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTask(); }}
              placeholder="Add task…"
              style={{
                flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text)',
                fontSize: 13, outline: 'none', fontFamily: 'var(--font)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button onClick={addTask} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Plus size={14} /> Add
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
              }}>
                <button
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `1px solid ${task.done ? 'var(--success)' : 'var(--border)'}`,
                    background: task.done ? 'var(--success)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {task.done && <Check size={11} color="white" />}
                </button>
                <span style={{
                  flex: 1, fontSize: 13, color: task.done ? 'var(--text-muted)' : 'var(--text)',
                  textDecoration: task.done ? 'line-through' : 'none',
                }}>
                  {task.text}
                </span>
                <button
                  onClick={() => removeTask(task.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Dashboard (Featuring Both Streaks & Withdrawal Totals) ─────────────
function StatsDashboard({ stats }) {
  const cards = [
    {
      icon: <Zap size={20} />,
      label: 'Partially Stack (Current)',
      sub: '≥1 Rule Done',
      value: `${stats.partialCurrentStreak} Days`,
      color: 'var(--primary-light)',
      bg: 'var(--primary-glass)'
    },
    {
      icon: <Flame size={20} />,
      label: 'Partially Stack (Best)',
      sub: 'Record High',
      value: `${stats.partialBestStreak} Days`,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)'
    },
    {
      icon: <Trophy size={20} />,
      label: 'Fully Stack (Current)',
      sub: 'All 6 Rules Done',
      value: `${stats.fullCurrentStreak} Days`,
      color: 'var(--success)',
      bg: 'var(--success-glass)'
    },
    {
      icon: <Star size={20} />,
      label: 'Fully Stack (Best)',
      sub: 'Record High',
      value: `${stats.fullBestStreak} Days`,
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.12)'
    },
    {
      icon: <IndianRupee size={20} />,
      label: 'This Month Withdrawn',
      sub: 'Selected Month Total',
      value: formatCurrency(stats.currentMonthWithdrawalTotal),
      color: 'var(--success)',
      bg: 'var(--success-glass)'
    },
    {
      icon: <Wallet size={20} />,
      label: 'All-Time Total Withdrawn',
      sub: 'Grand Total Across All Dates',
      value: formatCurrency(stats.allTimeWithdrawalTotal),
      color: 'var(--primary-light)',
      bg: 'var(--primary-glass)'
    },
    {
      icon: <CheckCircle2 size={20} />,
      label: 'Total Full Days (6/6)',
      sub: 'Perfect Days',
      value: stats.totalFullyCompleted,
      color: 'var(--success)',
      bg: 'var(--success-glass)'
    },
    {
      icon: <Target size={20} />,
      label: 'Total Partial Days',
      sub: 'At Least 1 Rule',
      value: stats.totalPartiallyCompleted,
      color: 'var(--primary-light)',
      bg: 'var(--primary-glass)'
    },
    {
      icon: <AlertCircle size={20} />,
      label: 'WR Days',
      sub: 'Requested Withdrawals',
      value: stats.totalWR,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)'
    },
    {
      icon: <CheckCircle2 size={20} />,
      label: 'WD Days',
      sub: 'Completed Withdrawals',
      value: stats.totalWD,
      color: 'var(--success)',
      bg: 'var(--success-glass)'
    },
    {
      icon: <Layers size={20} />,
      label: 'Both WR & WD Days',
      sub: 'Dual Status Dates',
      value: stats.totalBoth,
      color: 'var(--primary)',
      bg: 'var(--primary-glass)'
    },
    {
      icon: <TrendingUp size={20} />,
      label: 'Weekly Completion Rate',
      sub: 'Last 7 Days',
      value: `${stats.weekRate}%`,
      color: 'var(--info)',
      bg: 'var(--info-glass)'
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
      {cards.map((card, i) => (
        <div key={i} style={{
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: 8,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
              {card.icon}
            </div>
            {card.sub && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
                {card.sub}
              </span>
            )}
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{card.value}</div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{card.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Settings Panel ───────────────────────────────────────────────────────────
function RulesSettings({ rules, onSave, onClose }) {
  const [editRules, setEditRules] = useState(rules.map(r => ({ ...r })));
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveRules(editRules);
    onSave(editRules);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,15,13,0.85)', backdropFilter: 'blur(10px)',
      zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
        animation: 'modalScaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Settings size={16} color="var(--primary)" /> Discipline Rule Settings
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {editRules.map((rule, idx) => (
            <div key={rule.id} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', background: 'var(--primary-glass)', borderRadius: 4, padding: '2px 7px' }}>{rule.id}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Label</label>
                  <input
                    type="text"
                    value={rule.label}
                    onChange={e => {
                      const updated = [...editRules];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      setEditRules(updated);
                    }}
                    style={{
                      width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--text)',
                      fontSize: 13, outline: 'none', fontFamily: 'var(--font)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>Description</label>
                  <input
                    type="text"
                    value={rule.description}
                    onChange={e => {
                      const updated = [...editRules];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setEditRules(updated);
                    }}
                    style={{
                      width: '100%', background: 'var(--surface-3)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', padding: '7px 10px', color: 'var(--text)',
                      fontSize: 13, outline: 'none', fontFamily: 'var(--font)',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--border-accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={handleSave} style={{ flex: 1, padding: '10px', background: 'var(--primary)', color: 'white', borderRadius: 'var(--radius)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none' }}>
            {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Rules</>}
          </button>
          <button onClick={onClose} style={{ padding: '10px 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-2)', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DisciplineCalendar() {
  const today = getTodayKey();
  const todayDate = parseLocalDate(today);

  const [viewYear, setViewYear] = useState(todayDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [monthData, setMonthData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [rules, setRules] = useState(() => getRules());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const yearPickerRef = useRef(null);

  // WD Amount Modal state: supports both 'WD' and 'BOTH'
  const [wdModal, setWdModal] = useState({ isOpen: false, dateKey: null, initialAmount: 0, targetMode: 'WD' });

  const yearMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

  const loadData = useCallback(() => {
    const mData = getMonthRecords(yearMonth);
    setMonthData(mData);
    setStats(computeStats(yearMonth));
  }, [yearMonth]);

  useEffect(() => {
    loadData();
    syncDisciplineWithDB().then(() => loadData());
  }, [loadData]);

  useEffect(() => {
    if (!showYearPicker) return;
    function handleClick(e) {
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target)) setShowYearPicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showYearPicker]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const goToToday = () => {
    setViewYear(todayDate.getFullYear());
    setViewMonth(todayDate.getMonth());
  };

  const handleRuleUpdate = (dateKey, ruleId, status) => {
    updateRuleStatus(dateKey, ruleId, status);
    loadData();
  };

  const handleSelectWithdrawalStatus = (dateKey, status, amount = 0) => {
    setDayWithdrawal(dateKey, status, amount);
    loadData();
  };

  const handleOpenWDAmountPrompt = (dateKey, initialAmount, targetMode = 'WD') => {
    setWdModal({ isOpen: true, dateKey, initialAmount: initialAmount || 0, targetMode });
  };

  const handleConfirmWDAmount = (dateKey, amount, targetMode) => {
    setDayWithdrawal(dateKey, targetMode === 'BOTH' ? 'BOTH' : 'WD', amount);
    setWdModal({ isOpen: false, dateKey: null, initialAmount: 0, targetMode: 'WD' });
    loadData();
  };

  const cells = buildCalendarGrid(viewYear, viewMonth, monthData, filter);

  // Year range for picker
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <div className="page-content" style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--primary-glass)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={18} color="var(--primary-light)" />
            </div>
            Discipline Calendar
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab(activeTab === 'calendar' ? 'stats' : 'calendar')}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {activeTab === 'calendar' ? <BarChart3 size={14} /> : <CalendarDays size={14} />}
            {activeTab === 'calendar' ? 'Statistics' : 'Calendar View'}
          </button>
          <button onClick={() => setShowSettings(true)} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Settings size={14} /> Rule Settings
          </button>
        </div>
      </div>

      {activeTab === 'stats' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 size={16} color="var(--primary)" /> Discipline & Withdrawal Statistics
            </h2>
            <button onClick={loadData} className="btn btn-ghost btn-xs" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
          {stats ? <StatsDashboard stats={stats} /> : (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Computing statistics…
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Calendar Navigation & Month/All-Time Withdrawal Highlights */}
          <div className="cal-header-bar">
            <div className="cal-nav-group">
              <button onClick={prevMonth} style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 }}>
                <ChevronLeft size={16} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} ref={yearPickerRef}>
                <select
                  value={viewMonth}
                  onChange={e => setViewMonth(Number(e.target.value))}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    padding: '6px 12px', color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font)', outline: 'none',
                  }}
                >
                  {MONTH_NAMES.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select
                  value={viewYear}
                  onChange={e => setViewYear(Number(e.target.value))}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                    padding: '6px 12px', color: 'var(--text)', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'var(--font)', outline: 'none',
                  }}
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <button onClick={nextMonth} style={{ width: 36, height: 36, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', flexShrink: 0 }}>
                <ChevronRight size={16} />
              </button>
              <button onClick={goToToday} className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>Today</button>
            </div>

            {/* Financial Highlights: This Month Total & All-Over Total */}
            {stats && (
              <div className="cal-stats-group">
                <div className="cal-stat-card" style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{MONTH_NAMES[viewMonth]} WD:</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--success)' }}>
                    {formatCurrency(stats.currentMonthWithdrawalTotal)}
                  </span>
                </div>

                <div className="cal-stat-card" style={{
                  background: 'var(--surface)', border: '1px solid var(--border-accent)',
                  borderRadius: 'var(--radius)', padding: '6px 12px',
                  display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <Wallet size={13} color="var(--primary-light)" />
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>All-Time:</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-light)' }}>
                    {formatCurrency(stats.allTimeWithdrawalTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Filter Tabs (Horizontal scroll on mobile) */}
          <div className="cal-scrollable-tabs">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f.id}
                className={`tab ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
                style={{ flexShrink: 0 }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Mobile Swipe Hint */}
          <div className="cal-mobile-swipe-hint">
            <span>Swipe horizontally to view full week</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>7 Days</span>
          </div>

          {/* Responsive Calendar Container with smooth horizontal swipe */}
          <div className="cal-responsive-scroll">
            <div className="cal-grid-inner">
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                {DAY_LABELS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {cells.map((cell, idx) => (
                  <DateCard
                    key={cell ? cell.dateKey : `empty-${idx}`}
                    cell={cell}
                    rules={rules}
                    onOpenDetail={setSelectedDate}
                    onRuleUpdate={handleRuleUpdate}
                    onSelectStatus={handleSelectWithdrawalStatus}
                    onPromptWDAmount={handleOpenWDAmountPrompt}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick stats bar: Dual Streaks & Financial Totals */}
          {stats && (
            <div style={{
              marginTop: 18, padding: '14px 18px', background: 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
              display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center',
            }}>
              {/* 1. Partially Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--primary-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ⚡ Partially Stack
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                  {stats.partialCurrentStreak}d <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>(Best: {stats.partialBestStreak}d)</span>
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>≥1 rule completed</span>
              </div>

              {/* 2. Fully Stack */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🏆 Fully Stack
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>
                  {stats.fullCurrentStreak}d <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>(Best: {stats.fullBestStreak}d)</span>
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>All 6 rules completed</span>
              </div>

              {/* Full Days */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Full Days (6/6)
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--success)' }}>
                  {stats.totalFullyCompleted}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Total days</span>
              </div>

              {/* Status Counts (WR, WD, Both) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Withdrawals
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  <span style={{ color: '#f59e0b' }}>{stats.totalWR} WR</span> · <span style={{ color: '#10b981' }}>{stats.totalWD} WD</span> {stats.totalBoth > 0 && <span style={{ color: 'var(--primary-light)', fontSize: 11 }}>({stats.totalBoth} both)</span>}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Recorded dates</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* WD Amount Modal */}
      <WDAmountModal
        isOpen={wdModal.isOpen}
        dateKey={wdModal.dateKey}
        initialAmount={wdModal.initialAmount}
        targetMode={wdModal.targetMode}
        onConfirm={handleConfirmWDAmount}
        onCancel={() => setWdModal({ isOpen: false, dateKey: null, initialAmount: 0, targetMode: 'WD' })}
      />

      {/* Day Detail Modal */}
      {selectedDate && (
        <DayDetailPanel
          dateKey={selectedDate}
          rules={rules}
          onClose={() => setSelectedDate(null)}
          onDataChange={loadData}
          onPromptWDAmount={handleOpenWDAmountPrompt}
        />
      )}

      {/* Rules Settings Modal */}
      {showSettings && (
        <RulesSettings
          rules={rules}
          onSave={(updated) => setRules(updated)}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
