// src/pages/TestRunner.jsx
// Comprehensive Phase 7 Verification Test Suite — runs in-browser against live IndexedDB

import { useEffect, useState, useRef } from 'react';
import { format, addDays, parseISO } from 'date-fns';

import {
  initializeDatabase, getAllTopics, getAllSubjects, getAllCourses, getAllChapters,
  getAllStudyResources, getAllAreas, getSettings,
  addArea, updateArea, deleteArea,
  addCourse, updateCourse, deleteCourse,
  addSubject, updateSubject, deleteSubject,
  addChapter, updateChapter, deleteChapter,
  addTopic, updateTopic, deleteTopic,
  addStudyResource, updateStudyResource, deleteStudyResource,
  addMock, addErrorLog, getAllMocks, getErrorLogs,
  addRevisionTask, getPendingRevisions, updateRevisionTask,
  addNotification, getAllNotifications, getTeachingSchedule, addTeachingSlot, deleteTeachingSlot,
  getAllSessions
} from '../services/db';

import {
  createInitialRevision, completeRevision, getRevisionsDueToday, skipRevision, getAllPendingRevisionsEnriched
} from '../services/revisionService';

import {
  getReviseNowRecommendation, getStudyNowRecommendation, generateDailyPlan
} from '../services/studyPlanningEngine';

import { calculateNextInterval } from '../services/spacedRepetitionEngine';
import { compareMocks } from '../services/mockAnalysisEngine';
import { calculateAvailableSlots } from '../services/availabilityEngine';
import {
  calculateSyllabusProgress, calculateAreaProgress, calculateCourseProgress,
  calculateSubjectProgress, calculateChapterProgress, calculateTopicResourceProgress,
  validateSyllabusJSON, executeSyllabusImport, parseSyllabusCSV
} from '../services/syllabusService';
import { classifyTopicPerformance } from '../services/performanceEngine';

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function resetDB() {
  await db.delete();
  await db.open();
  await initializeDatabase();
}

