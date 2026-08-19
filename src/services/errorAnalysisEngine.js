// src/services/errorAnalysisEngine.js
import { calculateAccuracy } from './analyticsService.js';
import { getErrorLogs } from './db.js';

/**
 * Analyzes the errors for a specific topic across all mocks.
 * @param {number} topicId 
 * @param {Array} errorLogs All error logs for this topic
 * @param {Array} mockSubjectResults All subject results to calculate total attempted questions for the topic
 * Note: mockSubjectResults are per subject. We don't have topic-level attempts stored directly unless we infer from topic questions.
 * Since we only log ERRORS, we might not know how many were correct exactly for a specific TOPIC unless we ask the user.
 * Wait, the prompt says "Allow each incorrect/correct question to be associated with: Prep Area -> Subject -> Topic".
 * For now, the errorLog serves as a log of mistakes. If we want total topic accuracy, we need an assumption:
 * Either the user logs ALL questions (correct and wrong) in the errorLog (with errorType = null for correct),
 * OR we assume accuracy is derived from total questions in the subject. 
 * Actually, let's treat `errorLog` as a `questionLog` if the user wants to log correct answers too, 
 * but usually it's just for errors. Let's calculate error count and repeated errors.
 */
export function analyzeTopicErrors(topicId, errorLogs) {
  const topicErrors = errorLogs.filter(e => e.topicId === topicId && e.errorType !== 'Correct');
  
  const errorCount = topicErrors.length;
  
  // Count how many distinct mocks this topic was wrong in
  const mocksWithErrors = new Set(topicErrors.map(e => e.mockTestId)).size;
  const isRepeatedError = mocksWithErrors > 1;

  // Breakdown by error type
  const typeDistribution = {};
  topicErrors.forEach(e => {
    typeDistribution[e.errorType] = (typeDistribution[e.errorType] || 0) + 1;
  });

  return {
    errorCount,
    mocksWithErrors,
    isRepeatedError,
    typeDistribution
  };
}

/**
 * Aggregates all error types across all logs to find the most common mistake reasons.
 */
export function getErrorTypeDistribution(errorLogs) {
  const distribution = {};
  let totalErrors = 0;
  
  errorLogs.forEach(e => {
    if (e.errorType && e.errorType !== 'Correct') {
      distribution[e.errorType] = (distribution[e.errorType] || 0) + 1;
      totalErrors++;
    }
  });

  return Object.entries(distribution)
    .map(([type, count]) => ({
      type,
      count,
      percentage: totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Detects topics that have repeated errors across multiple mocks.
 */
export function detectRepeatedErrors(errorLogs, topics) {
  const topicMap = {};
  
  errorLogs.forEach(e => {
    if (e.errorType === 'Correct') return;
    if (!topicMap[e.topicId]) {
      topicMap[e.topicId] = new Set();
    }
    topicMap[e.topicId].add(e.mockTestId);
  });

  const repeated = [];
  Object.keys(topicMap).forEach(topicId => {
    if (topicMap[topicId].size > 1) {
      const topic = topics.find(t => t.id === parseInt(topicId));
      if (topic) {
        repeated.push({
          topic,
          mockCount: topicMap[topicId].size
        });
      }
    }
  });

  return repeated.sort((a, b) => b.mockCount - a.mockCount);
}

/**
 * Auto-generates a "Why Did I Lose Marks?" summary for a specific mock.
 */
export function generateLossSummary(mockId, errorLogs, negativeMarks = 0.25, positiveMarks = 1) {
  const mockErrors = errorLogs.filter(e => e.mockTestId === mockId && e.errorType !== 'Correct');
  if (mockErrors.length === 0) return null;

  const distribution = {};
  mockErrors.forEach(e => {
    // If it's an Unattempted error type (if they logged it), no negative marks, just lost positive marks.
    // If it's a wrong answer, they lost positiveMarks + negativeMarks.
    let marksLost = positiveMarks + (e.errorType === 'Unattempted' ? 0 : negativeMarks);
    distribution[e.errorType] = (distribution[e.errorType] || 0) + marksLost;
  });

  return Object.entries(distribution)
    .map(([type, marks]) => ({
      type,
      marksLost: Number(marks.toFixed(2))
    }))
    .sort((a, b) => b.marksLost - a.marksLost);
}
