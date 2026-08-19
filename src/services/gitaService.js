// src/services/gitaService.js
import {
  getAllGitaShlokas,
  getTodayGitaShloka,
  getGitaShlokaById,
  addGitaShloka,
  updateGitaShloka,
  deleteGitaShloka,
  toggleGitaFavorite
} from './db.js';
import { format, parseISO, subDays, differenceInCalendarDays } from 'date-fns';

export {
  getAllGitaShlokas,
  getTodayGitaShloka,
  getGitaShlokaById,
  addGitaShloka,
  updateGitaShloka,
  deleteGitaShloka,
  toggleGitaFavorite
};

/**
 * Calculates Gita Shloka statistics (total, this month, favorites, streaks).
 */
export async function getGitaStats() {
  const all = await getAllGitaShlokas();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const currentMonthStr = format(new Date(), 'yyyy-MM');

  const totalShlokas = all.length;
  const thisMonth = all.filter((s) => (s.date || '').startsWith(currentMonthStr)).length;
  const favorites = all.filter((s) => !!s.favorite).length;

  // Streak calculation based purely on saved shloka records
  const uniqueDates = [...new Set(all.map((s) => s.date).filter(Boolean))].sort();

  let currentStreak = 0;
  let longestStreak = 0;

  if (uniqueDates.length > 0) {
    // Calculate Longest Streak
    let tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = parseISO(uniqueDates[i - 1]);
      const currDate = parseISO(uniqueDates[i]);
      const diff = differenceInCalendarDays(currDate, prevDate);
      if (diff === 1) {
        tempStreak += 1;
      } else if (diff > 1) {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    // Calculate Current Streak
    const dateSet = new Set(uniqueDates);
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    let startDate = null;
    if (dateSet.has(todayStr)) {
      startDate = new Date();
    } else if (dateSet.has(yesterdayStr)) {
      startDate = subDays(new Date(), 1);
    }

    if (startDate) {
      let checkDate = startDate;
      while (dateSet.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak += 1;
        checkDate = subDays(checkDate, 1);
      }
    }
  }

  return {
    totalShlokas,
    thisMonth,
    favorites,
    currentStreak,
    longestStreak,
  };
}

/**
 * Search and filter Gita Shlokas.
 */
export async function searchShlokas({ query = '', chapter = '', date = '', favoritesOnly = false } = {}) {
  let list = await getAllGitaShlokas();

  if (chapter) {
    list = list.filter((s) => String(s.chapter) === String(chapter));
  }

  if (date) {
    list = list.filter((s) => s.date === date);
  }

  if (favoritesOnly) {
    list = list.filter((s) => !!s.favorite);
  }

  if (query && query.trim() !== '') {
    const q = query.trim().toLowerCase();
    list = list.filter((s) => {
      return (
        (s.sanskritText || '').toLowerCase().includes(q) ||
        (s.transliteration || '').toLowerCase().includes(q) ||
        (s.meaning || '').toLowerCase().includes(q) ||
        (s.personalReflection || '').toLowerCase().includes(q) ||
        (s.chapter || '').toLowerCase().includes(q) ||
        (s.verse || '').toLowerCase().includes(q)
      );
    });
  }

  return list;
}
