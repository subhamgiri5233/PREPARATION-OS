// src/services/db.js
// Dexie.js database schema and initialization

import Dexie from 'dexie';
import {
  defaultSettings,
  defaultTeachingSchedule,
  defaultPreparationAreas,
  defaultCourses,
  ibpsSubjects,
  ibpsTopics,
} from '../data/seedData.js';

export const db = new Dexie('PreparationOS');

db.version(1).stores({
  settings: '++id',
  preparationAreas: '++id, name, priority',
  subjects: '++id, preparationAreaId, name',
  topics: '++id, subjectId, preparationAreaId, status, priority',
  studyTasks: '++id, topicId, subjectId, preparationAreaId, date, status',
  studySessions: '++id, topicId, subjectId, preparationAreaId, startTime, endTime',
  revisionTasks: '++id, topicId, dueDate, status',
  mockTests: '++id, preparationAreaId, date, mockNumber',
  mockSubjectResults: '++id, mockTestId, subjectId',
  vocabulary: '++id, word, dateAdded',
  vocabularyReviews: '++id, vocabularyId, reviewDate, status',
  teachingSchedule: '++id, dayOfWeek',
  notifications: '++id, type, scheduledAt, read',
  dailyProgress: '++id, date',
  weeklyProgress: '++id, weekStart',
});

db.version(2).stores({
  errorLog: '++id, mockTestId, subjectId, topicId',
});

// Phase 4 Schema Additions (Marking schemes and expanded error log)
db.version(3).stores({
  mockTests: '++id, preparationAreaId, date, mockNumber', // Schema remains same for indexes, but fields expanded
  errorLog: '++id, mockTestId, subjectId, topicId, errorType, reviewed, revisionTaskId',
}).upgrade(tx => {
  return tx.mockTests.toCollection().modify(mock => {
    if (mock.positiveMarks === undefined) mock.positiveMarks = 1;
    if (mock.negativeMarks === undefined) mock.negativeMarks = 0;
  });
});

// Phase 5 Schema Additions (Revision Intelligence)
db.version(4).stores({
  revisionTasks: '++id, topicId, dueDate, status, revisionNumber, scheduledDate, completedDate, sourceType, sourceId, isManual',
}).upgrade(tx => {
  // Migrate existing topics to have difficulty and retentionScore
  tx.topics.toCollection().modify(topic => {
    if (!topic.difficulty) topic.difficulty = 'Medium';
    if (topic.retentionScore === undefined) topic.retentionScore = 0;
  });
  
  // Migrate existing revision tasks to have extended fields
  tx.revisionTasks.toCollection().modify(rev => {
    if (rev.confidence === undefined) rev.confidence = 0;
    if (!rev.difficulty) rev.difficulty = 'Medium';
    if (rev.intervalDays === undefined) rev.intervalDays = 1;
    if (rev.errorCount === undefined) rev.errorCount = 0;
    if (rev.repeatedErrorCount === undefined) rev.repeatedErrorCount = 0;
    if (rev.sourceType === undefined) rev.sourceType = 'Topic Completion';
    if (rev.isManual === undefined) rev.isManual = false;
  });
});

// Phase 6 Schema Additions (Real Syllabus & Course Mapping System)
db.version(5).stores({
  courses: '++id, preparationAreaId, name',
  subjects: '++id, preparationAreaId, courseId, name',
  topics: '++id, subjectId, preparationAreaId, courseId, parentTopicId, status, priority, importance',
}).upgrade(tx => {
  return tx.topics.toCollection().modify(topic => {
    if (topic.courseId === undefined) {
      topic.courseId = topic.preparationAreaId === 1 ? 1 : null;
    }
    if (!topic.importance) topic.importance = topic.priority || 'High';
    if (topic.completionPercentage === undefined) topic.completionPercentage = topic.completionPercent || 0;
    if (topic.estimatedHours === undefined) topic.estimatedHours = 2;
    if (topic.parentTopicId === undefined) topic.parentTopicId = null;
    if (topic.resourceReference === undefined) topic.resourceReference = '';
    if (topic.order === undefined) topic.order = 0;
  });
});

