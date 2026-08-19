// src/services/spacedRepetitionEngine.js

/**
 * Calculates the next revision interval based on Phase 5 requirements.
 * 
 * @param {number} currentInterval - The current interval in days.
 * @param {number} memoryRating - 1 to 5 memory rating (1 = Forgot, 5 = Mastered).
 * @param {string} topicDifficulty - 'Easy', 'Medium', 'Hard', 'Very Hard'.
 * @param {object} mockPerformance - { accuracy: number, hasRepeatedErrors: boolean, isWeak: boolean }
 * @returns {number} nextIntervalDays
 */
export function calculateNextInterval(currentInterval, memoryRating, topicDifficulty, mockPerformance = null) {
  let nextInterval = currentInterval;

  // 1. Base Multiplier from Memory Rating
  // Rating 1: Strongly shorten
  // Rating 2: Shorten
  // Rating 3: Maintain / slight increase
  // Rating 4: Increase
  // Rating 5: Mastered - significantly increase
  const ratingMultipliers = {
    1: 0.25,
    2: 0.5,
    3: 1.2,
    4: 2.0,
    5: 3.0
  };

  const baseMultiplier = ratingMultipliers[memoryRating] || 1.0;
  nextInterval = currentInterval * baseMultiplier;

  // 2. Adjust for Topic Difficulty
  // Harder topics need more frequent revisions initially
  const difficultyMultipliers = {
    'Easy': 1.2,
    'Medium': 1.0,
    'Hard': 0.8,
    'Very Hard': 0.6
  };
  
  const diffMult = difficultyMultipliers[topicDifficulty] || 1.0;
  nextInterval = nextInterval * diffMult;

  // 3. Adjust for Mock Performance (Phase 4 Integration)
  if (mockPerformance) {
    // If repeated errors override - dramatically shorten interval
    if (mockPerformance.hasRepeatedErrors) {
      nextInterval = Math.min(nextInterval * 0.4, 3); // Max 3 days if repeatedly failing
    } 
    // If critical/weak topic
    else if (mockPerformance.isWeak) {
      nextInterval = Math.min(nextInterval * 0.6, 5);
    }
    // Strong topic interval expansion
    else if (mockPerformance.accuracy >= 90 && memoryRating >= 4) {
      nextInterval = nextInterval * 1.5;
    }
  }

  // Bounds checking
  nextInterval = Math.max(1, Math.round(nextInterval)); // Minimum 1 day
  nextInterval = Math.min(nextInterval, 180); // Maximum 180 days (6 months)

  return nextInterval;
}
