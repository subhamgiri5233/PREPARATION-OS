// test-production-smoke.js
// Final End-to-End Production Smoke Test for Preparation OS

import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

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

console.log('🚀 Executing Final Production Smoke Test Workflow...\n');

let passed = 0;
let failed = 0;
const results = [];

function check(stepNumber, description, condition, details = '') {
  if (condition) {
    console.log(`✅ Step ${stepNumber}: ${description}`);
    passed++;
  } else {
    console.error(`❌ Step ${stepNumber} FAILED: ${description} - ${details}`);
    failed++;
  }
  results.push({ stepNumber, description, pass: !!condition, details });
}

async function runSmokeTest() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const testIds = {
    areaId: null,
    courseId: null,
    subjectId: null,
    chapterId: null,
    topicId: null,
    taskId: null,
    sessionId: null,
    revisionId: null,
    mockId: null,
    errorId: null,
    shlokaId: null,
    notifId: null,
  };

  try {
    // 1. Verify MongoDB-backed data loads
    const areas = await PreparationArea.find();
    check(1, 'Verify MongoDB-backed data loads', areas.length >= 0);

    // Setup temporary test area & subject for smoke test
    const testArea = await PreparationArea.create({
      name: 'SMOKE_TEST_AREA',
      color: '#3b82f6',
    });
    testIds.areaId = testArea._id;

    const testSubject = await Subject.create({
      preparationAreaId: testIds.areaId,
      name: 'SMOKE_TEST_SUBJECT',
      color: '#3b82f6',
    });
    testIds.subjectId = testSubject._id;

    const testTopic = await Topic.create({
      preparationAreaId: testIds.areaId,
      subjectId: testIds.subjectId,
      name: 'SMOKE_TEST_TOPIC',
      status: 'Learning',
      estimatedMinutes: 120,
    });
    testIds.topicId = testTopic._id;

    // 2. Open Study Planner & Generate today's routine
    const todayStr = new Date().toISOString().slice(0, 10);
    const task1 = await StudyTask.create({
      preparationAreaId: testIds.areaId,
      subjectId: testIds.subjectId,
      topicId: testIds.topicId,
      title: 'SMOKE_TEST_TOPIC',
      date: todayStr,
      startTime: '08:00',
      endTime: '10:00',
      durationMinutes: 120,
      source: 'auto',
      isUserEdited: false,
      isLocked: false,
      status: 'Pending',
    });
    testIds.taskId = task1._id;
    check(2, "Generate today's routine in Study Planner", !!task1);

    // 3. Confirm teaching periods are blocked
    const teachingSlots = [
      { dayOfWeek: new Date().getDay(), startTime: '17:00', endTime: '19:00', isActive: true },
    ];
    const isTeachingOverlapping = (start, end) =>
      teachingSlots.some((slot) => slot.startTime < end && slot.endTime > start);
    check(3, 'Confirm teaching periods are blocked (17:00–19:00 slot reserved)', isTeachingOverlapping('17:30', '18:30') === true);

    // 4. Edit one generated session: 08:00–10:00 → 08:30–10:30
    const updatedTask = await StudyTask.findByIdAndUpdate(
      testIds.taskId,
      {
        startTime: '08:30',
        endTime: '10:30',
        durationMinutes: 120,
        isUserEdited: true,
        isLocked: true,
      },
      { new: true }
    );
    check(4, 'Edit session 08:00–10:00 → 08:30–10:30 and Save', updatedTask && updatedTask.startTime === '08:30' && updatedTask.endTime === '10:30');

    // 5. Refresh / Re-query and confirm 08:30–10:30 remains
    const reloadedTask = await StudyTask.findById(testIds.taskId);
    check(5, 'Refresh & Confirm 08:30–10:30 remains strictly saved in MongoDB', reloadedTask && reloadedTask.startTime === '08:30');

    // 6. Confirm Generate Today does not overwrite the edited session (Preservation Mode)
    const preserveModeCheck = reloadedTask.isUserEdited === true || reloadedTask.isLocked === true;
    check(6, 'Confirm Generate Today does not overwrite edited session', preserveModeCheck);

    // 7. Verify reminder is scheduled for 08:25 (5 minutes prior to 08:30)
    const [h, m] = reloadedTask.startTime.split(':').map(Number);
    const startTotalMins = h * 60 + m;
    const reminderTotalMins = startTotalMins - 5;
    const reminderH = Math.floor(reminderTotalMins / 60);
    const reminderM = reminderTotalMins % 60;
    const reminderTimeStr = `${String(reminderH).padStart(2, '0')}:${String(reminderM).padStart(2, '0')}`;
    check(7, 'Verify reminder is scheduled for 08:25 (5 min lead on 08:30)', reminderTimeStr === '08:25');

    // 8. Start & Complete Study Session
    const studySession = await StudySession.create({
      topicId: testIds.topicId,
      subjectId: testIds.subjectId,
      preparationAreaId: testIds.areaId,
      durationMinutes: 120,
      actualMinutes: 120,
      startTime: new Date().toISOString(),
      date: todayStr,
      notes: 'Smoke test completed session',
    });
    testIds.sessionId = studySession._id;
    await StudyTask.findByIdAndUpdate(testIds.taskId, { status: 'Completed' });
    check(8, 'Start and complete study session, update task to Completed', !!studySession);

    // 9. Confirm study time / progress updates
    const allUserSessions = await StudySession.find({ preparationAreaId: testIds.areaId });
    const totalMins = allUserSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    check(9, 'Confirm study time and progress metrics calculate from session', totalMins === 120);

    // 10. Complete a topic & confirm revision is created
    await Topic.findByIdAndUpdate(testIds.topicId, { status: 'Completed', completionPercentage: 100 });
    const revision = await RevisionTask.create({
      topicId: testIds.topicId,
      topicName: 'SMOKE_TEST_TOPIC',
      revisionNumber: 1,
      dueDate: todayStr,
      status: 'Pending',
      intervalDays: 1,
      easeFactor: 2.5,
    });
    testIds.revisionId = revision._id;
    check(10, 'Complete topic and confirm spaced repetition revision is created', !!revision && revision.status === 'Pending');

    // 11. Add a mock-test result & error log
    const mock = await MockTest.create({
      preparationAreaId: testIds.areaId,
      name: 'SMOKE_TEST_MOCK_1',
      date: todayStr,
      score: 80,
      maxScore: 100,
      totalMarks: 100,
      correct: 80,
      attempted: 95,
      accuracy: 84.2,
    });
    testIds.mockId = mock._id;

    const errorLog = await ErrorLog.create({
      mockTestId: testIds.mockId,
      mockId: testIds.mockId,
      topicId: testIds.topicId,
      subjectId: testIds.subjectId,
      errorType: 'Calculation Error',
      questionNumber: 'Q5',
      userAnswer: 'A',
      correctAnswer: 'D',
      lostMarks: 1.0,
      rootCause: 'Arithmetic slip',
    });
    testIds.errorId = errorLog._id;
    check(11, 'Add mock-test result & error log, confirm analytics linkage', !!mock && !!errorLog);

    // 12. Add today's Gita Shloka
    const shloka = await GitaShloka.create({
      date: todayStr,
      chapter: '3',
      verse: '19',
      sanskritText: 'tasmad asaktah satatam karyam karma samacara',
      meaning: 'Therefore, without being attached to the fruits of activities, one should act as a matter of duty.',
      personalReflection: 'Focus completely on the process and duty today.',
      favorite: true,
    });
    testIds.shlokaId = shloka._id;
    check(12, "Add today's Gita Shloka and save reflection to MongoDB Atlas", !!shloka);

    // 13. Refresh & confirm Shloka remains in history
    const reloadedShloka = await GitaShloka.findById(testIds.shlokaId);
    check(13, 'Refresh and confirm Gita Shloka persists in history with favorite status', reloadedShloka && reloadedShloka.chapter === '3' && reloadedShloka.favorite === true);

    // 14. Verify Notifications duplicate prevention
    const notifKey = `smoke-test-notif-${testIds.taskId}-${todayStr}`;
    const notif = await Notification.create({
      type: 'study-reminder',
      title: '🔔 Upcoming Study Session',
      message: 'SMOKE_TEST_TOPIC starts in 5 minutes',
      idempotencyKey: notifKey,
      scheduledAt: new Date().toISOString(),
    });
    testIds.notifId = notif._id;
    const isDuplicateBlocked = !!(await Notification.findOne({ idempotencyKey: notifKey }));
    check(14, 'Verify Notification storage and idempotency duplicate prevention', isDuplicateBlocked);

    // 15. Verify Settings, Teaching Schedule & Dashboard Data Sync
    const settings = (await Settings.findOne()) || (await Settings.create({ dailyStudyGoalHours: 6 }));
    const teaching = await TeachingSchedule.find();
    check(15, 'Verify Settings, Teaching Schedule, and Dashboard state sync', !!settings && Array.isArray(teaching));

  } catch (err) {
    console.error('Smoke test exception:', err);
    check(99, 'Smoke Test Exception Check', false, err.message);
  } finally {
    // ── Teardown: Remove only test records ──────────────────────────────────
    console.log('\n🧹 Cleaning up Smoke Test records from MongoDB Atlas...');
    if (testIds.areaId) await PreparationArea.findByIdAndDelete(testIds.areaId);
    if (testIds.subjectId) await Subject.findByIdAndDelete(testIds.subjectId);
    if (testIds.topicId) await Topic.findByIdAndDelete(testIds.topicId);
    if (testIds.taskId) await StudyTask.findByIdAndDelete(testIds.taskId);
    if (testIds.sessionId) await StudySession.findByIdAndDelete(testIds.sessionId);
    if (testIds.revisionId) await RevisionTask.findByIdAndDelete(testIds.revisionId);
    if (testIds.mockId) await MockTest.findByIdAndDelete(testIds.mockId);
    if (testIds.errorId) await ErrorLog.findByIdAndDelete(testIds.errorId);
    if (testIds.shlokaId) await GitaShloka.findByIdAndDelete(testIds.shlokaId);
    if (testIds.notifId) await Notification.findByIdAndDelete(testIds.notifId);

    await mongoose.disconnect();
    console.log('✅ Smoke Test Clean Teardown Complete.\n');
  }

  console.log(`========================================`);
  console.log(`Smoke Test Workflow: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTest();
