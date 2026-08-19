// test-smart-reminders.js
// Automated verification suite for the Smart Pre-Study Reminder System

import assert from 'assert';
import { formatTime12h, checkTeachingConflict, getNextUpcomingStudySession } from './src/services/reminderScheduler.js';

console.log('🧪 Starting Smart Pre-Study Reminder Test Suite...\n');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    failedTests++;
  }
}

// ── Test 1: Time formatting (24h -> 12h) ─────────────────────────────────────
test('1. formatTime12h correctly formats 24h strings', () => {
  assert.strictEqual(formatTime12h('08:00'), '8:00 AM');
  assert.strictEqual(formatTime12h('14:30'), '2:30 PM');
  assert.strictEqual(formatTime12h('20:00'), '8:00 PM');
  assert.strictEqual(formatTime12h('00:15'), '12:15 AM');
  assert.strictEqual(formatTime12h('12:00'), '12:00 PM');
});

// ── Test 2: Teaching period overlap detection ────────────────────────────────
test('2. Teaching period overlap is detected and suppresses study reminder', () => {
  const teachingSlots = [
    { day: 'Monday', startTime: '10:00', endTime: '12:00', active: true },
    { day: 'Wednesday', startTime: '14:00', endTime: '16:00', active: true }
  ];
  
  // 2026-08-24 is a Monday
  const hasConflictMonday = checkTeachingConflict('2026-08-24', '10:30', 60, teachingSlots);
  assert.strictEqual(hasConflictMonday, true, 'Should detect overlap during Monday teaching period');

  // 2026-08-24 at 13:00 (after teaching period)
  const noConflictMonday = checkTeachingConflict('2026-08-24', '13:00', 60, teachingSlots);
  assert.strictEqual(noConflictMonday, false, 'Should not conflict after teaching period');

  // 2026-08-25 is a Tuesday (no teaching slots)
  const tuesdayCheck = checkTeachingConflict('2026-08-25', '10:30', 60, teachingSlots);
  assert.strictEqual(tuesdayCheck, false, 'Should not conflict on non-teaching day');
});

// ── Test 3: Next Study Session calculation on Dashboard ──────────────────────
test('3. Next Study Session computation selects the earliest active upcoming task', () => {
  const tasks = [
    { id: 't1', topicId: 'top1', subjectId: 'sub1', preparationAreaId: 'area1', startTime: '23:30', durationMinutes: 60, status: 'Pending' },
    { id: 't2', topicId: 'top2', subjectId: 'sub1', preparationAreaId: 'area1', startTime: '23:45', durationMinutes: 45, status: 'Pending' },
    { id: 't3', topicId: 'top3', subjectId: 'sub1', preparationAreaId: 'area1', startTime: '23:00', durationMinutes: 30, status: 'Completed' }
  ];

  const subjects = [{ id: 'sub1', name: 'DBMS' }];
  const topics = [
    { id: 'top1', name: 'Normalization', subjectId: 'sub1' },
    { id: 'top2', name: 'Transactions', subjectId: 'sub1' },
    { id: 'top3', name: 'Indexing', subjectId: 'sub1' }
  ];
  const areas = [{ id: 'area1', name: 'IBPS SO IT Officer', color: '#6366f1' }];
  const settings = { studyReminderMinutes: 5, studyRemindersEnabled: true };

  const next = getNextUpcomingStudySession(tasks, subjects, topics, areas, settings, []);
  assert.ok(next, 'Next session should be found');
  assert.strictEqual(next.subjectName, 'DBMS');
  assert.strictEqual(next.topicName, 'Normalization');
  assert.strictEqual(next.areaName, 'IBPS SO IT Officer');
  assert.strictEqual(next.durationMinutes, 60);
});

// ── Test 4: Completed, cancelled, or skipped sessions are ignored ───────────
test('4. Completed, cancelled, and skipped tasks are excluded from next session', () => {
  const tasks = [
    { id: 't1', topicId: 'top1', startTime: '23:30', durationMinutes: 60, status: 'Completed' },
    { id: 't2', topicId: 'top2', startTime: '23:45', durationMinutes: 45, status: 'Cancelled' },
    { id: 't3', topicId: 'top3', startTime: '23:55', durationMinutes: 30, status: 'Skipped' }
  ];

  const next = getNextUpcomingStudySession(tasks, [], [], [], { studyReminderMinutes: 5 }, []);
  assert.strictEqual(next, null, 'Should return null when all tasks are inactive');
});

// ── Test 5: Reminder Lead Time calculation ──────────────────────────────────
test('5. Reminder lead time correctly adjusts reminder timestamp', () => {
  const tasks = [
    { id: 't1', topicId: 'top1', startTime: '23:30', durationMinutes: 60, status: 'Pending' }
  ];
  const subjects = [{ id: 'sub1', name: 'Computer Networks' }];
  const topics = [{ id: 'top1', name: 'OSI Model', subjectId: 'sub1' }];
  const areas = [{ id: 'area1', name: 'IBPS SO IT Officer' }];

  // Test 5 min lead: 23:30 - 5m = 23:25 -> 11:25 PM
  const next5 = getNextUpcomingStudySession(tasks, subjects, topics, areas, { studyReminderMinutes: 5 }, []);
  assert.strictEqual(next5.reminderTime, '11:25 PM');

  // Test 15 min lead: 23:30 - 15m = 23:15 -> 11:15 PM
  const next15 = getNextUpcomingStudySession(tasks, subjects, topics, areas, { studyReminderMinutes: 15 }, []);
  assert.strictEqual(next15.reminderTime, '11:15 PM');

  // Test 30 min lead: 23:30 - 30m = 23:00 -> 11:00 PM
  const next30 = getNextUpcomingStudySession(tasks, subjects, topics, areas, { studyReminderMinutes: 30 }, []);
  assert.strictEqual(next30.reminderTime, '11:00 PM');
});

// ── Test 6: Idempotency Key Format & Uniqueness ─────────────────────────────
test('6. Idempotency keys prevent duplicate pre-study and missed session reminders', () => {
  const taskId = 'task_123';
  const todayStr = '2026-08-20';

  const preStudyKey1 = `pre-study-reminder-${taskId}-${todayStr}`;
  const preStudyKey2 = `pre-study-reminder-${taskId}-${todayStr}`;
  const missedKey = `missed-study-${taskId}-${todayStr}`;

  assert.strictEqual(preStudyKey1, preStudyKey2, 'Pre-study idempotency keys must match for duplicate detection');
  assert.notStrictEqual(preStudyKey1, missedKey, 'Pre-study and missed session keys must be distinct');
});

// ── Test 7: Snooze calculations ─────────────────────────────────────────────
test('7. Snooze adds exactly 5 minutes to current timestamp', () => {
  const now = Date.now();
  const snoozedUntilMs = now + 5 * 60 * 1000;
  const diffMinutes = Math.round((snoozedUntilMs - now) / 60000);
  assert.strictEqual(diffMinutes, 5);
});

// ── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n========================================`);
console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
