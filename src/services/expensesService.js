// src/services/expensesService.js
// Dedicated service for Daily Expenses Calendar & Financial Spend Tracking
// Completely isolated from Discipline Calendar (stored in separate localStorage key)

import { apiFetch } from './api.js';

const STORAGE_KEY = 'focusos_expenses_v1';
const EVENT_NAME = 'focusos_expenses_changed';

/**
 * Format currency in Indian format: ₹1,234
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0';
  return '₹' + Math.round(Number(amount)).toLocaleString('en-IN');
}

/**
 * Standard categories for expenses
 */
export const EXPENSE_CATEGORIES = [
  { id: 'Personal Use', label: 'Personal Use', color: '#6366f1' },
  { id: 'Mess Purpose', label: 'Mess Purpose', color: '#06b6d4' },
  { id: 'Loan Repayment', label: 'Loan Repayment', color: '#f59e0b' },
  { id: 'Credit Card Re Payment', label: 'Credit Card Re Payment', color: '#ef4444' },
  { id: 'Giving Loan', label: 'Giving Loan', color: '#f97316' },
  { id: 'Bill Payment', label: 'Bill Payment', color: '#eab308' },
  { id: 'Recharge', label: 'Recharge', color: '#0ea5e9' },
  { id: 'Others', label: 'Others', color: '#8b5cf6' },
];

export function getCategoryBadge(category) {
  const match = EXPENSE_CATEGORIES.find(c => c.id.toLowerCase() === (category || '').toLowerCase());
  if (match) return match;
  return { id: category, label: category, color: '#a855f7' };
}

/**
 * Get all stored expenses map: { [dateKey: string]: { date, totalAmount, items: [...] } }
 */
export function getAllExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[expensesService] Failed to parse expenses:', err);
    return {};
  }
}

/**
 * Sync expenses with MongoDB Atlas API and merge with localStorage cache
 */
export async function syncExpensesWithDB() {
  try {
    const remote = await apiFetch('/expenses');
    if (remote && typeof remote === 'object') {
      const local = getAllExpenses();
      let localHasExtra = false;
      const merged = { ...remote };
      for (const [key, val] of Object.entries(local)) {
        if (!merged[key] || (val.items && val.items.length > (merged[key].items?.length || 0))) {
          merged[key] = val;
          localHasExtra = true;
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: merged }));
      } catch {}
      if (localHasExtra) {
        apiFetch('/expenses/sync', { method: 'POST', body: merged }).catch(() => {});
      }
      return merged;
    }
  } catch (err) {
    console.warn('[expensesService] DB sync fallback to local cache:', err?.message);
  }
  return getAllExpenses();
}

/**
 * Save full expenses map to localStorage and MongoDB Atlas
 */
function saveAllExpenses(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: data }));
  } catch (err) {
    console.error('[expensesService] Failed to save expenses:', err);
  }
  // Async background sync to MongoDB Atlas
  apiFetch('/expenses/sync', { method: 'POST', body: data }).catch(err => {
    console.warn('[expensesService] Background DB sync queued:', err?.message);
  });
}

/**
 * Get record for a single date (YYYY-MM-DD)
 */
export function getDayExpense(dateKey) {
  const all = getAllExpenses();
  const day = all[dateKey];
  if (day) {
    return {
      date: dateKey,
      totalAmount: Number(day.totalAmount) || 0,
      items: Array.isArray(day.items) ? day.items : [],
      notes: day.notes || '',
    };
  }
  return {
    date: dateKey,
    totalAmount: 0,
    items: [],
    notes: '',
  };
}

/**
 * Get all expenses for a specific month (year: number, month: 0-indexed number)
 */
export function getMonthExpenses(year, month) {
  const all = getAllExpenses();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const result = {};
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith(prefix)) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Add a new expense item to a date
 * @param {string} dateKey - YYYY-MM-DD
 * @param {Object} item - { amount, description, category }
 */
