// src/services/db.js
// MongoDB Atlas API client — replaces Dexie/IndexedDB
// All functions maintain the same signatures for seamless UI integration.

import { apiFetch } from './api.js';

// ─── Database Initialization ──────────────────────────────────────────────────
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
  const res = await apiFetch('/areas', { method: 'POST', body: area });
  return res?.id || res?._id || res;
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
  const res = await apiFetch('/courses', { method: 'POST', body: course });
  return res?.id || res?._id || res;
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
  const res = await apiFetch('/chapters', { method: 'POST', body: chapter });
  return res?.id || res?._id || res;
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
  const res = await apiFetch('/resources', { method: 'POST', body: resource });
  return res?.id || res?._id || res;
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
  const res = await apiFetch('/subjects', { method: 'POST', body: subject });
  return res?.id || res?._id || res;
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
  const res = await apiFetch('/topics', { method: 'POST', body: topic });
  return res?.id || res?._id || res;
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
  const res = await apiFetch('/tasks', { method: 'POST', body: task });
  return res?.id || res?._id || res;
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
  const res = await apiFetch('/sessions', { method: 'POST', body: session });
  return res?.id || res?._id || res;
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
export async function getAllRevisions() {
  return await apiFetch('/revisions');
}
export async function addRevisionTask(task) {
  const res = await apiFetch('/revisions', { method: 'POST', body: task });
  return res?.id || res?._id || res;
}
export async function updateRevisionTask(id, updates) {
  return await apiFetch(`/revisions/${id}`, { method: 'PUT', body: updates });
}
export async function deleteRevisionTask(id) {
  return await apiFetch(`/revisions/${id}`, { method: 'DELETE' });
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
  const res = await apiFetch('/mocks', { method: 'POST', body: mock });
  return res?.id || res?._id || res;
}
export async function updateMock(id, updates) {
  return await apiFetch(`/mocks/${id}`, { method: 'PUT', body: updates });
}
export async function deleteMock(id) {
  return await apiFetch(`/mocks/${id}`, { method: 'DELETE' });
}

