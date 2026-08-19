// src/services/mockAnalysisEngine.js
import { calculateAccuracy } from './analyticsService.js';
import { format, differenceInDays } from 'date-fns';

/**
 * Calculates a score with a configurable marking scheme.
 * @param {number} correct Number of correct answers
 * @param {number} wrong Number of wrong answers
 * @param {number} positiveMarks Marks awarded per correct answer
 * @param {number} negativeMarks Marks deducted per wrong answer (absolute value)
 * @returns {number} The calculated score, floored at 0 (or allowed to be negative if preferred, but usually floored)
 */
export function calculateMockScore(correct, wrong, positiveMarks = 1, negativeMarks = 0.25) {
  const score = (correct * positiveMarks) - (wrong * negativeMarks);
  return Math.max(0, Number(score.toFixed(2))); // Most exams floor at 0, or at least we keep 2 decimals
}

/**
 * Calculates detailed metrics for a single mock test based on its subject results.
 * @param {Object} mock The mock object
 * @param {Array} mockSubjectResults The subject results associated with this mock
 * @returns {Object} Aggregated metrics
 */
export function calculateMockMetrics(mock, mockSubjectResults) {
  let totalAttempted = 0;
  let totalCorrect = 0;
  let totalWrong = 0;
  let totalUnattempted = 0;
  let totalTime = 0;

  mockSubjectResults.forEach(r => {
    totalAttempted += (r.attempted || 0);
    totalCorrect += (r.correct || 0);
    totalWrong += (r.wrong || 0);
    totalUnattempted += (r.unattempted || 0);
    if (r.timeTaken) totalTime += r.timeTaken;
  });

  const totalQuestions = totalAttempted + totalUnattempted;
  const positiveMarks = mock.positiveMarks ?? 1;
  const negativeMarks = mock.negativeMarks ?? 0.25;

  const score = calculateMockScore(totalCorrect, totalWrong, positiveMarks, negativeMarks);
  const maxScore = totalQuestions * positiveMarks;
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  const accuracy = calculateAccuracy(totalCorrect, totalAttempted);

  return {
    totalQuestions,
    totalAttempted,
    totalCorrect,
    totalWrong,
    totalUnattempted,
    totalTime,
    score,
    maxScore,
    percentage: Number(percentage.toFixed(1)),
    accuracy,
  };
}

/**
 * Compares the latest mock against the average of all previous mocks for the same exam.
 * @param {Object} latestMock The most recent mock
 * @param {Array} previousMocks Array of older mocks
 * @returns {Object} Comparison metrics (difference in score, accuracy, attempt rate)
 */
export function compareMocks(latestMock, previousMocks) {
  if (!previousMocks || previousMocks.length === 0) return null;

  let sumScore = 0;
  let sumAcc = 0;
  let sumAttemptRate = 0;

  previousMocks.forEach(m => {
    const pScore = m.maxScore ? (m.score / m.maxScore) * 100 : 0;
    const pAcc = calculateAccuracy(m.correct, m.attempted);
    const pAttemptRate = (m.attempted + (m.unattempted||0)) > 0 
      ? (m.attempted / (m.attempted + (m.unattempted||0))) * 100 : 0;

    sumScore += pScore;
    sumAcc += pAcc;
    sumAttemptRate += pAttemptRate;
  });

  const avgScore = sumScore / previousMocks.length;
  const avgAcc = sumAcc / previousMocks.length;
  const avgAttemptRate = sumAttemptRate / previousMocks.length;

  const latestScore = latestMock.maxScore ? (latestMock.score / latestMock.maxScore) * 100 : 0;
  const latestAcc = calculateAccuracy(latestMock.correct, latestMock.attempted);
  const latestAttemptRate = (latestMock.attempted + (latestMock.unattempted||0)) > 0 
    ? (latestMock.attempted / (latestMock.attempted + (latestMock.unattempted||0))) * 100 : 0;

  return {
    scoreDiff: Number((latestScore - avgScore).toFixed(1)),
    accuracyDiff: Number((latestAcc - avgAcc).toFixed(1)),
    attemptRateDiff: Number((latestAttemptRate - avgAttemptRate).toFixed(1)),
    previousAvgScore: Number(avgScore.toFixed(1)),
    previousAvgAccuracy: Number(avgAcc.toFixed(1))
  };
}

/**
 * Calculates trend data for a specific subject across multiple mocks.
 */
export function calculateSubjectTrend(subjectId, mockSubjectResults, mocks) {
  // Filter results for this subject
  const results = mockSubjectResults.filter(r => r.subjectId === subjectId);
  if (results.length < 2) return { trend: 'Stable', diff: 0, latestAcc: 0, previousAvg: 0 };

  // Sort by mock date
  const sorted = results.map(r => {
    const mock = mocks.find(m => m.id === r.mockTestId);
    return { ...r, date: mock?.date || '1970-01-01' };
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const latest = sorted[sorted.length - 1];
  const previous = sorted.slice(0, sorted.length - 1);

  const latestAcc = calculateAccuracy(latest.correct, latest.attempted);
  const previousAvgAcc = previous.reduce((sum, p) => sum + calculateAccuracy(p.correct, p.attempted), 0) / previous.length;

  const diff = latestAcc - previousAvgAcc;
  let trend = 'Stable';
  if (diff >= 5) trend = 'Improving';
  else if (diff <= -5) trend = 'Declining';

  return {
    trend,
    diff: Number(diff.toFixed(1)),
    latestAcc,
    previousAvg: Number(previousAvgAcc.toFixed(1))
  };
}
