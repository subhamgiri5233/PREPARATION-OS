// src/pages/Expenses.jsx
// Dedicated Expenses Calendar Page — Daily Expense Logs & Monthly Budgeting
// Completely independent and isolated from Discipline Calendar

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, IndianRupee, Plus,
  Trash2, Tag, TrendingDown, Wallet, ArrowUpRight, X, Calendar as CalendarIcon,
  CheckCircle2, PieChart, HandCoins
} from 'lucide-react';
import {
  getMonthExpenses, getDayExpense, addExpenseItem, deleteExpenseItem,
  clearDayExpenses, getExpenseStats, formatCurrency, EXPENSE_CATEGORIES,
  getCategoryBadge, getPendingLoans, markLoanRepaid, recordLoanCheckNo,
  onExpensesChange, syncExpensesWithDB
} from '../services/expensesService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDateDisplay(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday as 0
}

export default function Expenses() {
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => getTodayKey(), []);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [monthData, setMonthData] = useState({});
  const [stats, setStats] = useState(null);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [loanNotice, setLoanNotice] = useState(null);

  // Modal state
  const [selectedDate, setSelectedDate] = useState(null);

  const loadData = () => {
    const data = getMonthExpenses(viewYear, viewMonth);
    setMonthData(data);
    const s = getExpenseStats(viewYear, viewMonth);
    setStats(s);
    const pl = getPendingLoans();
    setPendingLoans(pl);
  };

  const handleMarkRepaid = (dateKey, itemId) => {
    markLoanRepaid(dateKey, itemId, true);
    setPendingLoans(prev => prev.filter(loan => loan.id !== itemId));
    loadData();
    setLoanNotice('Repaid! This loan has been cleared from daily follow-ups.');
    setTimeout(() => setLoanNotice(null), 3000);
  };

  const handleCheckNo = (dateKey, itemId) => {
    recordLoanCheckNo(dateKey, itemId);
    setPendingLoans(prev => prev.filter(loan => loan.id !== itemId));
    loadData();
    setLoanNotice('Recorded for today. This follow-up is hidden for today and will ask you again tomorrow.');
    setTimeout(() => setLoanNotice(null), 3500);
  };

  useEffect(() => {
    loadData();
    syncExpensesWithDB().then(() => loadData());
    const unsubscribe = onExpensesChange(() => loadData());
    return unsubscribe;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Build calendar grid
  const cells = useMemo(() => {
    const totalDays = getDaysInMonth(viewYear, viewMonth);
    const startOffset = getFirstDayOfWeek(viewYear, viewMonth);
    const yearMonth = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;

    const list = [];
    for (let i = 0; i < startOffset; i++) list.push(null);

    for (let day = 1; day <= totalDays; day++) {
      const dateKey = `${yearMonth}-${String(day).padStart(2, '0')}`;
      const record = monthData[dateKey];
      const totalAmount = record ? Number(record.totalAmount) || 0 : 0;
      const isToday = dateKey === todayKey;
      const isFuture = dateKey > todayKey;

      list.push({
        day,
        dateKey,
        totalAmount,
        itemCount: record?.items?.length || 0,
        isToday,
        isFuture,
      });
    }

    return list;
  }, [viewYear, viewMonth, monthData, todayKey]);

  const years = useMemo(() => {
    const curr = today.getFullYear();
    const arr = [];
    for (let y = curr - 4; y <= curr + 5; y++) arr.push(y);
    return arr;
  }, [today]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div className="page-header-left">
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <IndianRupee size={18} color="var(--success)" />
            </div>
            Expenses Calendar
          </h1>
          <p className="page-subtitle">
            Daily expense tracking, spend breakdown, and monthly budget logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setSelectedDate(todayKey)} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Log Today's Expense
          </button>
        </div>
      </div>

      {/* Notice Message */}
      {loanNotice && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--radius)',
          background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)',
          color: 'var(--success)', fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8, animation: 'fadeIn 0.2s ease'
        }}>
          <CheckCircle2 size={16} /> {loanNotice}
        </div>
      )}

      {/* Active Given Loans Daily Follow-up Banner */}
      {pendingLoans.length > 0 && (
        <div style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%)',
          border: '1px solid rgba(249, 115, 22, 0.35)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius)',
                background: 'rgba(249, 115, 22, 0.2)', color: '#f97316',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <HandCoins size={16} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Daily Loan Repayment Check ({pendingLoans.length} Pending)
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Follow-up runs daily until confirmed paid
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pendingLoans.map(loan => (
              <div
                key={loan.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                  padding: '12px 16px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                    Did <strong style={{ color: '#f97316' }}>{loan.borrowerName || 'the borrower'}</strong> pay you back the loan of <span style={{ color: '#ef4444', fontWeight: 800 }}>{formatCurrency(loan.amount)}</span>?
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                    Loan given on: <strong>{formatDateDisplay(loan.dateKey)}</strong>
                    {loan.lastCheckedResponse === 'no' && (
                      <span style={{ marginLeft: 8, color: '#f59e0b' }}>
                        • Previously checked: Still pending
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => handleMarkRepaid(loan.dateKey, loan.id)}
                    className="btn btn-sm btn-success"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <CheckCircle2 size={13} /> Yes (Paid Back)
                  </button>
                  <button
                    onClick={() => handleCheckNo(loan.dateKey, loan.id)}
                    className="btn btn-sm btn-ghost"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-2)' }}
                  >
                    <X size={13} /> No (Not Yet)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Bar: Month Navigator & Financial Totals */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginBottom: 16, flexWrap: 'wrap'
      }}>
        {/* Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={{ width: 34, height: 34, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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

          <button onClick={nextMonth} style={{ width: 34, height: 34, borderRadius: 'var(--radius)', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer' }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={goToToday} className="btn btn-ghost btn-sm">Today</button>
        </div>

        {/* Financial Highlights */}
        {stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Month Total */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{MONTH_NAMES[viewMonth]} Total:</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>
                {formatCurrency(stats.currentMonthTotal)}
              </span>
            </div>

            {/* All-Time Total */}
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border-accent)',
              borderRadius: 'var(--radius)', padding: '6px 14px',
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <Wallet size={14} color="var(--primary-light)" />
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>All-Time Total:</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary-light)' }}>
                {formatCurrency(stats.allTimeTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Weekday headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
        {DAY_LABELS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {cells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`empty-${idx}`}
                style={{
                  minHeight: 105,
                  borderRadius: 'var(--radius-md)',
                  background: 'transparent',
                }}
              />
            );
          }

          const hasExpenses = cell.totalAmount > 0;

          return (
            <div
              key={cell.dateKey}
              onClick={() => setSelectedDate(cell.dateKey)}
              style={{
                minHeight: 105,
                background: cell.isToday
                  ? 'var(--surface-hover)'
                  : hasExpenses
                    ? 'var(--surface)'
                    : 'var(--card)',
                border: cell.isToday
                  ? '2px solid var(--primary)'
                  : hasExpenses
                    ? '1px solid rgba(239, 68, 68, 0.35)'
                    : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 10px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                boxShadow: hasExpenses ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--primary-light)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = cell.isToday
                  ? 'var(--primary)'
                  : hasExpenses
                    ? 'rgba(239, 68, 68, 0.35)'
                    : 'var(--border)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* Day header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: cell.isToday ? 800 : 700,
                  color: cell.isToday ? 'var(--primary-light)' : cell.isFuture ? 'var(--text-muted)' : 'var(--text)',
                }}>
                  {cell.day}
                </span>

                {cell.isToday && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--primary-light)',
                    background: 'var(--primary-glass)',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}>
                    Today
                  </span>
                )}
              </div>

              {/* Display ONLY the amount on this date in RED */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                padding: '6px 0',
              }}>
                {hasExpenses ? (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    color: '#ef4444',
                    padding: '5px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 14,
                    fontWeight: 800,
                    textAlign: 'center',
                    width: '100%',
                    letterSpacing: '-0.02em',
                  }}>
                    {formatCurrency(cell.totalAmount)}
                  </div>
                ) : (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--text-muted)',
                    opacity: 0.4,
                  }}>
                    —
                  </div>
                )}
              </div>

              {/* Subtle hover cue */}
              <div style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                textAlign: 'right',
                minHeight: 14,
              }}>
                {hasExpenses && cell.itemCount > 1 && (
                  <span>{cell.itemCount} items</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Date Expense Details & Input Modal */}
      {selectedDate && (
        <DayExpenseModal
          dateKey={selectedDate}
          onClose={() => setSelectedDate(null)}
          onChanged={loadData}
        />
      )}
    </div>
  );
}