export function addExpenseItem(dateKey, { amount, description = '', category = 'Personal Use', customCategory = '', borrowerName = '' }) {
  const numAmount = Math.max(0, Number(amount) || 0);
  if (numAmount <= 0) return false;

  const all = getAllExpenses();
  const day = all[dateKey] || { date: dateKey, totalAmount: 0, items: [] };

  const isGivingLoan = category === 'Giving Loan';
  const cleanBorrower = isGivingLoan ? (borrowerName || '').trim() : '';

  const finalCategory = (category === 'Others' && customCategory && customCategory.trim())
    ? customCategory.trim()
    : (category || 'Others');

  const resolvedDesc = isGivingLoan && cleanBorrower
    ? `Loan to ${cleanBorrower}`
    : ((description && description.trim()) || finalCategory);

  const newItem = {
    id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    amount: numAmount,
    description: resolvedDesc,
    category: finalCategory,
    baseCategory: category,
    borrowerName: cleanBorrower,
    isLoan: isGivingLoan,
    loanStatus: isGivingLoan ? 'pending' : null, // 'pending' | 'repaid'
    loanGivenDate: dateKey,
    lastCheckedDate: null,
    repaidDate: null,
    timestamp: new Date().toISOString(),
  };

  const updatedItems = [...(day.items || []), newItem];
  const newTotal = updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  all[dateKey] = {
    ...day,
    totalAmount: newTotal,
    items: updatedItems,
  };

  saveAllExpenses(all);
  return newItem;
}

export function getLocalTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * Get active pending loans given to others across all dates/months.
 * If onlyDueToday is true, excludes loans already checked today so they disappear for today
 * and reappear tomorrow!
 */
export function getPendingLoans(onlyDueToday = true) {
  const all = getAllExpenses();
  const todayKey = getLocalTodayKey();
  const list = [];
  for (const [dateKey, day] of Object.entries(all)) {
    if (Array.isArray(day.items)) {
      for (const it of day.items) {
        const isLoan = it.isLoan || it.baseCategory === 'Giving Loan' || it.category === 'Giving Loan';
        if (isLoan && it.loanStatus !== 'repaid') {
          // Exclude if already checked today
          if (onlyDueToday && it.lastCheckedDate === todayKey) {
            continue;
          }
          list.push({
            ...it,
            dateKey,
          });
        }
      }
    }
  }
  // Sort by dateKey ascending (oldest loan first)
  list.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  return list;
}

/**
 * Mark a given loan as repaid (Yes)
 */
export function markLoanRepaid(dateKey, itemId, repaid = true) {
  const all = getAllExpenses();
  const todayKey = getLocalTodayKey();
  let found = false;

  const updateInDay = (day) => {
    if (!day || !Array.isArray(day.items)) return false;
    let mod = false;
    day.items = day.items.map(it => {
      if (it.id === itemId) {
        mod = true;
        return {
          ...it,
          loanStatus: repaid ? 'repaid' : 'pending',
          repaidDate: repaid ? todayKey : null,
          lastCheckedDate: todayKey,
        };
      }
      return it;
    });
    return mod;
  };

  if (dateKey && all[dateKey]) {
    found = updateInDay(all[dateKey]);
  }
  if (!found) {
    for (const d of Object.values(all)) {
      if (updateInDay(d)) {
        found = true;
        break;
      }
    }
  }

  if (found) {
    saveAllExpenses(all);
  }
  return found;
}

/**
 * Record today's check as "No" for a pending loan
 * Sets lastCheckedDate to today so it disappears for today and asks again tomorrow!
 */
export function recordLoanCheckNo(dateKey, itemId) {
  const all = getAllExpenses();
  const todayKey = getLocalTodayKey();
  let found = false;

  const updateInDay = (day) => {
    if (!day || !Array.isArray(day.items)) return false;
    let mod = false;
    day.items = day.items.map(it => {
      if (it.id === itemId) {
        mod = true;
        return {
          ...it,
          lastCheckedDate: todayKey,
          lastCheckedResponse: 'no',
        };
      }
      return it;
    });
    return mod;
  };

  if (dateKey && all[dateKey]) {
    found = updateInDay(all[dateKey]);
  }
  if (!found) {
    for (const d of Object.values(all)) {
      if (updateInDay(d)) {
        found = true;
        break;
      }
    }
  }

  if (found) {
    saveAllExpenses(all);
  }
  return found;
}

/**
 * Delete a specific expense item
 */
export function deleteExpenseItem(dateKey, itemId) {
  const all = getAllExpenses();
  const day = all[dateKey];
  if (!day || !day.items) return false;

  const updatedItems = day.items.filter(it => it.id !== itemId);
  const newTotal = updatedItems.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

  if (updatedItems.length === 0) {
    delete all[dateKey];
  } else {
    all[dateKey] = {
      ...day,
      totalAmount: newTotal,
      items: updatedItems,
    };
  }

  saveAllExpenses(all);
  return true;
}

