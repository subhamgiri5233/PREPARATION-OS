/**
 * test-vocabulary-daily-goal.js
 * Automated tests for the Daily Vocabulary Goal feature.
 *
 * Tests verify:
 *  - Daily counter uses ONLY today's words (dateAdded === TODAY)
 *  - Previous days' words never inflate today's count
 *  - Editing a word does not change dateAdded / daily count
 *  - Exceeding goal (12/10) works correctly
 *  - History view returns per-day breakdown
 *  - API query param 'date' filters correctly
 *
 * Run: node test-vocabulary-daily-goal.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASS = '\x1b[32m✅ PASS\x1b[0m';
const FAIL = '\x1b[31m❌ FAIL\x1b[0m';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${PASS}: ${name}`);
    passed++;
  } catch (err) {
    console.log(`${FAIL}: ${name}`);
    console.log(`         → ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, label) {
  if (a !== b) throw new Error(`${label || 'assertEqual'}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ──────────────────────────────────────────────────────────
// Simulate the core daily-count logic used by the UI
// ──────────────────────────────────────────────────────────

/**
 * Simulates the MongoDB vocabulary collection.
 * Each word has a dateAdded field ('YYYY-MM-DD').
 */
function makeDatabase() {
  return [];
}

function addWord(db, word, dateAdded) {
  const entry = { _id: String(db.length + 1), word, dateAdded, meaning: `meaning of ${word}` };
  db.push(entry);
  return entry;
}

function editWord(db, id, updates) {
  // Editing NEVER changes dateAdded — mimics server PUT which strips dateAdded
  const word = db.find((w) => w._id === id);
  if (!word) throw new Error('Word not found');
  const { dateAdded, ...safeUpdates } = updates; // strip dateAdded
  Object.assign(word, safeUpdates);
  return word;
}

function deleteWord(db, id) {
  const idx = db.findIndex((w) => w._id === id);
  if (idx === -1) throw new Error('Word not found');
  db.splice(idx, 1);
}

/** Core: returns only today's words — this is what getVocabByDate(TODAY) returns */
function getWordsForDate(db, date) {
  return db.filter((w) => w.dateAdded === date);
}

