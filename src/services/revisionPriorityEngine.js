// src/services/revisionPriorityEngine.js
import { differenceInDays, parseISO } from 'date-fns';

/**
 * Calculates a comprehensive priority score for a revision task.
 * 
 * @param {object} revision - The revision task object.
 * @param {object} topic - The topic associated with the revision.
 * @param {object} mockPerformance - { accuracy: number, hasRepeatedErrors: boolean, isWeak: boolean }
 * @returns {object} { score: number, status: string, reason: string }
 */
export function calculateRevisionPriorityScore(revision, topic, mockPerformance = null) {
  let score = 0;
  let reason = 'Standard scheduled revision';
  let status = '🟡 Stable';

  const today = new Date();
  const dueDate = parseISO(revision.dueDate);
  const daysOverdue = differenceInDays(today, dueDate);

  // 1. Urgency (Days Overdue)
  if (daysOverdue > 0) {
    score += Math.min(daysOverdue * 10, 40); // Cap at 40 points for overdue
    reason = `${daysOverdue} days overdue`;
    status = '🟠 Needs Review';
  } else if (daysOverdue === 0) {
    score += 20; // Due today
    reason = 'Due today';
  }

  // 2. Weakness (Mock Accuracy & Phase 4 Performance)
  if (mockPerformance) {
    if (mockPerformance.isWeak) {
      score += 30;
      reason = 'Weak performance in recent mocks';
      status = '🔴 Weak';
    }
    
    // 3. Repeated Errors Override
    if (mockPerformance.hasRepeatedErrors) {
      score += 40;
      reason = 'Repeated errors in multiple mocks';
      status = '🔴 Critical';
    }

    if (mockPerformance.accuracy >= 90) {
      status = '🟢 Strong';
      if (daysOverdue <= 0) {
        reason = 'Consistently strong performance';
      }
    }
  }

  // 4. Topic Difficulty
  const difficultyScore = {
    'Easy': 0,
    'Medium': 5,
    'Hard': 10,
    'Very Hard': 15
  };
  score += (difficultyScore[topic?.difficulty || 'Medium'] || 0);

  // 5. Importance / Priority of Topic
  const priorityScore = {
    'Low': 0,
    'Medium': 5,
    'High': 10
  };
  score += (priorityScore[topic?.priority || 'Medium'] || 0);

  // Fallback for strong topics that are very overdue
  if (daysOverdue > 7 && status === '🟢 Strong') {
    status = '🟠 Needs Review';
  }

  return {
    score,
    status,
    reason,
    isCritical: status === '🔴 Critical' || score > 80
  };
}