/**
 * Clear all expenses for a date
 */
export function clearDayExpenses(dateKey) {
  const all = getAllExpenses();
  if (all[dateKey]) {
    delete all[dateKey];
    saveAllExpenses(all);
  }
}

/**
 * Compute monthly and all-time statistics
 */
export function getExpenseStats(year, month) {
  const all = getAllExpenses();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  let currentMonthTotal = 0;
  let allTimeTotal = 0;
  let currentMonthActiveDays = 0;
  let highestSpendDay = { dateKey: null, amount: 0 };
  const categoryTotals = {};

  for (const [dateKey, day] of Object.entries(all)) {
    const total = Number(day.totalAmount) || 0;
    allTimeTotal += total;

    if (dateKey.startsWith(prefix)) {
      currentMonthTotal += total;
      if (total > 0) {
        currentMonthActiveDays += 1;
        if (total > highestSpendDay.amount) {
          highestSpendDay = { dateKey, amount: total };
        }
      }

      if (Array.isArray(day.items)) {
        for (const it of day.items) {
          const cat = it.category || 'Other';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(it.amount) || 0);
        }
      }
    }
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyAverage = currentMonthActiveDays > 0 ? Math.round(currentMonthTotal / currentMonthActiveDays) : 0;

  return {
    currentMonthTotal,
    allTimeTotal,
    currentMonthActiveDays,
    dailyAverage,
    highestSpendDay,
    categoryTotals,
    daysInMonth,
  };
}

/**
 * Get comprehensive breakdown of all categories for month and all-time
 */
export function getCategoryBreakdown(year, month) {
  const all = getAllExpenses();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;

  const categoryMap = {};
  for (const cat of EXPENSE_CATEGORIES) {
    categoryMap[cat.id] = {
      id: cat.id,
      label: cat.label,
      color: cat.color,
      monthAmount: 0,
      monthCount: 0,
      allTimeAmount: 0,
      allTimeCount: 0,
    };
  }

  let monthTotal = 0;
  let allTimeTotal = 0;
  let monthItemCount = 0;
  let allTimeItemCount = 0;

  for (const [dateKey, day] of Object.entries(all)) {
    const isCurrentMonth = dateKey.startsWith(prefix);
    if (Array.isArray(day.items)) {
      for (const it of day.items) {
        const amt = Number(it.amount) || 0;
        const catKey = it.baseCategory || it.category || 'Others';

        const matchedId = EXPENSE_CATEGORIES.some(c => c.id === catKey) ? catKey : 'Others';
        if (!categoryMap[matchedId]) {
          categoryMap[matchedId] = {
            id: matchedId,
            label: matchedId,
            color: getCategoryBadge(matchedId).color,
            monthAmount: 0,
            monthCount: 0,
            allTimeAmount: 0,
            allTimeCount: 0,
          };
        }

        categoryMap[matchedId].allTimeAmount += amt;
        categoryMap[matchedId].allTimeCount += 1;
        allTimeTotal += amt;
        allTimeItemCount += 1;

        if (isCurrentMonth) {
          categoryMap[matchedId].monthAmount += amt;
          categoryMap[matchedId].monthCount += 1;
          monthTotal += amt;
          monthItemCount += 1;
        }
      }
    }
  }

  const list = Object.values(categoryMap).map(c => ({
    ...c,
    monthPercentage: monthTotal > 0 ? Math.round((c.monthAmount / monthTotal) * 100) : 0,
    allTimePercentage: allTimeTotal > 0 ? Math.round((c.allTimeAmount / allTimeTotal) * 100) : 0,
  }));

  // Sort by monthAmount descending, then allTimeAmount
  list.sort((a, b) => (b.monthAmount - a.monthAmount) || (b.allTimeAmount - a.allTimeAmount));

  return {
    categories: list,
    monthTotal,
    allTimeTotal,
    monthItemCount,
    allTimeItemCount,
  };
}

/**
 * Listen for expenses change
 */
export function onExpensesChange(callback) {
  const listener = () => callback();
  window.addEventListener(EVENT_NAME, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(EVENT_NAME, listener);
    window.removeEventListener('storage', listener);
  };
}
