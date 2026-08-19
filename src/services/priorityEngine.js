// src/services/priorityEngine.js
import { differenceInDays, parseISO } from 'date-fns';
import { getPerformancePriorityScore } from './performanceEngine.js';

const PRIORITY_MULTIPLIERS = {
  Critical: 25,
  High: 15,
  Medium: 8,
  Low: 3,
};

const DIFFICULTY_MULTIPLIERS = {
  'Very Hard': 10,
  'Hard': 7,
  'Medium': 4,
  'Easy': 1,
};

const STATUS_MULTIPLIERS = {
  'Not Started': 10,
  'In Progress': 12,
  'Learning': 12,
  'Incomplete': 15,
  'Needs Revision': 15,
  'On Hold': 0,
  'Completed': 0,
  'Mastered': 0,
};

/**
 * Calculates a dynamic priority score for a topic/revision task.
 * 
 * @param {Object} item The topic or revision item
 * @param {Object} context Context data containing mocks, prepAreas, subjects, sessions, today date string
 * @returns {number} The calculated priority score
 */
export function calculatePriorityScore(item, context) {
  const { mocks, prepAreas, subjects, sessions, today } = context;
  let score = 0;

  // 1. Base Priority / Importance (User defined)
  const importanceKey = item.importance || item.priority || 'Medium';
  if (PRIORITY_MULTIPLIERS[importanceKey]) {
    score += PRIORITY_MULTIPLIERS[importanceKey];
  } else {
    score += PRIORITY_MULTIPLIERS.Medium;
  }

  // Difficulty adjustment
  if (item.difficulty && DIFFICULTY_MULTIPLIERS[item.difficulty]) {
    score += DIFFICULTY_MULTIPLIERS[item.difficulty];
  }

  // 2. Status
  if (item.status && STATUS_MULTIPLIERS[item.status] !== undefined) {
    score += STATUS_MULTIPLIERS[item.status];
  }

  // 3. Revision Urgency & Phase 5 Integration
  if (item.type === 'revision' || item.dueDate) {
    if (item.priorityData) {
      // Phase 5 intelligent revision score
      score += item.priorityData.score;
      if (item.priorityData.isCritical) {
        score += 30; // Massive boost for critical revisions
      }
    } else {
      // Fallback
      const daysDiff = differenceInDays(parseISO(today), parseISO(item.dueDate));
      if (daysDiff > 0) {
        score += 60 + Math.min(daysDiff * 2, 20); // Overdue (max 80)
      } else if (daysDiff === 0) {
        score += 50; // Due today
      } else if (daysDiff >= -3) {
        score += 20; // Due soon (next 3 days)
      }
    }
  }

  // 4. Preparation Area Weights
  // Higher weight for top-ranked prep area
  let areaId = item.preparationAreaId;
  if (!areaId && item.subjectId) {
    const subject = subjects.find(s => s.id === item.subjectId);
    areaId = subject?.preparationAreaId;
  }
  
  if (areaId) {
    const area = prepAreas.find(a => a.id === areaId);
    if (area) {
      // Treat rank/weight. If weight isn't explicitly set, default based on ID order for now.
      const weight = area.weight !== undefined ? area.weight : (10 - area.id);
      score += weight * 2; 
    }
  }

  // 5. Mock Weakness & Error Analysis (Phase 4 Integration)
  if (item.subjectId && context.errorLogs && context.mocks) {
    // If we have an exact topic, we get a granular score
    if (item.id) {
      score += getPerformancePriorityScore(item, context);
    } else {
      // Fallback: If it's just a subject-level check (e.g. revision without topic mapping), use legacy subject check
      const subjectMocks = context.mocks
        .filter(m => m.subjectResults && m.subjectResults.some(sr => sr.subjectId === item.subjectId))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);
        
      if (subjectMocks.length > 0) {
        let totalAcc = 0;
        subjectMocks.forEach(m => {
          const sr = m.subjectResults.find(r => r.subjectId === item.subjectId);
          if (sr && sr.attempted > 0) {
            totalAcc += (sr.correct / sr.attempted) * 100;
          }
        });
        const avgAcc = totalAcc / subjectMocks.length;
        
        if (avgAcc < 50) score += 40;
        else if (avgAcc < 65) score += 25;
        else if (avgAcc < 75) score += 15;
        else if (avgAcc > 85) score -= 10;
      }
    }
  }

  // 6. Recency Penalty (Balance subjects)
  // If we studied this subject heavily in the last 3 days, subtract points
  if (item.subjectId) {
    const recentSessions = sessions.filter(s => {
      if (!s.startTime) return false;
      const daysAgo = differenceInDays(parseISO(today), parseISO(s.startTime.slice(0, 10)));
      return daysAgo >= 0 && daysAgo <= 3 && s.subjectId === item.subjectId;
    });
    
    if (recentSessions.length > 0) {
      const recentHours = recentSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60;
      if (recentHours > 3) {
        score -= 20; // Heavy penalty if studied > 3 hours recently
      } else if (recentHours > 1.5) {
        score -= 10;
      }
    }
  }

  return Math.round(score);
}

/**
 * Analyzes what type of study session is best for a given topic.
 */
export function determineSessionType(topic, context) {
  if (topic.status === 'Not Started') return 'Learning';
  if (topic.status === 'Needs Revision') return 'Revision';
  
  // If mock weakness is high, recommend Error Analysis or Practice
  const mockScore = calculatePriorityScore(topic, context); // We can infer weakness if base score is artificially high
  if (mockScore > 80 && topic.status === 'Learning') {
    return 'Practice';
  }
  return 'Learning';
}