// ─── Day Expense Modal ────────────────────────────────────────────────────────
function DayExpenseModal({ dateKey, onClose, onChanged }) {
  const [record, setRecord] = useState(() => getDayExpense(dateKey));
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Personal Use');
  const [customCategory, setCustomCategory] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [error, setError] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    setRecord(getDayExpense(dateKey));
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [dateKey]);

  const handleAdd = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (category === 'Others' && !customCategory.trim()) {
      setError("Please write the category name for 'Others'.");
      return;
    }
    if (category === 'Giving Loan' && !borrowerName.trim()) {
      setError("Please enter the person's name who received the loan.");
      return;
    }

    addExpenseItem(dateKey, {
      amount: numAmount,
      category,
      customCategory: customCategory.trim(),
      borrowerName: borrowerName.trim(),
    });

    setAmount('');
    setCustomCategory('');
    setBorrowerName('');
    setError('');
    const updated = getDayExpense(dateKey);
    setRecord(updated);
    onChanged();
  };

  const handleDelete = (itemId) => {
    deleteExpenseItem(dateKey, itemId);
    const updated = getDayExpense(dateKey);
    setRecord(updated);
    onChanged();
  };

  const handleClearAll = () => {
    if (window.confirm('Clear all expenses recorded for this date?')) {
      clearDayExpenses(dateKey);
      setRecord(getDayExpense(dateKey));
      onChanged();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(8,15,13,0.85)', backdropFilter: 'blur(8px)',
      zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fadeIn 0.15s ease'
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 480,
        boxShadow: '0 24px 60px rgba(0,0,0,0.85)',
        animation: 'modalScaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 'var(--radius)',
              background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#ef4444'
            }}>
              <IndianRupee size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                Expenses for {formatDateDisplay(dateKey)}
              </h3>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                Log and review spending for this date
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        {/* Day Total Banner */}
        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 18,
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Spent on This Date
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444', marginTop: 2 }}>
              {formatCurrency(record.totalAmount)}
            </div>
          </div>
          {record.items.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                fontSize: 11, color: 'var(--danger)', background: 'var(--danger-glass)',
                border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)',
                padding: '4px 10px', cursor: 'pointer', fontWeight: 600
              }}
            >
              Clear Day
            </button>
          )}
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleAdd} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} color="#ef4444" /> Add Expense
          </div>

          {error && (
            <div style={{ padding: '6px 10px', background: 'var(--danger-glass)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 10 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* Amount */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                  Amount (₹) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#ef4444', fontWeight: 800, fontSize: 14 }}>
                    ₹
                  </span>
                  <input
                    ref={inputRef}
                    type="number"
                    min="1"
                    step="any"
                    className="form-input"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="Amount in ₹"
                    autoFocus
                    style={{ width: '100%', paddingLeft: 26 }}
                    required
                  />
                </div>
              </div>

              {/* Category Dropdown Menu */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 4 }}>
                  Category *
                </label>
                <select
                  className="form-input"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', cursor: 'pointer' }}
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional Giving Loan Borrower Name Input */}
            {category === 'Giving Loan' && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#f97316', display: 'block', marginBottom: 4 }}>
                  Who did you give the loan to? (Person's Name) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={borrowerName}
                  onChange={e => setBorrowerName(e.target.value)}
                  placeholder="Enter person's name (e.g. Rahul, Amit, Priya...)"
                  autoFocus
                  style={{ width: '100%', borderColor: 'rgba(249, 115, 22, 0.4)' }}
                  required
                />
              </div>
            )}

            {/* Conditional Other Category Input */}
            {category === 'Others' && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', display: 'block', marginBottom: 4 }}>
                  Specify Other Category Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={customCategory}
                  onChange={e => setCustomCategory(e.target.value)}
                  placeholder="Enter category name (e.g. Gym, Medicine, Shopping...)"
                  autoFocus
                  style={{ width: '100%', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#ef4444', borderColor: '#ef4444' }}
            >
              <Plus size={14} /> Add Expense
            </button>
          </div>
        </form>

        {/* List of expenses for this date */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Logged Items ({record.items.length})
          </div>

          {record.items.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '16px', background: 'var(--surface-2)',
              borderRadius: 'var(--radius)', color: 'var(--text-3)', fontSize: 12
            }}>
              No expenses recorded for this date yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {record.items.map(item => {
                const catObj = getCategoryBadge(item.category);
                const isLoanItem = item.isLoan || item.baseCategory === 'Giving Loan' || item.category === 'Giving Loan';
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', background: 'var(--surface-2)',
                      borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: catObj.color,
                        background: `${catObj.color}18`, border: `1px solid ${catObj.color}40`,
                        padding: '2px 8px', borderRadius: 4, flexShrink: 0
                      }}>
                        {item.category}
                      </span>
                      {isLoanItem && item.borrowerName && (
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>
                          to {item.borrowerName}
                        </span>
                      )}
                      {isLoanItem && (
                        item.loanStatus === 'repaid' ? (
                          <span style={{ fontSize: 10, color: 'var(--success)', background: 'var(--success-glass)', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                            ✓ Repaid
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              markLoanRepaid(dateKey, item.id, true);
                              setRecord(getDayExpense(dateKey));
                              onChanged();
                            }}
                            className="btn btn-xs btn-ghost"
                            style={{ color: '#f97316', fontSize: 10, padding: '2px 6px', border: '1px solid rgba(249,115,22,0.3)', cursor: 'pointer' }}
                          >
                            Mark Paid
                          </button>
                        )
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginLeft: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>
                        {formatCurrency(item.amount)}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--text-3)',
                          cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center'
                        }}
                        title="Delete item"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px 20px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
