// src/services/recommendationService.js
// Smart study recommendation engine
// Architecture ready for AI integration later

import { format, differenceInDays, parseISO } from 'date-fns';

const WEIGHTS = {
  revisionDue: 40,
  weakSubject: 30,
  deadline: 20,
  pendingWork: 10,
};

export function scoreRevisionItem(revision, today) {
  const daysOverdue = differenceInDays(
    parseISO(today),
    parseISO(revision.dueDate)
  );
  return WEIGHTS.revisionDue + Math.min(daysOverdue * 5, 30);
}

export function scoreTopic(topic, subjectAnalysis, today) {
  let score = 0;
  const subject = subjectAnalysis?.find((s) => s.id === topic.subjectId);

  // Penalty for weak subjects
  if (subject?.performance?.label === 'Weak') score += WEIGHTS.weakSubject;
  else if (subject?.performance?.label === 'Needs Improvement') score += WEIGHTS.weakSubject * 0.5;

  // Priority weight
  if (topic.priority === 'High') score += 15;
  else if (topic.priority === 'Medium') score += 8;

  // Pending / not started
  if (topic.status === 'Not Started') score += WEIGHTS.pendingWork;
  else if (topic.status === 'Learning') score += WEIGHTS.pendingWork * 0.5;

  return score;
}

export function generateRecommendations({ topics, revisionsDue, subjectAnalysis, vocabToday }) {
  const recommendations = [];

  // Revision items first (highest priority)
  revisionsDue.slice(0, 3).forEach((r) => {
    recommendations.push({
      type: 'revision',
      title: r.topicName || 'Revision',
      reason: `Revision #${r.revisionNumber} is due today`,
      priority: 'High',
      icon: '🔄',
    });
  });

  // Topic recommendations
  const pendingTopics = topics
    .filter((t) => t.status !== 'Completed' && t.status !== 'Mastered')
    .map((t) => ({ ...t, score: scoreTopic(t, subjectAnalysis) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  pendingTopics.forEach((topic) => {
    const subject = subjectAnalysis?.find((s) => s.id === topic.subjectId);
    const isWeak = subject?.performance?.label === 'Weak';
    recommendations.push({
      type: 'topic',
      title: topic.name,
      subjectName: subject?.name,
      reason: isWeak
        ? `Weak area — needs attention`
        : topic.priority === 'High'
        ? 'High priority topic'
        : 'Pending topic',
      priority: topic.priority,
      icon: isWeak ? '🔴' : topic.priority === 'High' ? '⭐' : '📚',
    });
  });

  // Vocabulary
  if (vocabToday < 10) {
    recommendations.push({
      type: 'vocabulary',
      title: 'Daily Vocabulary',
      reason: `${vocabToday}/10 words done today`,
      priority: 'Medium',
      icon: '📖',
    });
  }

  return recommendations.slice(0, 8);
}

// ─── AI API Stub (future integration point) ───────────────────────────────────
// Replace these stubs with actual AI API calls later
export const aiApi = {
  analyzeMocks: async (mocks) => {
    // Future: POST /api/ai/analyze-mocks
    console.log('[AI Stub] analyzeMocks called', mocks);
    return null;
  },
  suggestTomorrow: async (data) => {
    // Future: POST /api/ai/suggest-tomorrow
    console.log('[AI Stub] suggestTomorrow called', data);
    return null;
  },
  createRevisionPlan: async (days, data) => {
    // Future: POST /api/ai/revision-plan
    console.log('[AI Stub] createRevisionPlan called', { days, data });
    return null;
  },
};
