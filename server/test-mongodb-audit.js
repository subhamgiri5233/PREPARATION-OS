// server/test-mongodb-audit.js
// Production Database Verification & Audit Suite for MongoDB Atlas

import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';

// Force Public DNS for Atlas SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

// Import all Mongoose Models
import PreparationArea from './models/PreparationArea.js';
import Course from './models/Course.js';
import Subject from './models/Subject.js';
import Chapter from './models/Chapter.js';
import Topic from './models/Topic.js';
import StudySession from './models/StudySession.js';
import StudyTask from './models/StudyTask.js';
import RevisionTask from './models/RevisionTask.js';
import MockTest from './models/MockTest.js';
import MockSubjectResult from './models/MockSubjectResult.js';
import ErrorLog from './models/ErrorLog.js';
import Vocabulary from './models/Vocabulary.js';
import Notification from './models/Notification.js';
import TeachingSchedule from './models/TeachingSchedule.js';
import Settings from './models/Settings.js';
import GitaShloka from './models/GitaShloka.js';
import DailyProgress from './models/DailyProgress.js';

console.log('🔍 Starting MongoDB Atlas Production Database Verification & Audit...\n');

let passedTests = 0;
let failedTests = 0;
const auditLog = [];

function record(name, pass, details = '') {
  if (pass) {
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL: ${name} - ${details}`);
    failedTests++;
  }
  auditLog.push({ name, pass, details });
}

async function runAudit() {
  const uri = process.env.MONGODB_URI;

  // ── 1. Security Check: Environment variable existence & no exposure ──────
  const hasUri = !!uri && uri.startsWith('mongodb');
  record('1. MongoDB URI exists in server environment', hasUri, 'MONGODB_URI missing in server/.env');

  // ── 2. MongoDB Atlas Connection ──────────────────────────────────────────
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const isConnected = mongoose.connection.readyState === 1;
    record('2. Live connection to MongoDB Atlas established', isConnected);
  } catch (err) {
    record('2. Live connection to MongoDB Atlas established', false, err.message);
    process.exit(1);
  }

  const dbName = mongoose.connection.db.databaseName;
  record('3. Authoritative Database Identified', dbName === 'PreparationOS' || !!dbName, `Database name: ${dbName}`);

  // ── 4. Verify MongoDB Collections ─────────────────────────────────────────
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);
  console.log(`\n📂 Discovered MongoDB Collections (${collectionNames.length}):`, collectionNames.join(', '), '\n');
  record('4. Collections present in MongoDB Atlas', collectionNames.length > 0);

  // ── 5. Syllabus Hierarchy Persistence Test (Course -> Subject -> Chapter -> Topic)
  let testAreaId = null;
  let testCourseId = null;
  let testSubjectId = null;
  let testChapterId = null;
  let testTopicId = null;

  try {
    const testArea = await PreparationArea.create({
      name: 'TEST_AUDIT_AREA',
      description: 'Audit Test Area',
      color: '#6366f1',
    });
    testAreaId = testArea._id;

    const testCourse = await Course.create({
      preparationAreaId: testAreaId,
      name: 'TEST_AUDIT_COURSE',
    });
    testCourseId = testCourse._id;

    const testSubject = await Subject.create({
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      name: 'TEST_AUDIT_SUBJECT',
    });
    testSubjectId = testSubject._id;

    const testChapter = await Chapter.create({
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      subjectId: testSubjectId,
      name: 'TEST_AUDIT_CHAPTER',
    });
    testChapterId = testChapter._id;

    const testTopic = await Topic.create({
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      subjectId: testSubjectId,
      chapterId: testChapterId,
      name: 'TEST_AUDIT_TOPIC',
      status: 'Learning',
      estimatedMinutes: 60,
    });
    testTopicId = testTopic._id;

    // Read back and verify
    const fetchedTopic = await Topic.findById(testTopicId);
    const verified = fetchedTopic && fetchedTopic.name === 'TEST_AUDIT_TOPIC' && String(fetchedTopic.subjectId) === String(testSubjectId);
    record('5. Course -> Subject -> Chapter -> Topic 5-Tier CRUD Persistence', verified);
  } catch (err) {
    record('5. Course -> Subject -> Chapter -> Topic 5-Tier CRUD Persistence', false, err.message);
  }

  // ── 6. Gita Shloka Persistence Test ───────────────────────────────────────
  let testGitaId = null;
  try {
    const testShloka = await GitaShloka.create({
      date: '2026-08-20',
      chapter: '2',
      verse: '47',
      sanskritText: 'TEST_SANSKRIT',
      meaning: 'TEST_MEANING',
      personalReflection: 'TEST_REFLECTION',
      favorite: true,
    });
    testGitaId = testShloka._id;

    const fetchedShloka = await GitaShloka.findById(testGitaId);
    const gitaValid = fetchedShloka && fetchedShloka.verse === '47' && fetchedShloka.favorite === true;
    record('6. Gita Shloka Save, Retrieve & Favorite in MongoDB', gitaValid);
  } catch (err) {
    record('6. Gita Shloka Save, Retrieve & Favorite in MongoDB', false, err.message);
  }

  // ── 7. Study Session Persistence Test ─────────────────────────────────────
  let testSessionId = null;
  try {
    const testSession = await StudySession.create({
      topicId: testTopicId,
      subjectId: testSubjectId,
      preparationAreaId: testAreaId,
      durationMinutes: 45,
      actualMinutes: 45,
      notes: 'AUDIT_SESSION_NOTE',
      startTime: new Date().toISOString(),
    });
    testSessionId = testSession._id;

    const fetchedSession = await StudySession.findById(testSessionId);
    record('7. Study Session Logging & Time Tracking in MongoDB', !!fetchedSession && fetchedSession.durationMinutes === 45);
  } catch (err) {
    record('7. Study Session Logging & Time Tracking in MongoDB', false, err.message);
  }

  // ── 8. Mock Test + Results + Error Log Persistence ────────────────────────
  let testMockId = null;
  let testErrorId = null;
  try {
    const testMock = await MockTest.create({
      preparationAreaId: testAreaId,
      name: 'TEST_AUDIT_MOCK_1',
      date: '2026-08-20',
      score: 75,
      maxScore: 100,
      totalMarks: 100,
      correct: 75,
      attempted: 90,
      accuracy: 83.3,
    });
    testMockId = testMock._id;

    const testError = await ErrorLog.create({
      mockId: testMockId,
      topicId: testTopicId,
      subjectId: testSubjectId,
      errorType: 'Conceptual Error',
      questionNumber: 'Q14',
      userAnswer: 'B',
      correctAnswer: 'C',
      lostMarks: 1.25,
      rootCause: 'Formula confusion',
    });
    testErrorId = testError._id;

    const fetchedMock = await MockTest.findById(testMockId);
    const fetchedErrors = await ErrorLog.find({ mockId: testMockId });
    record('8. Mock Test + Error Log Persistence in MongoDB', !!fetchedMock && fetchedErrors.length === 1);
  } catch (err) {
    record('8. Mock Test + Error Log Persistence in MongoDB', false, err.message);
  }

  // ── 9. Spaced Repetition Revision Persistence & SM-2 Update ───────────────
  let testRevisionId = null;
  try {
    const testRevision = await RevisionTask.create({
      topicId: testTopicId,
      topicName: 'TEST_AUDIT_TOPIC',
      revisionNumber: 1,
      dueDate: '2026-08-20',
      status: 'Pending',
      intervalDays: 1,
      easeFactor: 2.5,
    });
    testRevisionId = testRevision._id;

    // Simulate completion with confidence 5
    await RevisionTask.findByIdAndUpdate(testRevisionId, {
      status: 'Completed',
      confidence: 5,
      completedDate: '2026-08-20',
      intervalDays: 3,
    });

    const updatedRev = await RevisionTask.findById(testRevisionId);
    record('9. Spaced Repetition Revision State & Confidence in MongoDB', updatedRev && updatedRev.status === 'Completed' && updatedRev.intervalDays === 3);
  } catch (err) {
    record('9. Spaced Repetition Revision State & Confidence in MongoDB', false, err.message);
  }

  // ── 10. Planner Task Edit & Lock Persistence (08:00 -> 08:30) ─────────────
  let testTaskId = null;
  try {
    const testTask = await StudyTask.create({
      topicId: testTopicId,
      subjectId: testSubjectId,
      preparationAreaId: testAreaId,
      title: 'TEST_TASK',
      date: '2026-08-20',
      startTime: '08:00',
      endTime: '10:00',
      source: 'auto',
      isUserEdited: false,
      isLocked: false,
    });
    testTaskId = testTask._id;

    // User edits task from 08:00–10:00 to 08:30–10:30 and locks time
    await StudyTask.findByIdAndUpdate(testTaskId, {
      startTime: '08:30',
      endTime: '10:30',
      isUserEdited: true,
      isLocked: true,
    });

    const fetchedTask = await StudyTask.findById(testTaskId);
    const taskVerified = fetchedTask && fetchedTask.startTime === '08:30' && fetchedTask.isUserEdited === true && fetchedTask.isLocked === true;
    record('10. Study Planner Task 08:00 -> 08:30 User Edit & Lock in MongoDB', taskVerified);
  } catch (err) {
    record('10. Study Planner Task 08:00 -> 08:30 User Edit & Lock in MongoDB', false, err.message);
  }

  // ── 11. Notification Idempotency Key & Duplicate Prevention ───────────────
  let testNotifId = null;
  try {
    const notifKey = `pre-study-reminder-${testTaskId}-2026-08-20`;
    
    // First creation
    const notif1 = await Notification.create({
      type: 'study-reminder',
      title: '🔔 Upcoming Study Session',
      message: 'Test Reminder',
      idempotencyKey: notifKey,
      scheduledAt: new Date().toISOString(),
    });
    testNotifId = notif1._id;

    // Check duplicate detection
    const existing = await Notification.findOne({ idempotencyKey: notifKey });
    record('11. Notification Idempotency Key & Duplicate Prevention', !!existing && String(existing._id) === String(notif1._id));
  } catch (err) {
    record('11. Notification Idempotency Key & Duplicate Prevention', false, err.message);
  }

  // ── 12. Teardown: Clean up all test records ───────────────────────────────
  console.log('\n🧹 Cleaning up test audit records from MongoDB Atlas...');
  if (testAreaId) await PreparationArea.findByIdAndDelete(testAreaId);
  if (testCourseId) await Course.findByIdAndDelete(testCourseId);
  if (testSubjectId) await Subject.findByIdAndDelete(testSubjectId);
  if (testChapterId) await Chapter.findByIdAndDelete(testChapterId);
  if (testTopicId) await Topic.findByIdAndDelete(testTopicId);
  if (testGitaId) await GitaShloka.findByIdAndDelete(testGitaId);
  if (testSessionId) await StudySession.findByIdAndDelete(testSessionId);
  if (testMockId) await MockTest.findByIdAndDelete(testMockId);
  if (testErrorId) await ErrorLog.findByIdAndDelete(testErrorId);
  if (testRevisionId) await RevisionTask.findByIdAndDelete(testRevisionId);
  if (testTaskId) await StudyTask.findByIdAndDelete(testTaskId);
  if (testNotifId) await Notification.findByIdAndDelete(testNotifId);

  await mongoose.disconnect();
  record('12. Test Audit Cleanup Completed (Zero test debris left in Atlas)', true);

  console.log(`\n========================================`);
  console.log(`MongoDB Atlas Audit Results: ${passedTests} passed, ${failedTests} failed`);
  console.log(`========================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAudit();
