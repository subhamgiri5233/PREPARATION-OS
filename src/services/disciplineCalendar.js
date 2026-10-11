// src/services/disciplineCalendar.js
// Discipline Calendar — localStorage data layer
// Supports dual streaks (Partially Stack & Fully Stack) and
// Withdrawal tracking (WR requested, WD completed with amount, and BOTH WR & WD on the same day),
// tracking monthly and all-time total withdrawal amounts.

const STORAGE_KEY = 'focusos_discipline_calendar';
const RULES_KEY = 'focusos_discipline_rules';

// ─── Status Enums ─────────────────────────────────────────────────────────────
export const RULE_STATUS = {
  UNSET: null,
  NOT_TRIED: 'nt',
  COMPLETED: 'completed',
  NOT_COMPLETED: 'not_completed',
};

export const WITHDRAWAL_STATUS = {
  UNSET: null,
  REQUESTED: 'WR',
  DONE: 'WD',
  BOTH: 'BOTH',
};

// ─── Default Rule Definitions ─────────────────────────────────────────────────
const DEFAULT_RULES = [
  { id: 'R1', label: 'Top Secret', description: 'Keep personal and important matters private.' },
  { id: 'R2', label: 'Banking', description: 'Complete one Banking class and convert it into mock-test practice.' },
  { id: 'R3', label: 'Paychapt', description: 'Complete one Paychapt class and convert it into mock-test practice.' },
  { id: 'R4', label: 'B.Ed', description: 'Study for at least 30 minutes, with a target of up to one hour.' },
  { id: 'R5', label: 'Combined Practice', description: 'Practise material from Banking, Paychapt, and B.Ed for at least one hour.' },
  { id: 'R6', label: 'Personal Commitment', description: 'Need to leave F-F and PGV (***)' },
];

// ─── Date Helpers ─────────────────────────────────────────────────────────────
export function getTodayKey() {
  return localDateKey(new Date());
}

export function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseLocalDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateKey(dateKey) {
  const d = parseLocalDate(dateKey);
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────
function loadAllRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveAllRecords(records) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
  catch (e) { console.error('[DisciplineCalendar] Failed to save:', e); }
}