// Phase 7 Schema Additions (Real Course & Syllabus Data Command Center)
db.version(6).stores({
  courses: '++id, preparationAreaId, name, status',
  chapters: '++id, subjectId, preparationAreaId, courseId, name, order',
  studyResources: '++id, topicId, preparationAreaId, courseId, subjectId, resourceType, completed',
  topics: '++id, subjectId, preparationAreaId, courseId, chapterId, parentTopicId, status, priority, importance, difficulty',
}).upgrade(tx => {
  tx.courses.toCollection().modify(course => {
    if (!course.status) course.status = 'Active';
    if (course.provider === undefined) course.provider = course.platform || '';
    if (course.startDate === undefined) course.startDate = null;
    if (course.targetDate === undefined) course.targetDate = null;
    if (course.notes === undefined) course.notes = '';
  });
  return tx.topics.toCollection().modify(topic => {
    if (topic.chapterId === undefined) topic.chapterId = null;
    if (topic.estimatedMinutes === undefined) topic.estimatedMinutes = (topic.estimatedHours || 2) * 60;
    if (topic.lastStudiedDate === undefined) topic.lastStudiedDate = topic.dateStarted || null;
    if (topic.nextRevisionDate === undefined) topic.nextRevisionDate = null;
    if (topic.masteryScore === undefined) topic.masteryScore = topic.status === 'Mastered' ? 100 : topic.status === 'Completed' ? 80 : 0;
  });
});

// Phase 8 Schema Additions (Personal Gita Shloka System)
db.version(7).stores({
  gitaShlokas: '++id, date, chapter, verse, favorite',
}).upgrade(tx => {
  return tx.settings.toCollection().modify(s => {
    if (s.gitaReminderEnabled === undefined) s.gitaReminderEnabled = true;
  });
});

