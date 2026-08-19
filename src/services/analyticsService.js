// src/services/analyticsService.js
// Analytics service - mock performance analysis, weak subject detection

export function calculateAccuracy(correct, attempted) {
  if (!attempted || attempted === 0) return 0;
  return Math.round((correct / attempted) * 100);
}

export function calculateScore(correct, wrong, total) {
  // Standard banking exam: +1 for correct, -0.25 for wrong
  const score = correct - wrong * 0.25;
  return Math.max(0, score);
}

export function classifySubjectPerformance(avgAccuracy) {
  if (avgAccuracy >= 70) return { label: 'Strong', color: '#22c55e', icon: '🟢' };
  if (avgAccuracy >= 45) return { label: 'Needs Improvement', color: '#f59e0b', icon: '🟡' };
  return { label: 'Weak', color: '#ef4444', icon: '🔴' };
}

export function analyzeSubjectWiseMocks(mockSubjectResults, subjects) {
  const subjectMap = {};

  mockSubjectResults.forEach((result) => {
    if (!subjectMap[result.subjectId]) {
      subjectMap[result.subjectId] = { correct: 0, wrong: 0, count: 0 };
    }
    subjectMap[result.subjectId].correct += result.correct;
    subjectMap[result.subjectId].wrong += result.wrong;
    subjectMap[result.subjectId].count += 1;
  });

  return subjects.map((subject) => {
    const data = subjectMap[subject.id] || { correct: 0, wrong: 0, count: 0 };
    const attempted = data.correct + data.wrong;
    const accuracy = calculateAccuracy(data.correct, attempted);
    const performance = classifySubjectPerformance(accuracy);
    return {
      ...subject,
      correct: data.correct,
      wrong: data.wrong,
      accuracy,
      mockCount: data.count,
      performance,
    };
  });
}

export function getScoreTrend(mocks) {
  return mocks
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((m, index) => ({
      name: `Mock ${m.mockNumber || index + 1}`,
      score: m.score,
      maxScore: m.maxScore,
      percentage: m.maxScore ? Math.round((m.score / m.maxScore) * 100) : 0,
      accuracy: calculateAccuracy(m.correct, m.attempted),
      date: m.date,
    }));
}

export function getWeakSubjects(subjectAnalysis) {
  return subjectAnalysis
    .filter((s) => s.performance.label === 'Weak' && s.mockCount >= 1)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function getStrongSubjects(subjectAnalysis) {
  return subjectAnalysis
    .filter((s) => s.performance.label === 'Strong' && s.mockCount >= 1)
    .sort((a, b) => b.accuracy - a.accuracy);
}