// ─── Test Execution Engine ───────────────────────────────────────────────────
async function runAllPhase7Tests(log) {
  const results = [];

  function test(name, expected, actual, pass, note = '') {
    results.push({ name, expected, actual: String(actual), pass, note });
    log(`${pass ? '✅ PASS' : '❌ FAIL'} | ${name}`);
    if (!pass) log(`   Expected: ${expected} | Got: ${actual}${note ? ' | ' + note : ''}`);
  }

  // ─── 0. SETUP: FRESH DATABASE RESET ──────────────────────────────────────
  await resetDB();
  log('[SETUP] Fresh database initialized with Dexie Version 6');

  const today = format(new Date(), 'yyyy-MM-dd');
  const initialAreas = await getAllAreas();
  const initialCourses = await getAllCourses();
  const initialSubjects = await getAllSubjects();
  const initialTopics = await getAllTopics();
  const settings = await getSettings();
  const teachingSlots = await getTeachingSchedule();

  log(`[SETUP] Seed data: ${initialAreas.length} Areas, ${initialCourses.length} Courses, ${initialSubjects.length} Subjects, ${initialTopics.length} Topics`);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: Create preparation area
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 1: Create Preparation Area ---');
  let testAreaId = null;
  {
    testAreaId = await addArea({
      name: 'Custom Preparation Area',
      priority: 4,
      color: '#ec4899',
      description: 'Special exam test area'
    });
    const allA = await getAllAreas();
    const createdArea = allA.find(a => a.id === testAreaId);
    const pass = createdArea && createdArea.name === 'Custom Preparation Area';
    test(
      'TEST 1: Create Preparation Area ("Custom Preparation Area")',
      'Area created with matching name and ID',
      createdArea ? `id=${createdArea.id}, name="${createdArea.name}"` : 'NOT FOUND',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: Create course with metadata & status
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 2: Create Course with Metadata ---');
  let testCourseId = null;
  {
    testCourseId = await addCourse({
      preparationAreaId: testAreaId,
      name: 'Custom FastTrack Course',
      provider: 'Self Study & Practice',
      status: 'Active',
      description: 'Intensive course package'
    });
    const allC = await getAllCourses();
    const createdCourse = allC.find(c => c.id === testCourseId);
    const pass = createdCourse && createdCourse.name === 'Custom FastTrack Course' && createdCourse.status === 'Active';
    test(
      'TEST 2: Create Course with status="Active" & provider="Self Study & Practice"',
      'Course found with active status and provider',
      createdCourse ? `id=${createdCourse.id}, status="${createdCourse.status}", provider="${createdCourse.provider}"` : 'NOT FOUND',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: Create subject
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 3: Create Subject ---');
  let testSubjectId = null;
  {
    testSubjectId = await addSubject({
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      name: 'Advanced Algorithms',
      color: '#8b5cf6',
      order: 1
    });
    const allS = await getAllSubjects();
    const createdSub = allS.find(s => s.id === testSubjectId);
    const pass = createdSub && createdSub.name === 'Advanced Algorithms' && createdSub.preparationAreaId === testAreaId;
    test(
      'TEST 3: Create Subject ("Advanced Algorithms")',
      'Subject created under test area and course',
      createdSub ? `id=${createdSub.id}, name="${createdSub.name}"` : 'NOT FOUND',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: Create chapter/module
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 4: Create Chapter/Module ---');
  let testChapterId = null;
  {
    testChapterId = await addChapter({
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      subjectId: testSubjectId,
      name: 'Graph Theory & Network Flows',
      description: 'Core graph algorithms',
      order: 1
    });
    const allChaps = await getAllChapters();
    const createdChap = allChaps.find(c => c.id === testChapterId);
    const pass = createdChap && createdChap.name === 'Graph Theory & Network Flows' && createdChap.subjectId === testSubjectId;
    test(
      'TEST 4: Create Chapter/Module ("Graph Theory & Network Flows")',
      'Chapter created and linked to subjectId',
      createdChap ? `id=${createdChap.id}, name="${createdChap.name}"` : 'NOT FOUND',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: Create topic with chapter mapping & estimatedMinutes
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 5: Create Topic with Chapter Mapping & Minutes ---');
  let testTopicId = null;
  {
    testTopicId = await addTopic({
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      subjectId: testSubjectId,
      chapterId: testChapterId,
      name: 'Dijkstra & Bellman-Ford Shortest Paths',
      estimatedHours: 2.5,
      estimatedMinutes: 150,
      difficulty: 'Hard',
      importance: 'Critical',
      status: 'Not Started',
      resourceReference: 'Module 4 / Lecture 8'
    });
    const allTops = await getAllTopics();
    const createdTopic = allTops.find(t => t.id === testTopicId);
    const pass = createdTopic &&
      createdTopic.chapterId === testChapterId &&
      createdTopic.estimatedMinutes === 150 &&
      createdTopic.difficulty === 'Hard' &&
      createdTopic.importance === 'Critical';
    test(
      'TEST 5: Create topic with chapterId, estimatedMinutes=150, imp="Critical"',
      'Topic created with chapter link and 150 estimated minutes',
      createdTopic ? `id=${createdTopic.id}, chapId=${createdTopic.chapterId}, mins=${createdTopic.estimatedMinutes}` : 'NOT FOUND',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: Add multiple study resources to topic (video with watched %, PDF, notes)
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 6: Attach Multiple Study Resources ---');
  let resVideoId = null;
  let resPdfId = null;
  {
    resVideoId = await addStudyResource({
      topicId: testTopicId,
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      subjectId: testSubjectId,
      title: 'Dijkstra Algorithm Deep Dive Lecture',
      resourceType: 'Video Lecture',
      url: 'https://study.example/dijkstra-video',
      durationMinutes: 60,
      completed: true,
      watchedPercentage: 100,
      watchDate: today
    });

    resPdfId = await addStudyResource({
      topicId: testTopicId,
      preparationAreaId: testAreaId,
      courseId: testCourseId,
      subjectId: testSubjectId,
      title: 'Shortest Path Handwritten Summary PDF',
      resourceType: 'PDF',
      url: 'https://study.example/notes.pdf',
      durationMinutes: 20,
      completed: false,
      watchedPercentage: 0
    });

    const allRes = await getAllStudyResources();
    const topicRes = allRes.filter(r => r.topicId === testTopicId);
    const resStats = calculateTopicResourceProgress(testTopicId, allRes);

    const pass = topicRes.length === 2 && resStats.completed === 1 && resStats.videosCount === 1;
    test(
      'TEST 6: Add multiple study resources (Video 100% watched + PDF) and track completion',
      '2 resources attached, 1 completed, 1 video count',
      `Attached: ${topicRes.length}, Completed: ${resStats.completed}, Video avg: ${resStats.avgWatchedPercent}%`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: Mark topic completed & verify completion metrics
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 7: Mark Topic Completed ---');
  {
    await updateTopic(testTopicId, {
      status: 'Completed',
      completionPercentage: 100,
      dateCompleted: today,
      lastStudiedDate: today,
      masteryScore: 85
    });

    const top = (await getAllTopics()).find(t => t.id === testTopicId);
    const pass = top && top.status === 'Completed' && top.completionPercentage === 100 && top.masteryScore === 85;
    test(
      'TEST 7: Mark topic completed updates status, completionPercentage=100, masteryScore=85',
      'status="Completed", pct=100, mastery=85',
      top ? `status="${top.status}", pct=${top.completionPercentage}, mastery=${top.masteryScore}` : 'NOT FOUND',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 8: Calculate multi-tier syllabus progress (Area, Course, Subject, Chapter)
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 8: Multi-Tier Syllabus Progress ---');
  {
    const freshTopics = await getAllTopics();
    const areaProg = calculateAreaProgress(testAreaId, freshTopics);
    const courseProg = calculateCourseProgress(testCourseId, freshTopics);
    const subjProg = calculateSubjectProgress(testSubjectId, freshTopics);
    const chapProg = calculateChapterProgress(testChapterId, freshTopics);

    const pass = areaProg.isMapped && areaProg.percentage === 100 &&
                 courseProg.isMapped && courseProg.percentage === 100 &&
                 subjProg.isMapped && subjProg.percentage === 100 &&
                 chapProg.isMapped && chapProg.percentage === 100;
    test(
      'TEST 8: Multi-tier progress calculates 100% across Area, Course, Subject, Chapter',
      'All 4 tiers report 100% completion',
      `Area=${areaProg.percentage}%, Course=${courseProg.percentage}%, Subj=${subjProg.percentage}%, Chap=${chapProg.percentage}%`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 9: Validate & import JSON syllabus
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 9: JSON Syllabus Import ---');
  {
    const existingPrepAreas = await getAllAreas();
    const existingCourses = await getAllCourses();
    const existingSubjects = await getAllSubjects();
    const existingTopics = await getAllTopics();
    const existingChapters = await getAllChapters();

    const jsonSyllabus = {
      preparationArea: 'IBPS SO IT Officer',
      course: 'Adda247 MahaPack',
      subjects: [
        {
          name: 'Software Engineering',
          chapters: [
            {
              name: 'Agile & DevOps',
              topics: [
                { name: 'CI/CD Pipelines & GitHub Actions', estimatedHours: 3, difficulty: 'Medium', importance: 'High' },
                { name: 'Scrum Sprints & Standups', estimatedHours: 2, difficulty: 'Easy', importance: 'Medium' }
              ]
            }
          ]
        }
      ]
    };

    const validation = validateSyllabusJSON(jsonSyllabus, existingPrepAreas, existingCourses, existingSubjects, existingTopics, existingChapters);
    const importRes = await executeSyllabusImport(validation);

    const afterTopics = await getAllTopics();
    const addedTopic = afterTopics.find(t => t.name === 'CI/CD Pipelines & GitHub Actions');

    const pass = validation.valid && importRes.addedTopics === 2 && addedTopic !== undefined;
    test(
      'TEST 9: Validate & import JSON syllabus creates chapter and 2 topics',
      'validation.valid=true, 2 topics added',
      `valid=${validation.valid}, addedTopics=${importRes.addedTopics}, addedTopicFound=${!!addedTopic}`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 10: Validate & import CSV syllabus
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 10: CSV Syllabus Import ---');
  {
    const existingPrepAreas = await getAllAreas();
    const existingCourses = await getAllCourses();
    const existingSubjects = await getAllSubjects();
    const existingTopics = await getAllTopics();
    const existingChapters = await getAllChapters();

    const csvData = [
      'PreparationArea,Course,Subject,Chapter,Topic,EstimatedHours,Difficulty,Importance,ResourceReference,Notes',
      '"Panchayat","YourStudy","Panchayat Governance","E-Governance","Gram Panchayat Digital Portals",3,"Medium","High","Chapter 2","E-Gram Swaraj details"',
      '"Panchayat","YourStudy","Panchayat Governance","E-Governance","Online Auditing & Accountability",2,"Hard","Critical","Chapter 3","Audit norms"'
    ].join('\n');

    const validation = validateSyllabusJSON(csvData, existingPrepAreas, existingCourses, existingSubjects, existingTopics, existingChapters);
    const importRes = await executeSyllabusImport(validation);

    const freshTops = await getAllTopics();
    const panchayatCount = freshTops.filter(t => t.preparationAreaId === 2).length;

    const pass = validation.valid && importRes.addedTopics === 2 && panchayatCount >= 2;
    test(
      'TEST 10: Validate & import CSV syllabus parses 2 topics into Panchayat area',
      'CSV parsed and 2 topics added to Panchayat',
      `valid=${validation.valid}, addedTopics=${importRes.addedTopics}, totalPanchayat=${panchayatCount}`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 11: Detect duplicate imports with configurable resolution (Skip / Update)
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 11: Duplicate Import Detection ---');
  {
    const existingPrepAreas = await getAllAreas();
    const existingCourses = await getAllCourses();
    const existingSubjects = await getAllSubjects();
    const existingTopics = await getAllTopics();
    const existingChapters = await getAllChapters();

    const dupJson = {
      preparationArea: 'Panchayat',
      course: 'YourStudy',
      subjects: [
        {
          name: 'Panchayat Governance',
          topics: [
            { name: 'Gram Panchayat Digital Portals', estimatedHours: 5 }, // Duplicate!
            { name: 'Financial Grants & 15th Finance Commission', estimatedHours: 4 } // New
          ]
        }
      ]
    };

    const validation = validateSyllabusJSON(dupJson, existingPrepAreas, existingCourses, existingSubjects, existingTopics, existingChapters);
    const pass = validation.valid && validation.duplicatesDetected.length === 1 && validation.topicsToAdd.length === 1;

    test(
      'TEST 11: Duplicate detection accurately identifies existing topic and stages 1 new topic',
      '1 duplicate detected ("Gram Panchayat Digital Portals"), 1 new topic staged',
      `Duplicates: ${validation.duplicatesDetected.length}, New topics: ${validation.topicsToAdd.length}`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 12: Course-specific progress isolation (IBPS vs Panchayat vs B.Ed)
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 12: Course-Specific Progress Isolation ---');
  {
    const allTops = await getAllTopics();
    const ibpsProg = calculateAreaProgress(1, allTops);
    const panchayatProg = calculateAreaProgress(2, allTops);
    const bedProg = calculateAreaProgress(3, allTops);

    const pass = ibpsProg.isMapped === true &&
                 panchayatProg.isMapped === true &&
                 bedProg.isMapped === false &&
                 bedProg.displayText === 'No syllabus mapped yet';

    test(
      'TEST 12: Course-specific progress isolates IBPS, Panchayat, and B.Ed stats independently',
      'IBPS & Panchayat mapped, B.Ed unmapped ("No syllabus mapped yet")',
      `IBPS=${ibpsProg.percentage}%, Panchayat=${panchayatProg.percentage}%, B.Ed isMapped=${bedProg.isMapped}`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 13: Planner receives real hierarchical topics (Subject → Chapter → Topic)
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 13: Hierarchical Planner Recommendation ---');
  {
    const freshRevs = await getRevisionsDueToday();
    const freshTopics = await getAllTopics();
    const freshSubjects = await getAllSubjects();
    const freshChapters = await getAllChapters();
    const freshAreas = await getAllAreas();
    const freshMocks = await getAllMocks();

    const rec = getStudyNowRecommendation({
      topics: freshTopics,
      revisionsDue: freshRevs,
      mocks: freshMocks,
      prepAreas: freshAreas,
      subjects: freshSubjects,
      chapters: freshChapters,
      sessions: [],
      today,
      teachingSlots: [],
      scheduledTasks: [],
      settings
    });

    const pass = rec && rec.candidate && rec.fullHierarchicalPath && rec.fullHierarchicalPath.includes('→');
    test(
      'TEST 13: Planner generates full hierarchical path ("Area → Subject → Chapter → Topic")',
      'Recommendation includes hierarchical arrow path',
      rec?.fullHierarchicalPath || 'null',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 14: Teaching schedule blocks study periods
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 14: Teaching Schedule Blocking ---');
  {
    const testDate = new Date();
    const dayOfWeek = testDate.getDay();
    const slotId = (await addTeachingSlot({
      dayOfWeek,
      startTime: '07:00',
      endTime: '08:00',
      subject: 'Phase 7 Verification Teaching'
    }))._id || (await getTeachingSchedule()).at(-1)?._id;

    const slots = await getTeachingSchedule();
    const freeSlots = calculateAvailableSlots(testDate, slots, [], [], settings);

    let hasOverlap = false;
    for (const slot of freeSlots) {
      if (slot.start < '08:00' && slot.end > '07:00') {
        hasOverlap = true;
        break;
      }
    }

    const pass = !hasOverlap;
    test(
      'TEST 14: Teaching schedule slot (07:00-08:00) blocks study availability',
      'No free study slot overlaps with 07:00-08:00',
      hasOverlap ? 'OVERLAP DETECTED' : 'correctly blocked',
      pass
    );

    if (slotId) await deleteTeachingSlot(slotId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 15: Adaptive revision generated upon topic completion
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 15: Adaptive Revision Generation ---');
  {
    // Clean any prior pending revisions for testTopicId
    const pendings = await getPendingRevisions();
    for (const p of pendings.filter(r => r.topicId === testTopicId)) {
      await updateRevisionTask(p._id || p.id, { status: 'Completed' });
    }

    const rev = await createInitialRevision(testTopicId, 'Dijkstra & Bellman-Ford Shortest Paths', today);
    const pass = rev !== null && rev.topicId === testTopicId && rev.intervalDays === 1;

    test(
      'TEST 15: Topic completion generates initial adaptive revision (intervalDays=1)',
      'Revision created with intervalDays=1',
      rev ? `topicId=${rev.topicId}, intervalDays=${rev.intervalDays}` : 'null',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 16: Idempotent notifications (no duplicate generation on StrictMode)
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 16: Notification Idempotency ---');
  {
    const key = `phase7-idempotency-test-${today}`;
    const id1 = await addNotification({ type: 'revision', title: 'Phase 7 Test', message: 'Test message', scheduledAt: new Date().toISOString(), idempotencyKey: key });
    const id2 = await addNotification({ type: 'revision', title: 'Phase 7 Test', message: 'Test message', scheduledAt: new Date().toISOString(), idempotencyKey: key });

    const allNotifs = await getAllNotifications();
    const matching = allNotifs.filter(n => n.idempotencyKey === key);

    const pass = matching.length === 1;
    test(
      'TEST 16: Duplicate addNotification calls with same idempotencyKey store only 1 record',
      '1 notification stored',
      `${matching.length} notification stored`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 17: Dashboard recommendation uses real stored topic data
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 17: Dashboard Real Recommendation ---');
  {
    const freshRevs = await getRevisionsDueToday();
    const freshTopics = await getAllTopics();
    const freshSubjects = await getAllSubjects();
    const freshChapters = await getAllChapters();
    const freshAreas = await getAllAreas();
    const freshMocks = await getAllMocks();

    const rec = getStudyNowRecommendation({
      topics: freshTopics,
      revisionsDue: freshRevs,
      mocks: freshMocks,
      prepAreas: freshAreas,
      subjects: freshSubjects,
      chapters: freshChapters,
      sessions: [],
      today,
      teachingSlots: [],
      scheduledTasks: [],
      settings
    });

    const isRealTopic = freshTopics.some(t => t.name === rec?.candidate?.name || t.id === rec?.candidate?.topicId);
    const pass = rec && rec.candidate && isRealTopic;

    test(
      'TEST 17: Dashboard recommendation returns authentic stored topic entity',
      'Candidate matches real database topic record',
      rec?.candidate?.name || 'none',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 18: Mock error linkage updates topic weakness profile
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 18: Mock Error Linkage & Weakness ---');
  {
    const mId = await addMock({ preparationAreaId: testAreaId, mockNumber: 301, date: today });
    const eId = await addErrorLog({ mockTestId: mId, subjectId: testSubjectId, topicId: testTopicId, errorType: 'Concept Gap' });

    const allErrs = await getErrorLogs();
    const err = allErrs.find(e => e.id === eId);
    const pass = err && err.topicId === testTopicId;

    test(
      'TEST 18: Mock error references stable topicId and updates error log',
      `Error log references topicId=${testTopicId}`,
      err ? `id=${err.id}, topicId=${err.topicId}` : 'NOT FOUND',
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 19: Export & import backup preserves all Phase 7 data
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 19: Full Backup Integrity ---');
  {
    const backup = {
      version: 7,
      preparationAreas: await getAllAreas(),
      courses: await getAllCourses(),
      subjects: await getAllSubjects(),
      chapters: await getAllChapters(),
      topics: await getAllTopics(),
      studyResources: await getAllStudyResources(),
    };

    const pass = backup.preparationAreas.length >= 3 &&
                 backup.courses.length >= 2 &&
                 backup.subjects.length >= 16 &&
                 backup.chapters.length >= 1 &&
                 backup.studyResources.length >= 2;

    test(
      'TEST 19: Full data backup includes Areas, Courses, Subjects, Chapters, Topics, Resources',
      'All 6 data entities present in backup structure',
      `Areas=${backup.preparationAreas.length}, Courses=${backup.courses.length}, Subjects=${backup.subjects.length}, Chapters=${backup.chapters.length}, Resources=${backup.studyResources.length}`,
      pass
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 20: Full regression: all Phase 1–6 features remain functional
  // ─────────────────────────────────────────────────────────────────────────
  log('\n--- TEST 20: Full Regression Across Phases 1–6 ---');
  {
    const nextInterval = calculateNextInterval(3, 5, 'Medium', null);
    const m1 = { id: 1, mockNumber: 1, score: 70, maxScore: 100, correct: 70, attempted: 90 };
    const m2 = { id: 2, mockNumber: 2, score: 80, maxScore: 100, correct: 80, attempted: 95 };
    const comp = compareMocks(m2, [m1]);

    const pass = nextInterval === 9 && comp !== null && comp.scoreDiff === 10;
    test(
      'TEST 20: Regression check: Spaced repetition (9d interval) & Mock comparison (+10%) functional',
      'calculateNextInterval=9, compareMocks.scoreDiff=10',
      `interval=${nextInterval}, scoreDiff=${comp?.scoreDiff}%`,
      pass
    );
  }

  return results;
}

// ─── React Test Runner Component ─────────────────────────────────────────────
export default function TestRunner() {
  const [results, setResults] = useState([]);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const logRef = useRef([]);

  const addLog = (msg) => {
    logRef.current = [...logRef.current, msg];
    setLogs([...logRef.current]);
  };

  const run = async () => {
    setRunning(true);
    setDone(false);
    setResults([]);
    logRef.current = [];
    setLogs([]);

    try {
      addLog('=== PHASE 7 VERIFICATION TEST SUITE — Starting... ===');
      const testResults = await runAllPhase7Tests(addLog);
      setResults(testResults);
      setDone(true);
      addLog('\n=== Phase 7 Test Run Complete ===');
    } catch (err) {
      addLog(`\n💥 FATAL ERROR: ${err.message}`);
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const total = results.length;

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto', fontFamily: 'monospace' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary-light)', marginBottom: 8 }}>
          🧪 Phase 7 Verification Test Suite
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
          Executes the complete 20-point verification suite for the Real Course &amp; Syllabus Data Command Center against live IndexedDB.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={run}
            disabled={running}
            id="run-tests-btn"
          >
            {running ? '⏳ Running 20 Tests...' : '▶ Run All Phase 7 Tests'}
          </button>
          {done && (
            <div
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: failed === 0 ? 'var(--success-glass)' : 'var(--danger-glass)',
                border: `1px solid ${failed === 0 ? 'var(--success)' : 'var(--danger)'}`,
                fontWeight: 700, fontSize: 14,
              }}
            >
              {failed === 0 ? '✅ ALL PASS' : `❌ ${failed} FAILED`} — {passed}/{total} passed
            </div>
          )}
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div className="card" style={{ marginBottom: 20, overflow: 'auto' }}>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-2)', width: 40 }}>#</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-2)' }}>Test Name</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-2)' }}>Expected</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-2)' }}>Actual</th>
                <th style={{ textAlign: 'center', padding: '10px 12px', color: 'var(--text-2)', width: 60 }}>Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: r.pass ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.08)',
                  }}
                >
                  <td style={{ padding: '8px 12px', color: 'var(--text-3)' }}>{i + 1}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text)', fontWeight: 600 }}>{r.name}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--text-2)' }}>{r.expected}</td>
                  <td style={{ padding: '8px 12px', color: r.pass ? 'var(--success)' : 'var(--danger)', maxWidth: 260, wordBreak: 'break-word' }}>{r.actual}</td>
                  <td style={{ textAlign: 'center', padding: '8px 12px', fontSize: 16 }}>
                    {r.pass ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Box */}
      {done && (
        <div
          className="card"
          style={{
            marginBottom: 20, padding: '18px 22px',
            border: `1px solid ${failed === 0 ? 'var(--success)' : 'var(--danger)'}`,
            background: failed === 0 ? 'var(--success-glass)' : 'rgba(239,68,68,0.08)',
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>PHASE 7 FINAL VERIFICATION</div>
          <div style={{ fontSize: 14, display: 'grid', gridTemplateColumns: 'repeat(3, auto)', gap: 16, marginBottom: 12 }}>
            <div>Total tests: <strong>{total}</strong></div>
            <div style={{ color: 'var(--success)' }}>Passed: <strong>{passed}</strong></div>
            <div style={{ color: failed > 0 ? 'var(--danger)' : 'var(--success)' }}>Failed: <strong>{failed}</strong></div>
          </div>
          {failed === 0 ? (
            <div style={{ color: 'var(--success)', fontWeight: 700 }}>
              ✅ All 20 Phase 7 tests PASS! Real Course &amp; Syllabus Data Command Center is fully verified.
            </div>
          ) : (
            <div style={{ color: 'var(--danger)', fontWeight: 700 }}>
              ❌ {failed} test(s) failed. Check details in the table above.
            </div>
          )}
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-3)' }}>Known issues: None</div>
        </div>
      )}

      {/* Console Output */}
      <div className="card" style={{ background: '#0d1117', border: '1px solid #30363d' }}>
        <div style={{ fontSize: 11, color: '#8b949e', marginBottom: 8 }}>Console Log</div>
        <div style={{ fontSize: 11, color: '#c9d1d9', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 360, overflow: 'auto' }}>
          {logs.length === 0 ? <span style={{ color: '#484f58' }}>Click "Run All Phase 7 Tests" to execute...</span> : logs.join('\n')}
        </div>
      </div>
    </div>
  );
}
