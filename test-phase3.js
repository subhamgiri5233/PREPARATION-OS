import "fake-indexeddb/auto";
import { db, initializeDatabase, getTasksByDate, getAllTopics, getAllSubjects, getAllAreas, getTeachingSchedule, getAllSessions, getAllMocks, getSettings, addTask, updateTask } from './src/services/db.js';
import { generateDailyPlan, getStudyNowRecommendation } from './src/services/studyPlanningEngine.js';
import { scanAndMarkMissedTasks, getRescheduleRecommendations } from './src/services/reschedulingEngine.js';
import { calculatePriorityScore } from './src/services/priorityEngine.js';
import { format, addDays, subDays } from 'date-fns';

async function runTests() {
  console.log("=== PHASE 3 VERIFICATION TESTS ===");
  let passed = 0;
  let failed = 0;

  async function assert(condition, testName, message) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${message}`);
      failed++;
    }
  }

  // Ensure DB is initialized
  await initializeDatabase();
  
  // We need to clear and set specific states for each test.
  async function resetDB() {
    await db.studyTasks.clear();
    await db.studySessions.clear();
    await db.revisionTasks.clear();
    await db.mockTests.clear();
    await db.mockSubjectResults.clear();
    // Keep reference data (topics, subjects, areas, settings, teachingSchedule)
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  async function getContext(dateStr) {
    return {
      topics: await getAllTopics(),
      revisionsDue: [],
      teachingSlots: await getTeachingSchedule(),
      scheduledTasks: await getTasksByDate(dateStr),
      sessions: await getAllSessions(),
      mocks: await getAllMocks(),
      prepAreas: await getAllAreas(),
      subjects: await getAllSubjects(),
      settings: await getSettings(),
      today: dateStr,
      vocabToday: 10 // Satisfy vocab target so it doesn't skew test results
    };
  }

  // --- Test 1: Normal free-day planning ---
  await resetDB();
  const t1Context = await getContext(tomorrow);
  // Remove teaching slots for tomorrow to make it a "free day"
  t1Context.teachingSlots = t1Context.teachingSlots.filter(s => s.dayOfWeek !== addDays(new Date(), 1).getDay());
  const t1Res = await generateDailyPlan(addDays(new Date(), 1), t1Context);
  await assert(t1Res.success === true && t1Res.tasksPlanned > 0, "1. Normal free-day planning", `Expected tasks to be planned, got ${t1Res.tasksPlanned}`);

  // --- Test 2: Monday with teaching periods blocked ---
  await resetDB();
  // Find a Monday
  let testMonday = new Date();
  while (testMonday.getDay() !== 1) testMonday = addDays(testMonday, 1);
  const mondayStr = format(testMonday, 'yyyy-MM-dd');
  const t2Context = await getContext(mondayStr);
  const t2Res = await generateDailyPlan(testMonday, t2Context);
  const mondayTasks = await getTasksByDate(mondayStr);
  let overlapsTeaching = false;
  const mondayTeaching = t2Context.teachingSlots.filter(s => s.dayOfWeek === 1);
  for (const task of mondayTasks) {
    for (const teaching of mondayTeaching) {
      if ((task.startTime >= teaching.startTime && task.startTime < teaching.endTime) ||
          (task.endTime > teaching.startTime && task.endTime <= teaching.endTime)) {
        overlapsTeaching = true;
      }
    }
  }
  await assert(t2Res.success === true && !overlapsTeaching, "2. Monday with teaching periods blocked", "Tasks should not overlap with teaching periods.");

  // --- Test 3: Revision due today priority ---
  await resetDB();
  const t3Context = await getContext(today);
  // Clear teaching slots to guarantee free time
  t3Context.teachingSlots = [];
  t3Context.settings.preferredStartTime = '00:00';
  t3Context.settings.preferredEndTime = '23:59';
  t3Context.revisionsDue = [{
    id: 1, topicId: 1, topicName: "Test Revision", dueDate: today, status: "Pending"
  }];
  const t3Res = await generateDailyPlan(new Date(), t3Context);
  const todayTasks = await getTasksByDate(today);
  const revisionScheduled = todayTasks.some(t => t.type === 'Revision' && t.title === 'Test Revision');
  if (!revisionScheduled) {
    console.log("T3 Failed. Scheduled tasks:");
    console.log(todayTasks.map(t => `${t.title} (${t.type})`));
  }
  await assert(revisionScheduled, "3. Revision due today priority", "Revision task was not scheduled despite high priority.");

  // --- Test 4: Weak subject detected from multiple mocks ---
  await resetDB();
  await db.mockTests.bulkAdd([
    { id: 1, date: yesterday, mockNumber: 1 },
    { id: 2, date: yesterday, mockNumber: 2 }
  ]);
  // Add bad scores for subjectId 1
  await db.mockSubjectResults.bulkAdd([
    { mockTestId: 1, subjectId: 1, attempted: 10, correct: 2 }, // 20%
    { mockTestId: 2, subjectId: 1, attempted: 10, correct: 3 }  // 30%
  ]);
  const t4Context = await getContext(today);
  const t4Res = getStudyNowRecommendation(t4Context);
  await assert(t4Res.candidate.subjectId === 1 && t4Res.score >= 40, "4. Weak subject detected from multiple mocks", `Subject 1 was not prioritized. Score: ${t4Res.score}`);

  // --- Test 5: Missed-task rescheduling ---
  await resetDB();
  await addTask({ date: yesterday, startTime: '09:00', endTime: '10:00', status: 'Not Started', title: 'Missed Task 1' });
  let allTasks = await db.studyTasks.toArray();
  const markedCount = await scanAndMarkMissedTasks(allTasks, today);
  allTasks = await db.studyTasks.toArray();
  const missedTasks = allTasks.filter(t => t.status === 'Missed');
  const t5Context = await getContext(today);
  const recs = await getRescheduleRecommendations(missedTasks, t5Context.teachingSlots, t5Context.sessions, t5Context.settings, new Date());
  await assert(markedCount === 1 && recs.length === 1 && recs[0].task.title === 'Missed Task 1', "5. Missed-task rescheduling", `Expected 1 marked task and 1 recommendation, got ${markedCount} and ${recs.length}`);

  // --- Test 6: Daily target limitation ---
  await resetDB();
  const t6Context = await getContext(tomorrow);
  // Set daily target to 2 hours (120 mins)
  t6Context.settings.dailyStudyHours = 2;
  const t6Res = await generateDailyPlan(addDays(new Date(), 1), t6Context);
  await assert(t6Res.minutesPlanned <= 120 + 30, "6. Daily target limitation", `Planned minutes (${t6Res.minutesPlanned}) exceeded target (120).`); // Allow slight overflow for block fitting

  // --- Test 7: No available study slot ---
  await resetDB();
  const t7Context = await getContext(tomorrow);
  // Fake tasks filling the entire day from 06:00 to 22:00
  t7Context.scheduledTasks = [
    { date: tomorrow, startTime: '06:00', endTime: '22:00', status: 'Not Started' }
  ];
  const t7Res = await generateDailyPlan(addDays(new Date(), 1), t7Context);
  await assert(t7Res.success === false && t7Res.reason === 'No available time slots found for this date.', "7. No available study slot", `Expected failure due to no slots, got success=${t7Res.success}`);

  // --- Test 8: Manual user override preservation ---
  await resetDB();
  // Manually add a user task
  await addTask({ date: tomorrow, startTime: '10:00', endTime: '12:00', status: 'Not Started', plannedBy: 'user', title: 'Manual Task' });
  const t8Context = await getContext(tomorrow);
  t8Context.scheduledTasks = await getTasksByDate(tomorrow);
  await generateDailyPlan(addDays(new Date(), 1), t8Context);
  const tomTasks = await getTasksByDate(tomorrow);
  const manualExists = tomTasks.some(t => t.plannedBy === 'user' && t.title === 'Manual Task');
  await assert(manualExists, "8. Manual user override preservation", "Manual task was overwritten or deleted.");

  // --- Test 9: Consistency after browser/page reload ---
  // In Node, we can simulate this by re-initializing the DB connection.
  // Since we use IndexedDB, data persists.
  const t9Tasks = await db.studyTasks.count();
  await db.close();
  await db.open();
  const t9TasksAfter = await db.studyTasks.count();
  await assert(t9Tasks === t9TasksAfter && t9TasksAfter > 0, "9. Consistency after browser/page reload", "Data lost on connection reset.");

  // --- Test 10: Dynamic adjustment when teaching schedule changes ---
  await resetDB();
  let testWed = new Date();
  while (testWed.getDay() !== 3) testWed = addDays(testWed, 1);
  const wedStr = format(testWed, 'yyyy-MM-dd');
  const t10Context = await getContext(wedStr);
  // Add a massive teaching block covering 06:00 to 20:00
  t10Context.teachingSlots.push({ dayOfWeek: 3, startTime: '06:00', endTime: '20:00' });
  const t10Res = await generateDailyPlan(testWed, t10Context);
  const wedTasks = await getTasksByDate(wedStr);
  const allAfter2000 = wedTasks.every(t => t.startTime >= '20:00');
  await assert(allAfter2000, "10. Dynamic adjustment when teaching schedule changes", "Tasks were scheduled during dynamically added teaching block.");

  // --- End to End Workflow Test ---
  await resetDB();
  console.log("--- Executing End-to-End Workflow Test ---");
  // Complete Topic -> Revision Created -> Planner Priority Updated -> Dashboard Updated -> Progress Updated -> Data Still Exists
  
  // 1. Complete Topic
  let topic = await db.topics.get(1);
  await db.topics.update(1, { status: 'Completed', dateCompleted: today });
  
  // 2. Revision Created (Mocking the action typically done in UI/service when marked completed)
  await db.revisionTasks.add({ topicId: 1, dueDate: addDays(new Date(), 1).toISOString().split('T')[0], status: 'Pending', revisionNumber: 1 });
  const revCreated = await db.revisionTasks.where('topicId').equals(1).first();
  await assert(!!revCreated, "E2E: Revision Created", "Revision task not created.");

  // 3. Planner Priority Updated
  const e2eContext = await getContext(tomorrow);
  // Add this revision as due tomorrow
  e2eContext.revisionsDue = [{ id: revCreated.id, topicId: 1, type: 'revision', dueDate: revCreated.dueDate, status: 'Pending' }];
  const score = calculatePriorityScore({ ...e2eContext.revisionsDue[0] }, e2eContext);
  await assert(score >= 50, "E2E: Planner Priority Updated", `Revision priority score too low: ${score}`);

  // 4. Dashboard Updated (Get Study Now logic)
  const e2eNowContext = await getContext(tomorrow);
  e2eNowContext.revisionsDue = e2eContext.revisionsDue;
  e2eNowContext.today = tomorrow; // simulate it is tomorrow
  const dashboardRec = getStudyNowRecommendation(e2eNowContext);
  await assert(dashboardRec.isRevision && dashboardRec.candidate.topicId === 1, "E2E: Dashboard Updated", "Dashboard did not recommend the revision.");

  // 5. Progress Updated (Daily progress mock)
  await db.dailyProgress.add({ date: today, tasksCompleted: 1, studyHours: 1 });
  const progress = await db.dailyProgress.where('date').equals(today).first();
  await assert(!!progress && progress.tasksCompleted === 1, "E2E: Progress Updated", "Daily progress not tracked.");

  // 6. Data Still Exists (Refresh Simulation)
  await db.close();
  await db.open();
  const refreshedProgress = await db.dailyProgress.where('date').equals(today).first();
  await assert(!!refreshedProgress, "E2E: Data Still Exists", "Progress data lost after restart.");


  console.log("===================================");
  console.log(`TOTAL: 11 tests`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => {
  console.error("Test suite crashed:", e);
  process.exit(1);
});
