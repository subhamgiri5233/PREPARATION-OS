// src/services/dailyTargetService.js
// Central service for customizable daily learning targets (Personal Choice)
// Allows the user to decide completely freely how much vocabulary and Gita shlokas they want to input/update each day.
// No hardcoded numbers like 10 or 1 specifically — everything is user choice.

import { updateSettings } from './db.js';

const VOCAB_TARGET_KEY = 'focusos_vocab_daily_target';
const GITA_TARGET_KEY = 'focusos_gita_daily_target';

/**
 * Get the current user-selected daily vocabulary target.
 * Returns null if user has not set a specific quota yet.
 */
export function getVocabDailyTarget() {
  try {
    const stored = localStorage.getItem(VOCAB_TARGET_KEY);
    if (stored !== null && stored !== '') {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (_) {}
  return null;
}

/**
 * Save the user-selected daily vocabulary target.
 */
export async function setVocabDailyTarget(val) {
  const num = (val === null || val === '' || isNaN(val)) ? null : Math.max(1, parseInt(val, 10));
  try {
    if (num === null) {
      localStorage.removeItem(VOCAB_TARGET_KEY);
    } else {
      localStorage.setItem(VOCAB_TARGET_KEY, String(num));
    }
    window.dispatchEvent(new CustomEvent('daily-targets-updated', {
      detail: { type: 'vocab', target: num }
    }));
    if (num !== null) {
      updateSettings({ vocabDailyTarget: num }).catch(() => {});
    }
  } catch (err) {
    console.warn('[dailyTargetService] setVocabDailyTarget error:', err);
  }
  return num;
}

/**
 * Get the current user-selected daily Gita shloka target.
 * Returns null if user has not set a specific quota yet.
 */
export function getGitaDailyTarget() {
  try {
    const stored = localStorage.getItem(GITA_TARGET_KEY);
    if (stored !== null && stored !== '') {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (_) {}
  return null;
}

/**
 * Save the user-selected daily Gita shloka target.
 */
export async function setGitaDailyTarget(val) {
  const num = (val === null || val === '' || isNaN(val)) ? null : Math.max(1, parseInt(val, 10));
  try {
    if (num === null) {
      localStorage.removeItem(GITA_TARGET_KEY);
    } else {
      localStorage.setItem(GITA_TARGET_KEY, String(num));
    }
    window.dispatchEvent(new CustomEvent('daily-targets-updated', {
      detail: { type: 'gita', target: num }
    }));
    if (num !== null) {
      updateSettings({ gitaDailyTarget: num }).catch(() => {});
    }
  } catch (err) {
    console.warn('[dailyTargetService] setGitaDailyTarget error:', err);
  }
  return num;
}

/**
 * Subscribe to target changes across tabs/components.
 */
export function onDailyTargetsChange(callback) {
  const handler = (e) => {
    if (callback) callback(e.detail);
  };
  window.addEventListener('daily-targets-updated', handler);
  return () => window.removeEventListener('daily-targets-updated', handler);
}