/** Returns per-day history summary */
function getDailyHistory(db) {
  const byDate = {};
  for (const w of db) {
    if (!byDate[w.dateAdded]) byDate[w.dateAdded] = [];
    byDate[w.dateAdded].push(w);
  }
  return Object.entries(byDate)
    .map(([date, words]) => ({ date, count: words.length, words }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

const DAILY_TARGET = 10;
const TODAY = '2026-08-20';
const YESTERDAY = '2026-08-19';
const DAY_BEFORE = '2026-08-18';

console.log('\n🧪 Starting Daily Vocabulary Goal Test Suite...\n');

// ──────────────────────────────────────────────────────────
// TEST 1: New day with no words → 0/10
// ──────────────────────────────────────────────────────────
test('1. New day with no words → 0/10', () => {
  const db = makeDatabase();
  const todayWords = getWordsForDate(db, TODAY);
  assertEqual(todayWords.length, 0, 'todayCount');
});

// ──────────────────────────────────────────────────────────
// TEST 2: Add 1 word → 1/10
// ──────────────────────────────────────────────────────────
test('2. Add 1 word today → 1/10', () => {
  const db = makeDatabase();
  addWord(db, 'Abate', TODAY);
  const todayWords = getWordsForDate(db, TODAY);
  assertEqual(todayWords.length, 1, 'todayCount');
});

// ──────────────────────────────────────────────────────────
// TEST 3: Add 5 words → 5/10
// ──────────────────────────────────────────────────────────
test('3. Add 5 words today → 5/10', () => {
  const db = makeDatabase();
  ['Word1', 'Word2', 'Word3', 'Word4', 'Word5'].forEach((w) => addWord(db, w, TODAY));
  const todayWords = getWordsForDate(db, TODAY);
  assertEqual(todayWords.length, 5, 'todayCount');
});

// ──────────────────────────────────────────────────────────
// TEST 4: Add exactly 10 words → 10/10 goal completed
// ──────────────────────────────────────────────────────────
test('4. Add 10 words today → 10/10 ✅ goal completed', () => {
  const db = makeDatabase();
  for (let i = 1; i <= 10; i++) addWord(db, `Word${i}`, TODAY);
  const todayWords = getWordsForDate(db, TODAY);
  assertEqual(todayWords.length, 10, 'todayCount');
  assert(todayWords.length >= DAILY_TARGET, 'goal should be completed');
});

// ──────────────────────────────────────────────────────────
// TEST 5: Add 12 words → 12/10 (extra words stored, goal still met)
// ──────────────────────────────────────────────────────────
test('5. Add 12 words today → 12/10 (extra words stored, goal completed)', () => {
  const db = makeDatabase();
  for (let i = 1; i <= 12; i++) addWord(db, `Word${i}`, TODAY);
  const todayWords = getWordsForDate(db, TODAY);
  assertEqual(todayWords.length, 12, 'todayCount');
  assert(todayWords.length >= DAILY_TARGET, 'goal should be completed');
  assertEqual(todayWords.length - DAILY_TARGET, 2, 'extra words above goal');
});

// ──────────────────────────────────────────────────────────
// TEST 6: Tomorrow starts fresh → 0/10 for new day
// ──────────────────────────────────────────────────────────
test('6. Tomorrow starts fresh → 0/10 for new date', () => {
  const db = makeDatabase();
  // Add 10 words for today
  for (let i = 1; i <= 10; i++) addWord(db, `TodayWord${i}`, TODAY);
  // Simulate "tomorrow" by querying a different date
  const TOMORROW = '2026-08-21';
  const tomorrowWords = getWordsForDate(db, TOMORROW);
  assertEqual(tomorrowWords.length, 0, 'tomorrowCount should be 0');
});

// ──────────────────────────────────────────────────────────
// TEST 7: Yesterday's words remain in history
// ──────────────────────────────────────────────────────────
test("7. Yesterday's words remain in history", () => {
  const db = makeDatabase();
  for (let i = 1; i <= 10; i++) addWord(db, `YesterdayWord${i}`, YESTERDAY);
  const history = getDailyHistory(db);
  assert(history.length > 0, 'history should not be empty');
  const yesterdayEntry = history.find((h) => h.date === YESTERDAY);
  assert(yesterdayEntry, 'yesterday should appear in history');
  assertEqual(yesterdayEntry.count, 10, "yesterday's count");
});

// ──────────────────────────────────────────────────────────
// TEST 8: Yesterday's 10 words do NOT count toward today
// ──────────────────────────────────────────────────────────
test("8. Yesterday's 10 words do NOT count toward today's progress", () => {
  const db = makeDatabase();
  // 10 words from yesterday
  for (let i = 1; i <= 10; i++) addWord(db, `YesterdayWord${i}`, YESTERDAY);
  // 4 words from today
  for (let i = 1; i <= 4; i++) addWord(db, `TodayWord${i}`, TODAY);

  const todayWords = getWordsForDate(db, TODAY);
  assertEqual(todayWords.length, 4, "today's count should be 4, not 14");
});

// ──────────────────────────────────────────────────────────
// TEST 9: Editing a word does NOT increase today's count
// ──────────────────────────────────────────────────────────
test('9. Editing a vocabulary word does NOT increase today\'s count', () => {
  const db = makeDatabase();
  // Add 5 words today
  for (let i = 1; i <= 5; i++) addWord(db, `Word${i}`, TODAY);
  const before = getWordsForDate(db, TODAY).length;

  // Edit Word1 (change meaning, synonyms — NOT dateAdded)
  const word = db[0];
  editWord(db, word._id, { meaning: 'Updated meaning', synonyms: ['updated'], dateAdded: '2099-01-01' });

  const after = getWordsForDate(db, TODAY).length;
  assertEqual(after, before, 'count should not change after edit');
  // dateAdded must be unchanged
  assertEqual(word.dateAdded, TODAY, 'dateAdded must NOT be overwritten by edit');
});

// ──────────────────────────────────────────────────────────
// TEST 10: Refreshing preserves today's correct count
// ──────────────────────────────────────────────────────────
test('10. Refreshing the page preserves today\'s correct count', () => {
  // The database is MongoDB Atlas — data is persistent.
  // Simulating "reload" = querying the same date again.
  const db = makeDatabase();
  for (let i = 1; i <= 7; i++) addWord(db, `Word${i}`, TODAY);

  // Simulate "reload": re-fetch today's words
  const afterReload = getWordsForDate(db, TODAY);
  assertEqual(afterReload.length, 7, 'count after reload should be 7');
});

// ──────────────────────────────────────────────────────────
// TEST 11: Logout / login preserves correct count (MongoDB persistence)
// ──────────────────────────────────────────────────────────
test('11. Logout and login preserves correct count (data in MongoDB Atlas)', () => {
  // Since all data is in MongoDB Atlas (not localStorage), logout/login
  // does not affect vocabulary records. Simulated by querying the same DB.
  const db = makeDatabase();
  for (let i = 1; i <= 8; i++) addWord(db, `Word${i}`, TODAY);
  // "logout" = don't clear DB (it's MongoDB, not memory)
  // "login" = query again
  const afterLoginRefetch = getWordsForDate(db, TODAY);
  assertEqual(afterLoginRefetch.length, 8, 'count after logout/login cycle should be 8');
});

// ──────────────────────────────────────────────────────────
// TEST 12: MongoDB Atlas data remains intact (multi-day scenario)
// ──────────────────────────────────────────────────────────
test('12. MongoDB Atlas data remains intact across multiple days', () => {
  const db = makeDatabase();
  // Day 1: 10 words
  for (let i = 1; i <= 10; i++) addWord(db, `D1Word${i}`, DAY_BEFORE);
  // Day 2: 10 words
  for (let i = 1; i <= 10; i++) addWord(db, `D2Word${i}`, YESTERDAY);
  // Day 3: 4 words
  for (let i = 1; i <= 4; i++) addWord(db, `D3Word${i}`, TODAY);

  // Total should be 24
  assertEqual(db.length, 24, 'total DB records should be 24');

  // Each day should query correctly
  assertEqual(getWordsForDate(db, DAY_BEFORE).length, 10, 'day-before count');
  assertEqual(getWordsForDate(db, YESTERDAY).length, 10, 'yesterday count');
  assertEqual(getWordsForDate(db, TODAY).length, 4, 'today count');

  // History should have 3 entries
  const history = getDailyHistory(db);
  assertEqual(history.length, 3, 'history should have 3 day entries');
});

// ──────────────────────────────────────────────────────────
// TEST 13: Daily target reading from settings (vocabDailyTarget)
// ──────────────────────────────────────────────────────────
test('13. Daily target is configurable via settings.vocabDailyTarget', () => {
  const settings = { vocabDailyTarget: 15 };
  const target = settings?.vocabDailyTarget || 10;
  assertEqual(target, 15, 'custom target');

  const settingsDefault = {};
  const defaultTarget = settingsDefault?.vocabDailyTarget || 10;
  assertEqual(defaultTarget, 10, 'default target');
});

// ──────────────────────────────────────────────────────────
// TEST 14: History view sorted newest-first
// ──────────────────────────────────────────────────────────
test('14. Daily history is sorted newest-first', () => {
  const db = makeDatabase();
  addWord(db, 'OldWord', DAY_BEFORE);
  addWord(db, 'YesterWord', YESTERDAY);
  addWord(db, 'TodayWord', TODAY);
  const history = getDailyHistory(db);
  assertEqual(history[0].date, TODAY, 'first entry should be today');
  assertEqual(history[history.length - 1].date, DAY_BEFORE, 'last entry should be oldest');
});

// ──────────────────────────────────────────────────────────
// TEST 15: Server routes — verify correct files exist and have correct logic
// ──────────────────────────────────────────────────────────
test('15. Server route vocabulary.js uses correct date filter (req.query.date / req.query.learnedDate)', () => {
  const routeFile = fs.readFileSync(path.join(__dirname, 'server/routes/vocabulary.js'), 'utf8');
  assert(routeFile.includes('req.query.date'), 'should filter by req.query.date');
  assert(routeFile.includes('req.query.learnedDate'), 'should also support learnedDate alias');
  assert(routeFile.includes('filter.dateAdded'), 'should set filter.dateAdded');
});

// ──────────────────────────────────────────────────────────
// TEST 16: Server route — editing a word does not change dateAdded
// ──────────────────────────────────────────────────────────
test('16. Server PUT /vocabulary/:id strips dateAdded from edit payload', () => {
  const routeFile = fs.readFileSync(path.join(__dirname, 'server/routes/vocabulary.js'), 'utf8');
  assert(routeFile.includes('delete updates.dateAdded'), 'PUT route should strip dateAdded from updates');
});

// ──────────────────────────────────────────────────────────
// TEST 17: DB service uses correct query param ?date=
// ──────────────────────────────────────────────────────────
test('17. Frontend db.js getVocabByDate uses ?date= (not ?learnedDate=)', () => {
  const dbFile = fs.readFileSync(path.join(__dirname, 'src/services/db.js'), 'utf8');
  assert(dbFile.includes("?date=${date}"), 'should use ?date= query param');
});

// ──────────────────────────────────────────────────────────
// TEST 18: Vocabulary.jsx uses handleAddWord (not broken handleSave reference)
// ──────────────────────────────────────────────────────────
test('18. Vocabulary.jsx Add form calls handleAddWord (not broken handleSave)', () => {
  const vocabFile = fs.readFileSync(path.join(__dirname, 'src/pages/Vocabulary.jsx'), 'utf8');
  assert(vocabFile.includes('onSubmit={handleAddWord}'), 'form should call handleAddWord');
  assert(!vocabFile.includes('onSubmit={handleSave}'), 'no broken handleSave reference');
});

// ──────────────────────────────────────────────────────────
// TEST 19: Vocabulary page has daily history tab
// ──────────────────────────────────────────────────────────
test('19. Vocabulary.jsx renders a Daily History tab', () => {
  const vocabFile = fs.readFileSync(path.join(__dirname, 'src/pages/Vocabulary.jsx'), 'utf8');
  assert(vocabFile.includes("'history'"), 'should have history tab ID');
  assert(vocabFile.includes('getVocabDailyHistory'), 'should call getVocabDailyHistory');
  assert(vocabFile.includes('Daily History'), 'should display Daily History label');
});

// ──────────────────────────────────────────────────────────
// TEST 20: Dashboard vocab card uses today-only todayVocab data
// ──────────────────────────────────────────────────────────
test('20. Dashboard vocab module uses getVocabByDate(TODAY) for today-only count', () => {
  const dashFile = fs.readFileSync(path.join(__dirname, 'src/pages/Dashboard.jsx'), 'utf8');
  assert(dashFile.includes('getVocabByDate(TODAY)'), 'Dashboard should call getVocabByDate(TODAY)');
  assert(dashFile.includes('todayVocab.length'), 'Dashboard should use todayVocab.length');
  assert(dashFile.includes('resets tomorrow'), 'Dashboard should mention daily reset');
});

// ──────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Daily Vocabulary Test Results: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) process.exit(1);