// ─── Mock Subject Results ─────────────────────────────────────────────────────
export async function getMockSubjectResults(mockId) {
  return await apiFetch(`/mocks/${mockId}/results`);
}
export async function addMockSubjectResult(result) {
  const res = await apiFetch('/mocks/results', { method: 'POST', body: result });
  return res?.id || res?._id || res;
}
export async function bulkAddMockSubjectResults(results) {
  return await apiFetch('/mocks/results/bulk', { method: 'POST', body: results });
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────
export async function getAllVocab() {
  return await apiFetch('/vocabulary');
}
export async function getVocabByDate(date) {
  return await apiFetch(`/vocabulary?learnedDate=${date}`);
}
export async function getReviewVocab() {
  return await apiFetch('/vocabulary?status=Review');
}
export async function addVocab(word) {
  const res = await apiFetch('/vocabulary', { method: 'POST', body: word });
  return res?.id || res?._id || res;
}
export async function updateVocab(id, updates) {
  return await apiFetch(`/vocabulary/${id}`, { method: 'PUT', body: updates });
}
export async function deleteVocab(id) {
  return await apiFetch(`/vocabulary/${id}`, { method: 'DELETE' });
}
export async function bulkAddVocab(words) {
  return await apiFetch('/vocabulary/bulk', { method: 'POST', body: words });
}

// ─── Teaching Schedule ───────────────────────────────────────────────────────
export async function getTeachingSchedule() {
  return await apiFetch('/schedule');
}
export async function addScheduleSlot(slot) {
  const res = await apiFetch('/schedule', { method: 'POST', body: slot });
  return res?.id || res?._id || res;
}
export async function updateScheduleSlot(id, updates) {
  return await apiFetch(`/schedule/${id}`, { method: 'PUT', body: updates });
}
export async function deleteScheduleSlot(id) {
  return await apiFetch(`/schedule/${id}`, { method: 'DELETE' });
}

// ─── Notifications ───────────────────────────────────────────────────────────
export async function getAllNotifications() {
  return await apiFetch('/notifications');
}
export async function getUnreadNotifications() {
  return await apiFetch('/notifications?unread=true');
}
export async function addNotification(notif) {
  const res = await apiFetch('/notifications', { method: 'POST', body: notif });
  return res?.id || res?._id || res;
}
export async function updateNotification(id, updates) {
  return await apiFetch(`/notifications/${id}`, { method: 'PUT', body: updates });
}
export async function deleteNotification(id) {
  return await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
}
export async function markNotificationRead(id) {
  return await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
}
export async function markAllNotificationsRead() {
  return await apiFetch('/notifications/read-all', { method: 'PUT' });
}
export async function clearAllNotifications() {
  return await apiFetch('/notifications', { method: 'DELETE' });
}

// ─── Daily Progress ───────────────────────────────────────────────────────────
export async function getDailyProgress(date) {
  return await apiFetch(`/progress?date=${date}`);
}
export async function getProgressRange(startDate, endDate) {
  return await apiFetch(`/progress?startDate=${startDate}&endDate=${endDate}`);
}
export async function saveDailyProgress(progress) {
  return await apiFetch('/progress', { method: 'POST', body: progress });
}

// ─── Error Logs ───────────────────────────────────────────────────────────────
export async function getErrorLogs(mockId) {
  try {
    const url = mockId ? `/error-log?mockTestId=${mockId}` : '/error-log';
    return await apiFetch(url);
  } catch (err) {
    console.warn('[db] getErrorLogs fallback:', err);
    try {
      return await apiFetch(mockId ? `/mocks/${mockId}/errors` : '/mocks/errors/all');
    } catch (_) {
      return [];
    }
  }
}
export async function addErrorLog(error) {
  const res = await apiFetch('/error-log', { method: 'POST', body: error });
  return res?.id || res?._id || res;
}
export async function updateErrorLog(id, updates) {
  return await apiFetch(`/error-log/${id}`, { method: 'PUT', body: updates });
}
export async function deleteErrorLog(id) {
  return await apiFetch(`/error-log/${id}`, { method: 'DELETE' });
}

// ─── Gita Shlokas ─────────────────────────────────────────────────────────────
export async function getAllGitaShlokas() {
  return await apiFetch('/gita-shlokas');
}
export async function getTodayGitaShloka() {
  return await apiFetch('/gita-shlokas/today');
}
export async function addGitaShloka(shloka) {
  const res = await apiFetch('/gita-shlokas', { method: 'POST', body: shloka });
  return res?.id || res?._id || res;
}
export async function updateGitaShloka(id, updates) {
  return await apiFetch(`/gita-shlokas/${id}`, { method: 'PUT', body: updates });
}
export async function deleteGitaShloka(id) {
  return await apiFetch(`/gita-shlokas/${id}`, { method: 'DELETE' });
}
export async function getGitaShlokaById(id) {
  return await apiFetch(`/gita-shlokas/${id}`);
}

export async function toggleGitaFavorite(id, currentStatus) {
  return await updateGitaShloka(id, { favorite: !currentStatus });
}

export async function getAllMockSubjectResults() {
  return await apiFetch('/mocks/results');
}

// ─── Legacy & Compatibility Aliases ──────────────────────────────────────────
export const getErrorLogsByMock = getErrorLogs;
export const addMockSubjectResults = bulkAddMockSubjectResults;
export const addVocabWord = addVocab;
export const updateVocabWord = updateVocab;
export const deleteVocabWord = deleteVocab;
export const addRevision = addRevisionTask;
export const updateRevision = updateRevisionTask;
export const deleteRevision = deleteRevisionTask;
export const getRevisionsByDate = getRevisionByDate;
export const addTeachingSlot = addScheduleSlot;
export const updateTeachingSlot = updateScheduleSlot;
export const deleteTeachingSlot = deleteScheduleSlot;


