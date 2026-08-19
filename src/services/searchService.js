// src/services/searchService.js
import { getAllTopics, getAllCourses, getAllSubjects, getAllVocab } from './db.js';
import { getAllGitaShlokas } from './gitaService.js';

/**
 * Performs a global search across Topics, Courses, Subjects, Vocabulary, and Gita Shlokas.
 * @param {string} query The search query
 * @returns {Promise<{topics: Array, courses: Array, subjects: Array, vocabulary: Array, shlokas: Array}>}
 */
export async function searchGlobal(query) {
  if (!query || !query.trim()) {
    return { topics: [], courses: [], subjects: [], vocabulary: [], shlokas: [] };
  }

  const q = query.trim().toLowerCase();

  const [topics, courses, subjects, vocab, shlokas] = await Promise.all([
    getAllTopics(),
    getAllCourses(),
    getAllSubjects(),
    getAllVocab(),
    getAllGitaShlokas(),
  ]);

  const matchedTopics = topics.filter(
    (t) => (t.name || '').toLowerCase().includes(q) || (t.notes || '').toLowerCase().includes(q)
  );

  const matchedCourses = courses.filter(
    (c) => (c.name || '').toLowerCase().includes(q) || (c.provider || '').toLowerCase().includes(q)
  );

  const matchedSubjects = subjects.filter(
    (s) => (s.name || '').toLowerCase().includes(q)
  );

  const matchedVocab = vocab.filter(
    (v) =>
      (v.word || '').toLowerCase().includes(q) ||
      (v.meaning || '').toLowerCase().includes(q) ||
      (v.bengaliMeaning || '').toLowerCase().includes(q)
  );

  const matchedShlokas = shlokas.filter(
    (s) =>
      (s.sanskritText || '').toLowerCase().includes(q) ||
      (s.transliteration || '').toLowerCase().includes(q) ||
      (s.meaning || '').toLowerCase().includes(q) ||
      (s.personalReflection || '').toLowerCase().includes(q) ||
      (s.chapter || '').toLowerCase().includes(q) ||
      (s.verse || '').toLowerCase().includes(q)
  );

  return {
    topics: matchedTopics,
    courses: matchedCourses,
    subjects: matchedSubjects,
    vocabulary: matchedVocab,
    shlokas: matchedShlokas,
  };
}