// Initialize database with seed data if empty
export async function initializeDatabase() {
  try {
    const settingsCount = await db.settings.count();
    if (settingsCount === 0) {
      await db.settings.add(defaultSettings);
    }

    const areasCount = await db.preparationAreas.count();
    if (areasCount === 0) {
      await db.preparationAreas.bulkAdd(defaultPreparationAreas);
    }

    const coursesCount = await db.courses.count();
    if (coursesCount === 0) {
      await db.courses.bulkAdd(defaultCourses);
    }

    const subjectsCount = await db.subjects.count();
    if (subjectsCount === 0) {
      await db.subjects.bulkAdd(ibpsSubjects);
    }

    const topicsCount = await db.topics.count();
    if (topicsCount === 0) {
      const topicsWithDefaults = ibpsTopics.map((t, idx) => ({
        ...t,
        courseId: 1, // Adda247 MahaPack
        chapterId: null,
        parentTopicId: null,
        importance: t.importance || t.priority || 'High',
        difficulty: t.difficulty || 'Medium',
        estimatedHours: t.estimatedHours || 2,
        estimatedMinutes: (t.estimatedHours || 2) * 60,
        order: idx + 1,
        completionPercent: 0,
        completionPercentage: 0,
        studyHours: 0,
        dateStarted: null,
        dateCompleted: null,
        lastStudiedDate: null,
        nextRevisionDate: null,
        masteryScore: 0,
        notes: '',
        resourceReference: '',
        createdAt: new Date().toISOString(),
      }));
      await db.topics.bulkAdd(topicsWithDefaults);
    }

    const scheduleCount = await db.teachingSchedule.count();
    if (scheduleCount === 0) {
      await db.teachingSchedule.bulkAdd(defaultTeachingSchedule);
    }

    console.log('[DB] Initialization complete');
  } catch (error) {
    console.error('[DB] Initialization error:', error);
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function getSettings() {
  // Always get the first (and only) settings record
  const all = await db.settings.toArray();
  return all[0] || defaultSettings;
}
export async function updateSettings(updates) {
  const existing = await db.settings.toArray();
  if (existing.length > 0) {
    return await db.settings.update(existing[0].id, updates);
  }
  return await db.settings.add({ ...defaultSettings, ...updates });
}

// ─── Preparation Areas ────────────────────────────────────────────────────────
export async function getAllAreas() {
  return await db.preparationAreas.orderBy('priority').toArray();
}
export async function addArea(area) {
  return await db.preparationAreas.add(area);
}
export async function updateArea(id, updates) {
  return await db.preparationAreas.update(id, updates);
}
export async function deleteArea(id) {
  return await db.preparationAreas.delete(id);
}

// ─── Courses (Phase 6 & 7) ────────────────────────────────────────────────────
export async function getAllCourses() {
  return await db.courses.toArray();
}
export async function getCoursesByArea(preparationAreaId) {
  return await db.courses.where('preparationAreaId').equals(preparationAreaId).toArray();
}
export async function addCourse(course) {
  return await db.courses.add({
    ...course,
    status: course.status || 'Active',
    provider: course.provider || course.platform || '',
    createdAt: new Date().toISOString()
  });
}
export async function updateCourse(id, updates) {
  return await db.courses.update(id, updates);
}
export async function deleteCourse(id) {
  return await db.courses.delete(id);
}
export async function bulkAddCourses(courses) {
  return await db.courses.bulkAdd(courses);
}

// ─── Chapters / Modules (Phase 7) ─────────────────────────────────────────────
export async function getAllChapters() {
  return await db.chapters.toArray();
}
export async function getChaptersBySubject(subjectId) {
  return await db.chapters.where('subjectId').equals(subjectId).toArray();
}
export async function getChaptersByCourse(courseId) {
  return await db.chapters.where('courseId').equals(courseId).toArray();
}
export async function getChaptersByArea(preparationAreaId) {
  return await db.chapters.where('preparationAreaId').equals(preparationAreaId).toArray();
}
export async function addChapter(chapter) {
  return await db.chapters.add({
    ...chapter,
    order: chapter.order || 0,
    createdAt: new Date().toISOString()
  });
}
export async function updateChapter(id, updates) {
  return await db.chapters.update(id, updates);
}
export async function deleteChapter(id) {
  return await db.chapters.delete(id);
}
export async function bulkAddChapters(chapters) {
  return await db.chapters.bulkAdd(chapters);
}

// ─── Study Resources (Phase 7) ────────────────────────────────────────────────
export async function getAllStudyResources() {
  return await db.studyResources.toArray();
}
export async function getResourcesByTopic(topicId) {
  return await db.studyResources.where('topicId').equals(topicId).toArray();
}
export async function addStudyResource(resource) {
  return await db.studyResources.add({
    ...resource,
    completed: resource.completed || false,
    watchedPercentage: resource.watchedPercentage || 0,
    createdAt: new Date().toISOString()
  });
}
export async function updateStudyResource(id, updates) {
  return await db.studyResources.update(id, updates);
}
export async function deleteStudyResource(id) {
  return await db.studyResources.delete(id);
}
export async function bulkAddStudyResources(resources) {
  return await db.studyResources.bulkAdd(resources);
}

// ─── Subjects ─────────────────────────────────────────────────────────────────
export async function getSubjectsByArea(preparationAreaId) {
  return await db.subjects.where('preparationAreaId').equals(preparationAreaId).toArray();
}
export async function getSubjectsByCourse(courseId) {
  return await db.subjects.where('courseId').equals(courseId).toArray();
}
export async function getAllSubjects() {
  return await db.subjects.toArray();
}
export async function addSubject(subject) {
  return await db.subjects.add(subject);
}
export async function updateSubject(id, updates) {
  return await db.subjects.update(id, updates);
}
export async function deleteSubject(id) {
  return await db.subjects.delete(id);
}
export async function bulkAddSubjects(subjects) {
  return await db.subjects.bulkAdd(subjects);
}

// ─── Topics ───────────────────────────────────────────────────────────────────
export async function getTopicsBySubject(subjectId) {
  return await db.topics.where('subjectId').equals(subjectId).toArray();
}
export async function getTopicsByChapter(chapterId) {
  return await db.topics.where('chapterId').equals(chapterId).toArray();
}
export async function getTopicsByCourse(courseId) {
  return await db.topics.where('courseId').equals(courseId).toArray();
}
export async function getTopicsByArea(preparationAreaId) {
  return await db.topics.where('preparationAreaId').equals(preparationAreaId).toArray();
}
export async function getAllTopics() {
  return await db.topics.toArray();
}
export async function addTopic(topic) {
  const estHours = topic.estimatedHours || (topic.estimatedMinutes ? topic.estimatedMinutes / 60 : 2);
  const estMins = topic.estimatedMinutes || estHours * 60;
  return await db.topics.add({
    ...topic,
    chapterId: topic.chapterId || null,
    importance: topic.importance || topic.priority || 'High',
    difficulty: topic.difficulty || 'Medium',
    status: topic.status || 'Not Started',
    estimatedHours: estHours,
    estimatedMinutes: estMins,
    completionPercentage: topic.completionPercentage ?? topic.completionPercent ?? 0,
    masteryScore: topic.masteryScore ?? 0,
    lastStudiedDate: topic.lastStudiedDate || null,
    nextRevisionDate: topic.nextRevisionDate || null,
    createdAt: new Date().toISOString()
  });
}
export async function updateTopic(id, updates) {
  const syncUpdates = { ...updates };
  if (updates.completionPercentage !== undefined && updates.completionPercent === undefined) {
    syncUpdates.completionPercent = updates.completionPercentage;
  } else if (updates.completionPercent !== undefined && updates.completionPercentage === undefined) {
    syncUpdates.completionPercentage = updates.completionPercent;
  }
  if (updates.estimatedHours !== undefined && updates.estimatedMinutes === undefined) {
    syncUpdates.estimatedMinutes = updates.estimatedHours * 60;
  } else if (updates.estimatedMinutes !== undefined && updates.estimatedHours === undefined) {
    syncUpdates.estimatedHours = updates.estimatedMinutes / 60;
  }
  return await db.topics.update(id, syncUpdates);
}
export async function deleteTopic(id) {
  return await db.topics.delete(id);
}
export async function bulkAddTopics(topics) {
  return await db.topics.bulkAdd(topics);
}

// ─── Study Tasks ──────────────────────────────────────────────────────────────
export async function getTasksByDate(date) {
  return await db.studyTasks.where('date').equals(date).toArray();
}
export async function getAllTasks() {
  return await db.studyTasks.orderBy('date').toArray();
}
export async function getTasksByDateRange(startDate, endDate) {
  return await db.studyTasks
    .filter((t) => t.date >= startDate && t.date <= endDate)
    .toArray();
}
export async function addTask(task) {
  return await db.studyTasks.add({ ...task, createdAt: new Date().toISOString() });
}
export async function updateTask(id, updates) {
  return await db.studyTasks.update(id, updates);
}
export async function deleteTask(id) {
  return await db.studyTasks.delete(id);
}

// ─── Study Sessions ───────────────────────────────────────────────────────────
export async function getAllSessions() {
  return await db.studySessions.orderBy('startTime').reverse().toArray();
}
export async function getSessionsByDateRange(startDate, endDate) {
  // startDate / endDate are ISO date strings: 'yyyy-MM-dd'
  return await db.studySessions
    .filter((s) => {
      if (!s.startTime) return false;
      const d = s.startTime.slice(0, 10);
      return d >= startDate && d <= endDate;
    })
    .toArray();
}
export async function getSessionsByDate(date) {
  return await db.studySessions
    .filter((s) => s.startTime && s.startTime.startsWith(date))
    .toArray();
}
export async function addSession(session) {
  return await db.studySessions.add(session);
}
export async function updateSession(id, updates) {
  return await db.studySessions.update(id, updates);
}

// ─── Revision Tasks ───────────────────────────────────────────────────────────
export async function getRevisionByDate(date) {
  return await db.revisionTasks.where('dueDate').equals(date).toArray();
}
export async function getOverdueRevisions(today) {
  return await db.revisionTasks
    .where('dueDate').below(today)
    .and((r) => r.status === 'Pending')
    .toArray();
}
export async function getPendingRevisions() {
  return await db.revisionTasks.where('status').equals('Pending').toArray();
}
export async function addRevisionTask(revision) {
  return await db.revisionTasks.add(revision);
}
export async function updateRevisionTask(id, updates) {
  return await db.revisionTasks.update(id, updates);
}
export async function bulkAddRevisions(revisions) {
  return await db.revisionTasks.bulkAdd(revisions);
}

// ─── Mock Tests ───────────────────────────────────────────────────────────────
export async function getAllMocks() {
  return await db.mockTests.orderBy('date').reverse().toArray();
}
export async function getMocksByArea(preparationAreaId) {
  const all = await db.mockTests.toArray();
  return all
    .filter((m) => m.preparationAreaId === preparationAreaId)
    .sort((a, b) => b.date?.localeCompare(a.date));
}
export async function addMock(mock) {
  return await db.mockTests.add({ ...mock, createdAt: new Date().toISOString() });
}
export async function updateMock(id, updates) {
  return await db.mockTests.update(id, updates);
}
export async function getMockSubjectResults(mockTestId) {
  return await db.mockSubjectResults.where('mockTestId').equals(mockTestId).toArray();
}
export async function addMockSubjectResults(results) {
  return await db.mockSubjectResults.bulkAdd(results);
}
export async function getAllMockSubjectResults() {
  return await db.mockSubjectResults.toArray();
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────
export async function getAllVocab() {
  return await db.vocabulary.orderBy('dateAdded').reverse().toArray();
}
export async function getVocabByDate(date) {
  return await db.vocabulary.where('dateAdded').equals(date).toArray();
}
export async function addVocabWord(word) {
  return await db.vocabulary.add({ ...word, createdAt: new Date().toISOString() });
}
export async function addVocab(word) {
  return await addVocabWord(word);
}
export async function updateVocabWord(id, updates) {
  return await db.vocabulary.update(id, updates);
}
export async function deleteVocabWord(id) {
  return await db.vocabulary.delete(id);
}
export async function addVocabReview(review) {
  return await db.vocabularyReviews.add(review);
}
export async function getVocabReviews(vocabularyId) {
  return await db.vocabularyReviews.where('vocabularyId').equals(vocabularyId).toArray();
}

// ─── Teaching Schedule ────────────────────────────────────────────────────────
export async function getTeachingSchedule() {
  return await db.teachingSchedule.toArray();
}
export async function addTeachingSlot(slot) {
  return await db.teachingSchedule.add(slot);
}
export async function updateTeachingSlot(id, updates) {
  return await db.teachingSchedule.update(id, updates);
}
export async function deleteTeachingSlot(id) {
  return await db.teachingSchedule.delete(id);
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function getAllNotifications() {
  return await db.notifications.orderBy('scheduledAt').reverse().toArray();
}
export async function getUnreadNotifications() {
  // Dexie indexes booleans as 1/0 — filter manually for reliability
  const all = await db.notifications.toArray();
  return all.filter((n) => !n.read);
}
export async function addNotification(notif) {
  // Avoid duplicate notifications of the same type/title on the same day
  const today = new Date().toISOString().slice(0, 10);
  
  if (notif.idempotencyKey) {
    const existing = await db.notifications.filter(n => n.idempotencyKey === notif.idempotencyKey).first();
    if (existing) return existing.id;
  } else {
    // Fallback logic
    const existing = await db.notifications
      .filter((n) => n.type === notif.type && n.title === notif.title && (n.scheduledAt || '').startsWith(today))
      .first();
    if (existing) return existing.id;
  }
  
  return await db.notifications.add({ ...notif, read: false, createdAt: new Date().toISOString() });
}
export async function markNotificationRead(id) {
  return await db.notifications.update(id, { read: true });
}
export async function markAllNotificationsRead() {
  const all = await db.notifications.toArray();
  const unread = all.filter((n) => !n.read);
  await Promise.all(unread.map((n) => db.notifications.update(n.id, { read: true })));
}

// ─── Daily Progress ───────────────────────────────────────────────────────────
export async function getDailyProgress(date) {
  return await db.dailyProgress.where('date').equals(date).first();
}
export async function upsertDailyProgress(date, updates) {
  const existing = await getDailyProgress(date);
  if (existing) {
    return await db.dailyProgress.update(existing.id, updates);
  } else {
    return await db.dailyProgress.add({ date, ...updates });
  }
}
export async function getDailyProgressRange(startDate, endDate) {
  return await db.dailyProgress
    .where('date')
    .between(startDate, endDate, true, true)
    .toArray();
}

// ─── Error Log ──────────────────────────────────────────────────────────────
export async function getErrorLogs() {
  return await db.errorLog.toArray();
}
export async function getErrorLogsByMock(mockTestId) {
  return await db.errorLog.where('mockTestId').equals(mockTestId).toArray();
}
export async function getErrorLogsByTopic(topicId) {
  return await db.errorLog.where('topicId').equals(topicId).toArray();
}
export async function addErrorLog(errorData) {
  return await db.errorLog.add({
    ...errorData,
    dateAdded: new Date().toISOString(),
    reviewed: false,
    revisionRequired: errorData.revisionRequired ?? false,
    revisionTaskId: null
  });
}
export async function updateErrorLog(id, updates) {
  return await db.errorLog.update(id, updates);
}
export async function deleteErrorLog(id) {
  return await db.errorLog.delete(id);
}

// ─── Gita Shlokas ────────────────────────────────────────────────────────────
export async function getAllGitaShlokas() {
  return await db.gitaShlokas.orderBy('date').reverse().toArray();
}
export async function getTodayGitaShloka() {
  const today = new Date().toISOString().slice(0, 10);
  return await db.gitaShlokas.where('date').equals(today).first();
}
export async function getGitaShlokaById(id) {
  return await db.gitaShlokas.get(id);
}
export async function addGitaShloka(data) {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  return await db.gitaShlokas.add({
    date: data.date || today,
    chapter: data.chapter ? String(data.chapter) : '',
    verse: data.verse ? String(data.verse) : '',
    sanskritText: data.sanskritText || '',
    transliteration: data.transliteration || '',
    meaning: data.meaning || '',
    personalReflection: data.personalReflection || '',
    favorite: !!data.favorite,
    createdAt: now,
    updatedAt: now,
  });
}
export async function updateGitaShloka(id, updates) {
  const now = new Date().toISOString();
  return await db.gitaShlokas.update(id, {
    ...updates,
    updatedAt: now,
  });
}
export async function deleteGitaShloka(id) {
  return await db.gitaShlokas.delete(id);
}
export async function toggleGitaFavorite(id) {
  const existing = await db.gitaShlokas.get(id);
  if (!existing) return;
  const now = new Date().toISOString();
  return await db.gitaShlokas.update(id, {
    favorite: !existing.favorite,
    updatedAt: now,
  });
}