// ─── Default Record Factory ───────────────────────────────────────────────────
function makeDefaultRecord(dateKey) {
  return {
    date: dateKey,
    rules: { R1: null, R2: null, R3: null, R4: null, R5: null, R6: null },
    withdrawalStatus: null, // null | 'WR' | 'WD' | 'BOTH'
    withdrawalAmount: 0,    // amount in ₹ when WD or BOTH
    withdrawals: { WR: false, WD: false },
    notes: '',
    tasks: [],
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────
const VALID_RULE_STATUSES = new Set([null, 'nt', 'completed', 'not_completed']);
const VALID_WITHDRAWAL_STATUSES = new Set([null, 'WR', 'WD', 'BOTH']);

function validateRecord(record) {
  const clean = makeDefaultRecord(record.date);
  for (const ruleId of Object.keys(clean.rules)) {
    const val = record.rules?.[ruleId];
    clean.rules[ruleId] = VALID_RULE_STATUSES.has(val) ? val : null;
  }

  const w = record.withdrawals || {};
  const hasWR = Boolean(w.WR || record.withdrawalStatus === 'WR' || record.withdrawalStatus === 'BOTH');
  const hasWD = Boolean(w.WD || record.withdrawalStatus === 'WD' || record.withdrawalStatus === 'BOTH');

  clean.withdrawals = { WR: hasWR, WD: hasWD };
  if (hasWR && hasWD) clean.withdrawalStatus = 'BOTH';
  else if (hasWD) clean.withdrawalStatus = 'WD';
  else if (hasWR) clean.withdrawalStatus = 'WR';
  else clean.withdrawalStatus = null;

  // Withdrawal amount validation
  const amt = Number(record.withdrawalAmount);
  clean.withdrawalAmount = hasWD && !isNaN(amt) && amt > 0 ? amt : 0;

  clean.notes = typeof record.notes === 'string' ? record.notes : '';
  clean.tasks = Array.isArray(record.tasks) ? record.tasks : [];
  return clean;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export function getRecord(dateKey) {
  const all = loadAllRecords();
  if (all[dateKey]) return validateRecord(all[dateKey]);
  return makeDefaultRecord(dateKey);
}

export function saveRecord(dateKey, updates) {
  const all = loadAllRecords();
  const existing = all[dateKey] || makeDefaultRecord(dateKey);
  const merged = { ...existing, ...updates, date: dateKey };
  all[dateKey] = validateRecord(merged);
  saveAllRecords(all);
  return all[dateKey];
}

export function updateRuleStatus(dateKey, ruleId, status) {
  const record = getRecord(dateKey);
  record.rules[ruleId] = VALID_RULE_STATUSES.has(status) ? status : null;
  return saveRecord(dateKey, record);
}

/**
 * Set Withdrawal status and optional amount for a date.
 * - 'BOTH': Both WR and WD active (saves WD amount)
 * - 'WR': Withdrawal Requested (resets amount to 0)
 * - 'WD': Withdrawal Done (saves amount)
 * - null: Clears both WR and WD and amount
 */
export function setDayWithdrawal(dateKey, status, amount = 0) {
  const record = getRecord(dateKey);

  if (status === 'BOTH') {
    record.withdrawalStatus = 'BOTH';
    record.withdrawals = { WR: true, WD: true };
    record.withdrawalAmount = Math.max(0, Number(amount) || 0);
  } else if (status === 'WD') {
    record.withdrawalStatus = 'WD';
    record.withdrawals = { WR: false, WD: true };
    record.withdrawalAmount = Math.max(0, Number(amount) || 0);
  } else if (status === 'WR') {
    record.withdrawalStatus = 'WR';
    record.withdrawals = { WR: true, WD: false };
    record.withdrawalAmount = 0;
  } else {
    record.withdrawalStatus = null;
    record.withdrawals = { WR: false, WD: false };
    record.withdrawalAmount = 0;
  }

  return saveRecord(dateKey, record);
}

/**
 * Toggle an individual withdrawal component (WR or WD) on a given date.
 */
export function toggleDayWithdrawalType(dateKey, type, amount = 0) {
  const record = getRecord(dateKey);
  const hasWR = Boolean(record.withdrawals?.WR);
  const hasWD = Boolean(record.withdrawals?.WD);

  if (type === 'WR') {
    const nextWR = !hasWR;
    record.withdrawals = { WR: nextWR, WD: hasWD };
  } else if (type === 'WD') {
    const nextWD = !hasWD;
    record.withdrawals = { WR: hasWR, WD: nextWD };
    if (nextWD) {
      record.withdrawalAmount = Math.max(0, Number(amount) || 0);
    } else {
      record.withdrawalAmount = 0;
    }
  }

  if (record.withdrawals.WR && record.withdrawals.WD) {
    record.withdrawalStatus = 'BOTH';
  } else if (record.withdrawals.WD) {
    record.withdrawalStatus = 'WD';
  } else if (record.withdrawals.WR) {
    record.withdrawalStatus = 'WR';
  } else {
    record.withdrawalStatus = null;
    record.withdrawalAmount = 0;
  }

  return saveRecord(dateKey, record);
}

// Backward-compatible alias
export function updateWithdrawalStatus(dateKey, status) {
  return setDayWithdrawal(dateKey, status, 0);
}

export function updateNotes(dateKey, notes) {
  return saveRecord(dateKey, { notes: typeof notes === 'string' ? notes : '' });
}

export function updateTasks(dateKey, tasks) {
  return saveRecord(dateKey, { tasks: Array.isArray(tasks) ? tasks : [] });
}

export function resetDayRules(dateKey) {
  const record = getRecord(dateKey);
  for (const k of Object.keys(record.rules)) record.rules[k] = null;
  record.withdrawalStatus = null;
  record.withdrawalAmount = 0;
  record.withdrawals = { WR: false, WD: false };
  return saveRecord(dateKey, record);
}

export function getMonthRecords(yearMonth) {
  const all = loadAllRecords();
  const result = {};
  for (const [key, val] of Object.entries(all)) {
    if (key.startsWith(yearMonth)) result[key] = validateRecord(val);
  }
  return result;
}

export function getAllRecords() {
  const all = loadAllRecords();
  const result = {};
  for (const [key, val] of Object.entries(all)) { result[key] = validateRecord(val); }
  return result;
}

export function isFullyCompleted(record) {
  return Object.values(record.rules).every((s) => s === 'completed');
}

export function isPartiallyCompleted(record) {
  return Object.values(record.rules).some((s) => s === 'completed');
}

export function hasAnyData(record) {
  const anyRule = Object.values(record.rules).some((s) => s !== null);
  const anyWithdrawal = record.withdrawalStatus !== null;
  return anyRule || anyWithdrawal || record.notes.trim() !== '';
}

// ─── Statistics with 2 Streaks and Withdrawal Totals ──────────────────────────
export function computeStats(currentYearMonth = null) {
  const all = getAllRecords();
  const today = getTodayKey();
  const pastOrToday = Object.entries(all).filter(([k]) => k <= today);

  let totalFullyCompleted = 0;
  let totalPartiallyCompleted = 0;
  let totalRulesCompleted = 0;
  let totalNT = 0;
  let totalNotCompleted = 0;
  let totalWR = 0;
  let totalWD = 0;
  let totalBoth = 0;
  let allTimeWithdrawalTotal = 0;
  let currentMonthWithdrawalTotal = 0;

  const fullCompletedDays = new Set();
  const partialCompletedDays = new Set();

  for (const [dateKey, record] of Object.entries(all)) {
    const isPastOrToday = dateKey <= today;
    const rules = Object.values(record.rules || {});
    const completedCount = rules.filter((s) => s === 'completed').length;

    if (isPastOrToday) {
      totalRulesCompleted += completedCount;
      totalNT += rules.filter((s) => s === 'nt').length;
      totalNotCompleted += rules.filter((s) => s === 'not_completed').length;

      // Fully stack: all 6 rules completed
      if (completedCount === 6) {
        totalFullyCompleted++;
        fullCompletedDays.add(dateKey);
      }
      // Partially stack: at least 1 rule completed ("percially stack means if one is done")
      if (completedCount >= 1) {
        totalPartiallyCompleted++;
        partialCompletedDays.add(dateKey);
      }
    }

    const hasWR = Boolean(record.withdrawals?.WR || record.withdrawalStatus === 'WR' || record.withdrawalStatus === 'BOTH');
    const hasWD = Boolean(record.withdrawals?.WD || record.withdrawalStatus === 'WD' || record.withdrawalStatus === 'BOTH');

    if (hasWR && isPastOrToday) totalWR++;
    if (hasWD && isPastOrToday) totalWD++;
    if (hasWR && hasWD && isPastOrToday) totalBoth++;

    if (hasWD) {
      const amt = Number(record.withdrawalAmount) || 0;
      allTimeWithdrawalTotal += amt;
      if (currentYearMonth && dateKey.startsWith(currentYearMonth)) {
        currentMonthWithdrawalTotal += amt;
      }
    }
  }

  function calculateStreak(daySet) {
    let current = 0;
    const cd = parseLocalDate(today);
    if (!daySet.has(localDateKey(cd))) {
      cd.setDate(cd.getDate() - 1);
    }
    while (daySet.has(localDateKey(cd))) {
      current++;
      cd.setDate(cd.getDate() - 1);
    }

    let best = 0;
    let running = 0;
    const sorted = [...daySet].sort();
    let prev = null;
    for (const key of sorted) {
      if (prev) {
        const prevD = parseLocalDate(prev);
        const currD = parseLocalDate(key);
        const diff = Math.round((currD - prevD) / 86400000);
        running = diff === 1 ? running + 1 : 1;
      } else {
        running = 1;
      }
      best = Math.max(best, running);
      prev = key;
    }
    return { current, best };
  }

  const fullStreak = calculateStreak(fullCompletedDays);
  const partialStreak = calculateStreak(partialCompletedDays);

  // Weekly rate (last 7 days)
  const weekKeys = [];
  const wd2 = parseLocalDate(today);
  for (let i = 0; i < 7; i++) {
    weekKeys.push(localDateKey(wd2));
    wd2.setDate(wd2.getDate() - 1);
  }
  const weekCompleted = weekKeys.filter((k) => fullCompletedDays.has(k)).length;
  const weekRate = Math.round((weekCompleted / 7) * 100);

  // Monthly rate
  const yearMonth = today.slice(0, 7);
  const daysPassed = parseInt(today.slice(8), 10);
  const monthCompleted = [...fullCompletedDays].filter((k) => k.startsWith(yearMonth)).length;
  const monthRate = daysPassed > 0 ? Math.round((monthCompleted / daysPassed) * 100) : 0;

  return {
    // Dual Streaks:
    partialCurrentStreak: partialStreak.current,
    partialBestStreak: partialStreak.best,
    fullCurrentStreak: fullStreak.current,
    fullBestStreak: fullStreak.best,

    // Totals
    totalFullyCompleted,
    totalPartiallyCompleted,
    totalRulesCompleted,
    totalNT,
    totalNotCompleted,
    totalWR,
    totalWD,
    totalBoth,

    // Financial Totals
    allTimeWithdrawalTotal,
    currentMonthWithdrawalTotal,

    // Rates
    weekRate,
    monthRate,
    totalRecordedDays: pastOrToday.length,

    // Backward-compatible properties
    currentStreak: fullStreak.current,
    bestStreak: fullStreak.best,
  };
}

// ─── Rules Config ─────────────────────────────────────────────────────────────
export function getRules() {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 6) return parsed;
    }
  } catch {}
  return DEFAULT_RULES;
}

export function saveRules(rules) {
  try { localStorage.setItem(RULES_KEY, JSON.stringify(rules)); }
  catch (e) { console.error('[DisciplineCalendar] Failed to save rules:', e); }
}
