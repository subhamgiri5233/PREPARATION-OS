// src/services/db.js
// MongoDB Atlas API client — replaces Dexie/IndexedDB
// All functions have the same signatures as before so no other files need changing.

import { apiFetch } from './api.js';

// ─── Database Initialization ──────────────────────────────────────────────────
// Seeding is handled server-side; this just checks connectivity
export async function initializeDatabase() {
  try {
    await apiFetch('/health');
    console.log('[DB] Connected to MongoDB API server');
  } catch (err) {
    console.error('[DB] API server not reachable:', err.message);
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSettings() {
  return await apiFetch('/settings');
}
export async function updateSettings(updates) {
  return await apiFetch('/settings', { method: 'PUT', body: updates });
}

// ─── Preparation Areas ────────────────────────────────────────────────────────
export async function getAllAreas() {
  return await apiFetch('/areas');
}
export async function addArea(area) {
  return await apiFetch('/areas', { method: 'POST', body: area });
}
export async function updateArea(id, updates) {
  return await apiFetch(`/areas/${id}`, { method: 'PUT', body: updates });
}
export async function deleteArea(id) {
  return await apiFetch(`/areas/${id}`, { method: 'DELETE' });
}

// ─── Courses ──────────────────────────────────────────────────────────────────
export async function getAllCourses() {
  return await apiFetch('/courses');
}
export async function getCoursesByArea(preparationAreaId) {
  return await apiFetch(`/courses?preparationAreaId=${preparationAreaId}`);
}
export async function addCourse(course) {
  return await apiFetch('/courses', { method: 'POST', body: course });
}
export async function updateCourse(id, updates) {
  return await apiFetch(`/courses/${id}`, { method: 'PUT', body: updates });
}
export async function deleteCourse(id) {
  return await apiFetch(`/courses/${id}`, { method: 'DELETE' });
}
export async function bulkAddCourses(courses) {
  return await apiFetch('/courses/bulk', { method: 'POST', body: courses });
}

// ─── Chapters / Modules ───────────────────────────────────────────────────────
export async function getAllChapters() {
  return await apiFetch('/chapters');
}
export async function getChaptersBySubject(subjectId) {
  return await apiFetch(`/chapters?subjectId=${subjectId}`);
}
export async function getChaptersByCourse(courseId) {
  return await apiFetch(`/chapters?courseId=${courseId}`);
}
export async function getChaptersByArea(preparationAreaId) {
  return await apiFetch(`/chapters?preparationAreaId=${preparationAreaId}`);
}
export async function addChapter(chapter) {
  return await apiFetch('/chapters', { method: 'POST', body: chapter });
}
export async function updateChapter(id, updates) {
  return await apiFetch(`/chapters/${id}`, { method: 'PUT', body: updates });
}
export async function deleteChapter(id) {
  return await apiFetch(`/chapters/${id}`, { method: 'DELETE' });
}
export async function bulkAddChapters(chapters) {
  return await apiFetch('/chapters/bulk', { method: 'POST', body: chapters });
}

// ─── Study Resources ──────────────────────────────────────────────────────────
export async function getAllStudyResources() {
  return await apiFetch('/resources');
}
export async function getResourcesByTopic(topicId) {
  return await apiFetch(`/resources?topicId=${topicId}`);
}
export async function addStudyResource(resource) {
  return await apiFetch('/resources', { method: 'POST', body: resource });
}
export async function updateStudyResource(id, updates) {
  return await apiFetch(`/resources/${id}`, { method: 'PUT', body: updates });
}
export async function deleteStudyResource(id) {
  return await apiFetch(`/resources/${id}`, { method: 'DELETE' });
}
export async function bulkAddStudyResources(resources) {
  return await apiFetch('/resources/bulk', { method: 'POST', body: resources });
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
export async function getSubjectsByArea(preparationAreaId) {
  return await apiFetch(`/subjects?preparationAreaId=${preparationAreaId}`);
}
export async function getSubjectsByCourse(courseId) {
  return await apiFetch(`/subjects?courseId=${courseId}`);
}
export async function getAllSubjects() {
  return await apiFetch('/subjects');
}
export async function addSubject(subject) {
  return await apiFetch('/subjects', { method: 'POST', body: subject });
}
export async function updateSubject(id, updates) {
  return await apiFetch(`/subjects/${id}`, { method: 'PUT', body: updates });
}
export async function deleteSubject(id) {
  return await apiFetch(`/subjects/${id}`, { method: 'DELETE' });
}
export async function bulkAddSubjects(subjects) {
  return await apiFetch('/subjects/bulk', { method: 'POST', body: subjects });
}

// ─── Topics ───────────────────────────────────────────────────────────────────
export async function getTopicsBySubject(subjectId) {
  return await apiFetch(`/topics?subjectId=${subjectId}`);
}
export async function getTopicsByChapter(chapterId) {
  return await apiFetch(`/topics?chapterId=${chapterId}`);
}
export async function getTopicsByCourse(courseId) {
  return await apiFetch(`/topics?courseId=${courseId}`);
}
export async function getTopicsByArea(preparationAreaId) {
  return await apiFetch(`/topics?preparationAreaId=${preparationAreaId}`);
}
export async function getAllTopics() {
  return await apiFetch('/topics');
}
export async function addTopic(topic) {
  return await apiFetch('/topics', { method: 'POST', body: topic });
}
export async function updateTopic(id, updates) {
  return await apiFetch(`/topics/${id}`, { method: 'PUT', body: updates });
}
export async function deleteTopic(id) {
  return await apiFetch(`/topics/${id}`, { method: 'DELETE' });
}
export async function bulkAddTopics(topics) {
  return await apiFetch('/topics/bulk', { method: 'POST', body: topics });
}

// ─── Study Tasks ──────────────────────────────────────────────────────────────
export async function getTasksByDate(date) {
  return await apiFetch(`/tasks?date=${date}`);
}
export async function getAllTasks() {
  return await apiFetch('/tasks');
}
export async function getTasksByDateRange(startDate, endDate) {
  return await apiFetch(`/tasks?startDate=${startDate}&endDate=${endDate}`);
}
export async function addTask(task) {
  return await apiFetch('/tasks', { method: 'POST', body: task });
}
export async function updateTask(id, updates) {
  return await apiFetch(`/tasks/${id}`, { method: 'PUT', body: updates });
}
export async function deleteTask(id) {
  return await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}

// ─── Study Sessions ───────────────────────────────────────────────────────────
export async function getAllSessions() {
  return await apiFetch('/sessions');
}
export async function getSessionsByDateRange(startDate, endDate) {
  return await apiFetch(`/sessions?startDate=${startDate}&endDate=${endDate}`);
}
export async function getSessionsByDate(date) {
  return await apiFetch(`/sessions?date=${date}`);
}
export async function addSession(session) {
  return await apiFetch('/sessions', { method: 'POST', body: session });
}
export async function updateSession(id, updates) {
  return await apiFetch(`/sessions/${id}`, { method: 'PUT', body: updates });
}

// ─── Revision Tasks ───────────────────────────────────────────────────────────
export async function getRevisionByDate(date) {
  return await apiFetch(`/revisions?dueDate=${date}`);
}
export async function getOverdueRevisions(today) {
  return await apiFetch(`/revisions?overdueBefore=${today}`);
}
export async function getPendingRevisions() {
  return await apiFetch('/revisions?status=Pending');
}
export async function addRevisionTask(revision) {
  return await apiFetch('/revisions', { method: 'POST', body: revision });
}
export async function updateRevisionTask(id, updates) {
  return await apiFetch(`/revisions/${id}`, { method: 'PUT', body: updates });
}
export async function bulkAddRevisions(revisions) {
  return await apiFetch('/revisions/bulk', { method: 'POST', body: revisions });
}

// ─── Mock Tests ───────────────────────────────────────────────────────────────
export async function getAllMocks() {
  return await apiFetch('/mocks');
}
export async function getMocksByArea(preparationAreaId) {
  return await apiFetch(`/mocks?preparationAreaId=${preparationAreaId}`);
}
export async function addMock(mock) {
  return await apiFetch('/mocks', { method: 'POST', body: mock });
}
export async function updateMock(id, updates) {
  return await apiFetch(`/mocks/${id}`, { method: 'PUT', body: updates });
}
export async function getMockSubjectResults(mockTestId) {
  return await apiFetch(`/mocks/subject-results?mockTestId=${mockTestId}`);
}
export async function addMockSubjectResults(results) {
  return await apiFetch('/mocks/subject-results/bulk', { method: 'POST', body: results });
}
export async function getAllMockSubjectResults() {
  return await apiFetch('/mocks/subject-results');
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────
export async function getAllVocab() {
  return await apiFetch('/vocabulary');
}
export async function getVocabByDate(date) {
  return await apiFetch(`/vocabulary?date=${date}`);
}
export async function addVocabWord(word) {
  return await apiFetch('/vocabulary', { method: 'POST', body: word });
}
export async function addVocab(word) {
  return await addVocabWord(word);
}
export async function updateVocabWord(id, updates) {
  return await apiFetch(`/vocabulary/${id}`, { method: 'PUT', body: updates });
}
export async function deleteVocabWord(id) {
  return await apiFetch(`/vocabulary/${id}`, { method: 'DELETE' });
}
export async function addVocabReview(review) {
  return await apiFetch('/vocabulary/reviews', { method: 'POST', body: review });
}
export async function getVocabReviews(vocabularyId) {
  return await apiFetch(`/vocabulary/${vocabularyId}/reviews`);
}

// ─── Teaching Schedule ────────────────────────────────────────────────────────
export async function getTeachingSchedule() {
  return await apiFetch('/schedule');
}
export async function addTeachingSlot(slot) {
  return await apiFetch('/schedule', { method: 'POST', body: slot });
}
export async function updateTeachingSlot(id, updates) {
  return await apiFetch(`/schedule/${id}`, { method: 'PUT', body: updates });
}
export async function deleteTeachingSlot(id) {
  return await apiFetch(`/schedule/${id}`, { method: 'DELETE' });
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getAllNotifications() {
  return await apiFetch('/notifications');
}
export async function getUnreadNotifications() {
  return await apiFetch('/notifications/unread');
}
export async function addNotification(notif) {
  return await apiFetch('/notifications', { method: 'POST', body: notif });
}
export async function markNotificationRead(id) {
  return await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}
export async function markAllNotificationsRead() {
  return await apiFetch('/notifications/read-all', { method: 'PUT' });
}

// ─── Daily Progress ───────────────────────────────────────────────────────────
export async function getDailyProgress(date) {
  const results = await apiFetch(`/progress?date=${date}`);
  return Array.isArray(results) ? results[0] || null : results;
}
export async function upsertDailyProgress(date, updates) {
  return await apiFetch('/progress/upsert', { method: 'POST', body: { date, ...updates } });
}
export async function getDailyProgressRange(startDate, endDate) {
  return await apiFetch(`/progress?startDate=${startDate}&endDate=${endDate}`);
}

// ─── Error Log ────────────────────────────────────────────────────────────────
export async function getErrorLogs() {
  return await apiFetch('/error-log');
}
export async function getErrorLogsByMock(mockTestId) {
  return await apiFetch(`/error-log?mockTestId=${mockTestId}`);
}
export async function getErrorLogsByTopic(topicId) {
  return await apiFetch(`/error-log?topicId=${topicId}`);
}
export async function addErrorLog(errorData) {
  return await apiFetch('/error-log', { method: 'POST', body: errorData });
}
export async function updateErrorLog(id, updates) {
  return await apiFetch(`/error-log/${id}`, { method: 'PUT', body: updates });
}
export async function deleteErrorLog(id) {
  return await apiFetch(`/error-log/${id}`, { method: 'DELETE' });
}

// ─── Gita Shlokas ────────────────────────────────────────────────────────────
export async function getAllGitaShlokas() {
  return await apiFetch('/gita-shlokas');
}
export async function getTodayGitaShloka() {
  return await apiFetch('/gita-shlokas/today');
}
export async function getGitaShlokaById(id) {
  return await apiFetch(`/gita-shlokas/${id}`);
}
export async function addGitaShloka(data) {
  return await apiFetch('/gita-shlokas', { method: 'POST', body: data });
}
export async function updateGitaShloka(id, updates) {
  return await apiFetch(`/gita-shlokas/${id}`, { method: 'PUT', body: updates });
}
export async function deleteGitaShloka(id) {
  return await apiFetch(`/gita-shlokas/${id}`, { method: 'DELETE' });
}
export async function toggleGitaFavorite(id) {
  return await apiFetch(`/gita-shlokas/${id}/favorite`, { method: 'PATCH' });
}
