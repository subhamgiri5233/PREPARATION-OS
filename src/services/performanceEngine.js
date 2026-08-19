// src/services/performanceEngine.js
import { analyzeTopicErrors } from './errorAnalysisEngine.js';

/**
 * Classifies a topic's performance based on its error history.
 * @param {number} topicId 
 * @param {Array} errorLogs All error logs
 * @param {number} totalMocksTaken Total mocks taken by the user for this exam area
 */
export function classifyTopicPerformance(topicId, errorLogs, totalMocksTaken) {
  const analysis = analyzeTopicErrors(topicId, errorLogs);
  
  let label = 'Unknown';
  let color = '#9ca3af';
  let icon = '⚪';
  
  // If the user has taken 0 mocks, we can't classify
  if (totalMocksTaken === 0 || analysis.errorCount === 0) {
    return { label, color, icon, analysis, confidence: 'Low' };
  }

  // Determine confidence based on mocks with errors + total mocks
  let confidence = 'Low';
  if (totalMocksTaken >= 4) confidence = 'High';
  else if (totalMocksTaken >= 2) confidence = 'Medium';

  // Classification Logic (Heuristics based on error count vs total mocks)
  // In a perfect system with question-level accuracy (correct vs wrong logged), we'd use pure %.
  // Since we are mostly tracking errors: if a topic appears wrong in >50% of mocks, it's Critical.
  const errorFrequency = analysis.mocksWithErrors / totalMocksTaken;

  if (errorFrequency >= 0.5) {
    label = 'Critical'; color = '#ef4444'; icon = '🔴'; // >50% error rate
  } else if (errorFrequency >= 0.35) {
    label = 'Weak'; color = '#f97316'; icon = '🟠'; 
  } else if (errorFrequency >= 0.2) {
    label = 'Needs Improvement'; color = '#f59e0b'; icon = '🟡';
  } else if (errorFrequency > 0) {
    label = 'Good'; color = '#22c55e'; icon = '🟢';
  } else {
    label = 'Strong'; color = '#3b82f6'; icon = '🔵'; // 0 errors across mocks
  }

  return { label, color, icon, analysis, confidence, errorFrequency };
}

/**
 * The bridge to the Phase 3 Priority Engine.
 * Calculates an additional priority score bonus for a topic based on its granular mock performance.
 * @param {Object} topic The topic object
 * @param {Object} context Context containing errorLogs and totalMocks
 */
export function getPerformancePriorityScore(topic, context) {
  const { errorLogs, mocks } = context;
  
  if (!errorLogs || !mocks) return 0;
  
  const relevantMocks = mocks.filter(m => m.preparationAreaId === topic.preparationAreaId);
  if (relevantMocks.length === 0) return 0;

  const performance = classifyTopicPerformance(topic.id, errorLogs, relevantMocks.length);
  
  let bonus = 0;
  
  if (performance.label === 'Critical') bonus += 50;
  else if (performance.label === 'Weak') bonus += 35;
  else if (performance.label === 'Needs Improvement') bonus += 15;
  
  // Extra penalty if it's a repeated error across multiple mocks
  if (performance.analysis.isRepeatedError) {
    bonus += 20;
  }
  
  return bonus;
}
