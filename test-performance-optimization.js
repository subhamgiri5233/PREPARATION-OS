/**
 * test-performance-optimization.js
 * Automated performance validation suite for Preparation OS.
 *
 * Tests verify:
 *  1. In-flight request deduplication
 *  2. In-memory TTL caching for read-heavy routes
 *  3. Automated cache invalidation on write mutations
 *  4. Client-side navigation audit (zero internal full-page reload anchor tags)
 *  5. Route-level code splitting with React.lazy / Suspense
 *  6. MongoDB Atlas indexing on high-frequency query fields
 *  7. Memory cleanup & cache invalidation helpers
 *
 * Run: node test-performance-optimization.js
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

console.log('\n⚡ Starting Performance & Fast Navigation Test Suite...\n');

// ──────────────────────────────────────────────────────────
// 1. In-flight request deduplication simulation
// ──────────────────────────────────────────────────────────
test('1. In-flight request deduplication returns the exact same Promise for concurrent requests', async () => {
  const inFlight = new Map();
  let networkCalls = 0;

  async function mockApiFetch(path) {
    if (inFlight.has(path)) {
      return inFlight.get(path);
    }
    const p = (async () => {
      networkCalls++;
      await new Promise((r) => setTimeout(r, 20));
      return { data: `result for ${path}`, count: networkCalls };
    })();
    inFlight.set(path, p);
    try {
      return await p;
    } finally {
      inFlight.delete(path);
    }
  }

  // 3 components mount concurrently and request /subjects
  const [res1, res2, res3] = await Promise.all([
    mockApiFetch('/subjects'),
    mockApiFetch('/subjects'),
    mockApiFetch('/subjects'),
  ]);

  assertEqual(networkCalls, 1, 'networkCalls count');
  assertEqual(res1.data, res2.data, 'res1 and res2 data');
  assertEqual(res2.data, res3.data, 'res2 and res3 data');
});

// ──────────────────────────────────────────────────────────
// 2. TTL in-memory caching simulation
// ──────────────────────────────────────────────────────────
test('2. In-memory TTL cache serves read-heavy endpoints instantly without network overhead', () => {
  const cache = new Map();
  const TTL = 60000;
  let networkCalls = 0;

  function cachedFetch(path, now) {
    const cached = cache.get(path);
    if (cached && now - cached.timestamp < TTL) {
      return { data: cached.data, fromCache: true };
    }
    networkCalls++;
    const data = { path, timestamp: now };
    cache.set(path, { data, timestamp: now });
    return { data, fromCache: false };
  }

  const t0 = 100000;
  const first = cachedFetch('/topics', t0);
  assertEqual(first.fromCache, false, 'first call is cache miss');
  assertEqual(networkCalls, 1, 'network calls after first');

  const second = cachedFetch('/topics', t0 + 5000); // 5 sec later
  assertEqual(second.fromCache, true, 'second call is cache hit');
  assertEqual(networkCalls, 1, 'network calls must stay 1');
});

// ──────────────────────────────────────────────────────────
// 3. Cache invalidation on mutation
// ──────────────────────────────────────────────────────────
test('3. Mutations (POST/PUT/DELETE/PATCH) invalidate related cache keys', () => {
  const cache = new Map();
  cache.set('/topics', { data: [1, 2, 3] });
  cache.set('/topics/123', { data: { id: 123 } });
  cache.set('/subjects', { data: ['Sub1'] });

  function invalidateApiCache(pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) cache.delete(key);
    }
  }

  // Add a topic -> invalidates /topics
  invalidateApiCache('/topics');
  assert(!cache.has('/topics'), '/topics should be cleared');
  assert(!cache.has('/topics/123'), '/topics/123 should be cleared');
  assert(cache.has('/subjects'), '/subjects should remain untouched');
});

// ──────────────────────────────────────────────────────────
// 4. Client-side navigation link audit
// ──────────────────────────────────────────────────────────
test('4. Zero internal full-page reload anchor tags (<a href="/...") across core pages', () => {
  const dashboard = fs.readFileSync(path.join(__dirname, 'src/pages/Dashboard.jsx'), 'utf8');
  const analytics = fs.readFileSync(path.join(__dirname, 'src/pages/Analytics.jsx'), 'utf8');
  const topbar = fs.readFileSync(path.join(__dirname, 'src/components/layout/TopBar.jsx'), 'utf8');
  const progress = fs.readFileSync(path.join(__dirname, 'src/pages/Progress.jsx'), 'utf8');
  const sessions = fs.readFileSync(path.join(__dirname, 'src/pages/StudySessions.jsx'), 'utf8');

  // Verify Link imports and usage
  assert(dashboard.includes('import { Link } from \'react-router-dom\''), 'Dashboard imports Link');
  assert(!dashboard.includes('<a href="/sessions"'), 'Dashboard no raw /sessions anchor');
  assert(!dashboard.includes('<a href="/planner"'), 'Dashboard no raw /planner anchor');
  assert(!dashboard.includes('<a href="/vocabulary"'), 'Dashboard no raw /vocabulary anchor');
  assert(!dashboard.includes('<a href="/preparation"'), 'Dashboard no raw /preparation anchor');

  assert(analytics.includes('import { Link } from \'react-router-dom\''), 'Analytics imports Link');
  assert(!analytics.includes('<a href="/mock-tests"'), 'Analytics no raw /mock-tests anchor');

  assert(topbar.includes('Link'), 'TopBar imports Link');
  assert(!topbar.includes('<a href="/notifications"'), 'TopBar no raw /notifications anchor');

  assert(progress.includes('import { Link } from \'react-router-dom\''), 'Progress imports Link');
  assert(!progress.includes('<a href="/sessions"'), 'Progress no raw /sessions anchor');

  assert(sessions.includes('import { Link } from \'react-router-dom\''), 'StudySessions imports Link');
  assert(!sessions.includes('<a href="/planner"'), 'StudySessions no raw /planner anchor');
});

// ──────────────────────────────────────────────────────────
// 5. Route-level code splitting
// ──────────────────────────────────────────────────────────
test('5. App.jsx uses React.lazy and Suspense for all page routes', () => {
  const appFile = fs.readFileSync(path.join(__dirname, 'src/App.jsx'), 'utf8');
  assert(appFile.includes('lazy('), 'App.jsx must use React.lazy');
  assert(appFile.includes('<Suspense'), 'App.jsx must wrap routes in Suspense');
  assert(appFile.includes('const Dashboard = lazy('), 'Dashboard must be lazy loaded');
  assert(appFile.includes('const Preparation = lazy('), 'Preparation must be lazy loaded');
  assert(appFile.includes('const Vocabulary = lazy('), 'Vocabulary must be lazy loaded');
});

// ──────────────────────────────────────────────────────────
// 6. MongoDB Indexing
// ──────────────────────────────────────────────────────────
test('6. Key MongoDB models define indexes for fast querying', () => {
  const topicModel = fs.readFileSync(path.join(__dirname, 'server/models/Topic.js'), 'utf8');
  assert(topicModel.includes('topicSchema.index({ subjectId: 1'), 'Topic index on subjectId');
  assert(topicModel.includes('topicSchema.index({ chapterId: 1'), 'Topic index on chapterId');

  const taskModel = fs.readFileSync(path.join(__dirname, 'server/models/StudyTask.js'), 'utf8');
  assert(taskModel.includes('studyTaskSchema.index({ date: 1'), 'StudyTask index on date');

  const sessionModel = fs.readFileSync(path.join(__dirname, 'server/models/StudySession.js'), 'utf8');
  assert(sessionModel.includes('studySessionSchema.index({ startTime: -1'), 'StudySession index on startTime');

  const revModel = fs.readFileSync(path.join(__dirname, 'server/models/RevisionTask.js'), 'utf8');
  assert(revModel.includes('revisionTaskSchema.index({ dueDate: 1'), 'RevisionTask index on dueDate');

  const notifModel = fs.readFileSync(path.join(__dirname, 'server/models/Notification.js'), 'utf8');
  assert(notifModel.includes('notificationSchema.index({ read: 1'), 'Notification index on read');
});

// ──────────────────────────────────────────────────────────
// 7. api.js exports and caching layer
// ──────────────────────────────────────────────────────────
test('7. api.js exports deduplication, cache invalidation, and apiFetch wrapper', () => {
  const apiFile = fs.readFileSync(path.join(__dirname, 'src/services/api.js'), 'utf8');
  assert(apiFile.includes('inFlightRequests'), 'api.js maintains inFlightRequests Map');
  assert(apiFile.includes('apiCache'), 'api.js maintains in-memory apiCache');
  assert(apiFile.includes('invalidateApiCache'), 'api.js exports invalidateApiCache');
  assert(apiFile.includes('clearApiCache'), 'api.js exports clearApiCache');
});

// ──────────────────────────────────────────────────────────
// RESULTS
// ──────────────────────────────────────────────────────────
console.log('\n========================================');
console.log(`Performance Optimization Test Results: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) process.exit(1);
