// src/services/syllabusService.js
// Progress calculation, 5-tier course/chapter/topic hierarchy helpers, study resource tracking, and JSON/CSV import engine

import { addSubject, addTopic, addCourse, addChapter, addStudyResource, updateTopic, getAllSubjects, getAllChapters, getAllCourses } from './db.js';

/**
 * Calculates progress metrics for a collection of topics.
 * Returns breakdown across: Completed, Learning, Revision Due, Weak, Mastered, Not Started.
 * Distinguishes between "mapped with 0% completion" and "unmapped" (0 topics).
 */
export function calculateSyllabusProgress(topics = [], todayStr = new Date().toISOString().slice(0, 10)) {
  const total = topics.length;
  if (total === 0) {
    return {
      total: 0,
      completed: 0,
      learning: 0,
      inProgress: 0,
      revisionDue: 0,
      weak: 0,
      mastered: 0,
      notStarted: 0,
      onHold: 0,
      remaining: 0,
      percentage: 0,
      isMapped: false,
      displayText: 'No syllabus mapped yet',
    };
  }

  const completed = topics.filter(
    (t) => t.status === 'Completed' || t.status === 'Mastered' || (t.completionPercentage || t.completionPercent) === 100
  ).length;

  const mastered = topics.filter(
    (t) => t.status === 'Mastered' || (t.masteryScore && t.masteryScore >= 90)
  ).length;

  const learning = topics.filter(
    (t) => t.status === 'In Progress' || t.status === 'Learning'
  ).length;

  const revisionDue = topics.filter(
    (t) => t.status === 'Revision Due' || (t.nextRevisionDate && t.nextRevisionDate <= todayStr)
  ).length;

  const weak = topics.filter(
    (t) => t.status === 'Weak' || (t.difficulty === 'Very Hard' && t.status !== 'Completed')
  ).length;

  const onHold = topics.filter((t) => t.status === 'On Hold').length;
  const notStarted = topics.filter((t) => !t.status || t.status === 'Not Started').length;

  const percentage = Math.round((completed / total) * 100);

  return {
    total,
    completed,
    learning,
    inProgress: learning,
    revisionDue,
    weak,
    mastered,
    notStarted,
    onHold,
    remaining: total - completed,
    percentage,
    isMapped: true,
    displayText: `${completed}/${total} topics (${percentage}%)`,
  };
}

/**
 * Calculates progress for a specific preparation area.
 */
export function calculateAreaProgress(areaId, allTopics = []) {
  const areaTopics = allTopics.filter((t) => String(t.preparationAreaId) === String(areaId));
  return calculateSyllabusProgress(areaTopics);
}

/**
 * Calculates progress for a specific course.
 */
export function calculateCourseProgress(courseId, allTopics = []) {
  const courseTopics = allTopics.filter((t) => String(t.courseId) === String(courseId));
  return calculateSyllabusProgress(courseTopics);
}

/**
 * Calculates progress for a specific subject.
 */
export function calculateSubjectProgress(subjectId, allTopics = []) {
  const subTopics = allTopics.filter((t) => String(t.subjectId) === String(subjectId));
  return calculateSyllabusProgress(subTopics);
}

/**
 * Calculates progress for a specific chapter/module.
 */
export function calculateChapterProgress(chapterId, allTopics = []) {
  const chapTopics = allTopics.filter((t) => String(t.chapterId) === String(chapterId));
  return calculateSyllabusProgress(chapTopics);
}

/**
 * Calculates resource tracking progress for a topic.
 */
export function calculateTopicResourceProgress(topicId, allResources = []) {
  const resources = allResources.filter((r) => String(r.topicId) === String(topicId));
  const total = resources.length;
  if (total === 0) return { total: 0, completed: 0, percentage: 0, videosCount: 0, avgWatchedPercent: 0 };

  const completed = resources.filter((r) => r.completed).length;
  const videos = resources.filter((r) => r.resourceType === 'Video Lecture');
  const totalWatched = videos.reduce((sum, v) => sum + (v.watchedPercentage || (v.completed ? 100 : 0)), 0);
  const avgWatched = videos.length > 0 ? Math.round(totalWatched / videos.length) : 0;

  return {
    total,
    completed,
    percentage: Math.round((completed / total) * 100),
    videosCount: videos.length,
    avgWatchedPercent: avgWatched,
  };
}

/**
 * Parses CSV text into a structured syllabus object.
 */
export function parseSyllabusCSV(csvText) {
  const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV must contain a header row and at least one data row.');
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[\s_]/g, ''));
  const prepAreaIdx = header.findIndex((h) => h.includes('area') || h.includes('prep'));
  const courseIdx = header.findIndex((h) => h.includes('course'));
  const subjIdx = header.findIndex((h) => h.includes('subject'));
  const chapIdx = header.findIndex((h) => h.includes('chapter') || h.includes('module'));
  const topicIdx = header.findIndex((h) => h.includes('topic') || h.includes('name'));
  const hoursIdx = header.findIndex((h) => h.includes('hour') || h.includes('est'));
  const diffIdx = header.findIndex((h) => h.includes('diff'));
  const impIdx = header.findIndex((h) => h.includes('imp') || h.includes('priority'));
  const refIdx = header.findIndex((h) => h.includes('ref') || h.includes('resource'));
  const notesIdx = header.findIndex((h) => h.includes('note') || h.includes('desc'));

  if (prepAreaIdx === -1 || subjIdx === -1 || topicIdx === -1) {
    throw new Error('CSV must have headers for "PreparationArea", "Subject", and "Topic".');
  }

  let preparationArea = '';
  let course = '';
  const subjectsMap = new Map(); // Subject -> { name, chapters: Map(Chapter -> topics) }

  const clean = (val) => (val ? String(val).replace(/^["']|["']$/g, '').trim() : '');

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].split(',');
    const cols = rawCols.map(clean);
    if (cols.length <= Math.max(prepAreaIdx, subjIdx, topicIdx)) continue;

    const rowArea = clean(cols[prepAreaIdx]);
    const rowCourse = courseIdx !== -1 ? clean(cols[courseIdx]) : '';
    const rowSubj = clean(cols[subjIdx]);
    const rowChap = chapIdx !== -1 ? clean(cols[chapIdx]) : 'General';
    const rowTopic = clean(cols[topicIdx]);
    const rowHours = hoursIdx !== -1 ? Number(cols[hoursIdx]) || 2 : 2;
    const rowDiff = diffIdx !== -1 ? clean(cols[diffIdx]) : 'Medium';
    const rowImp = impIdx !== -1 ? clean(cols[impIdx]) : 'High';
    const rowRef = refIdx !== -1 ? clean(cols[refIdx]) : '';
    const rowNotes = notesIdx !== -1 ? clean(cols[notesIdx]) : '';

    if (!preparationArea && rowArea) preparationArea = rowArea;
    if (!course && rowCourse) course = rowCourse;

    if (!rowSubj || !rowTopic) continue;

    if (!subjectsMap.has(rowSubj)) {
      subjectsMap.set(rowSubj, { name: rowSubj, chaptersMap: new Map() });
    }

    const subjObj = subjectsMap.get(rowSubj);
    const chapName = rowChap || 'General';
    if (!subjObj.chaptersMap.has(chapName)) {
      subjObj.chaptersMap.set(chapName, []);
    }

    subjObj.chaptersMap.get(chapName).push({
      name: rowTopic,
      estimatedHours: rowHours,
      difficulty: rowDiff,
      importance: rowImp,
      resourceReference: rowRef,
      notes: rowNotes,
    });
  }

  const subjects = [];
  for (const [subjName, subjObj] of subjectsMap.entries()) {
    const chapters = [];
    const directTopics = [];

    for (const [chapName, topicList] of subjObj.chaptersMap.entries()) {
      if (chapName === 'General' || !chapName) {
        directTopics.push(...topicList);
      } else {
        chapters.push({
          name: chapName,
          topics: topicList,
        });
      }
    }

    subjects.push({
      name: subjName,
      chapters,
      topics: directTopics.length > 0 ? directTopics : undefined,
    });
  }

  return {
    preparationArea,
    course,
    subjects,
  };
}

/**
 * Parses and validates syllabus JSON or CSV data before importing.
 * Detects duplicates, schema violations, and generates a preview.
 */
export function validateSyllabusJSON(jsonOrCsvInput, existingPrepAreas = [], existingCourses = [], existingSubjects = [], existingTopics = [], existingChapters = []) {
  let parsed;
  try {
    if (typeof jsonOrCsvInput === 'string') {
      const trimmed = jsonOrCsvInput.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        parsed = JSON.parse(trimmed);
      } else {
        // Parse CSV
        parsed = parseSyllabusCSV(trimmed);
      }
    } else {
      parsed = jsonOrCsvInput;
    }
  } catch (err) {
    return {
      valid: false,
      error: `Parse error: ${err.message}`,
      subjectsToAdd: [],
      chaptersToAdd: [],
      topicsToAdd: [],
      duplicatesDetected: [],
      summary: null,
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      valid: false,
      error: 'Data must be an object with preparationArea and subjects.',
      subjectsToAdd: [],
      chaptersToAdd: [],
      topicsToAdd: [],
      duplicatesDetected: [],
      summary: null,
    };
  }

  const cleanStr = (s) => (s ? String(s).replace(/^["']|["']$/g, '').trim() : '');

  // 1. Validate Preparation Area
  const areaName = cleanStr(parsed.preparationArea || parsed.area || '');
  if (!areaName) {
    return {
      valid: false,
      error: 'Missing "preparationArea" field.',
      subjectsToAdd: [],
      chaptersToAdd: [],
      topicsToAdd: [],
      duplicatesDetected: [],
      summary: null,
    };
  }

  const targetArea = existingPrepAreas.find(
    (a) => cleanStr(a.name).toLowerCase() === areaName.toLowerCase() || a.id === parsed.preparationAreaId
  );

  if (!targetArea) {
    return {
      valid: false,
      error: `Preparation area "${areaName}" not found. Available areas: ${existingPrepAreas.map((a) => a.name).join(', ')}`,
      subjectsToAdd: [],
      chaptersToAdd: [],
      topicsToAdd: [],
      duplicatesDetected: [],
      summary: null,
    };
  }

  // 2. Resolve Course
  const courseName = cleanStr(parsed.course || parsed.courseName || '');
  let targetCourse = existingCourses.find(
    (c) => c.preparationAreaId === targetArea.id && cleanStr(c.name).toLowerCase() === courseName.toLowerCase()
  );
  const isNewCourse = !targetCourse && !!courseName;

  // 3. Validate Subjects and Topics
  if (!Array.isArray(parsed.subjects) || parsed.subjects.length === 0) {
    return {
      valid: false,
      error: 'The "subjects" field must be a non-empty array.',
      subjectsToAdd: [],
      chaptersToAdd: [],
      topicsToAdd: [],
      duplicatesDetected: [],
      summary: null,
    };
  }

  const subjectsToCreate = [];
  const chaptersToCreate = [];
  const topicsToCreate = [];
  const duplicatesDetected = [];
  const errors = [];

  parsed.subjects.forEach((subj, subjIdx) => {
    if (!subj.name || typeof subj.name !== 'string' || !subj.name.trim()) {
      errors.push(`Subject at index ${subjIdx} is missing a valid "name".`);
      return;
    }

    const trimmedSubjName = subj.name.trim();
    let existingSubj = existingSubjects.find(
      (s) => s.preparationAreaId === targetArea.id && s.name.toLowerCase().trim() === trimmedSubjName.toLowerCase()
    );

    if (!existingSubj) {
      let queued = subjectsToCreate.find((s) => s.name.toLowerCase() === trimmedSubjName.toLowerCase());
      if (!queued) {
        queued = {
          name: trimmedSubjName,
          preparationAreaId: targetArea.id,
          color: subj.color || '#6366f1',
          order: existingSubjects.length + subjectsToCreate.length + 1,
        };
        subjectsToCreate.push(queued);
      }
    }

    // Process chapters if present
    if (Array.isArray(subj.chapters)) {
      subj.chapters.forEach((chap) => {
        if (!chap.name || typeof chap.name !== 'string') return;
        const trimmedChapName = chap.name.trim();

        // Queue chapter to create
        chaptersToCreate.push({
          subjectName: trimmedSubjName,
          name: trimmedChapName,
          description: chap.description || '',
          order: chap.order || chaptersToCreate.length + 1,
        });

        // Process chapter topics
        if (Array.isArray(chap.topics)) {
          chap.topics.forEach((top) => {
            processTopic(top, trimmedSubjName, trimmedChapName);
          });
        }
      });
    }

    // Process direct subject topics
    if (Array.isArray(subj.topics)) {
      subj.topics.forEach((top) => {
        processTopic(top, trimmedSubjName, null);
      });
    }
  });

  function processTopic(top, subjectName, chapterName) {
    if (!top.name || typeof top.name !== 'string' || !top.name.trim()) return;
    const trimmedTopicName = top.name.trim();

    // Check duplicate
    const existingMatch = existingTopics.find((t) => {
      const parentSubj = existingSubjects.find((s) => s.id === t.subjectId);
      if (parentSubj && parentSubj.preparationAreaId === targetArea.id) {
        return parentSubj.name.toLowerCase().trim() === subjectName.toLowerCase().trim() &&
               t.name.toLowerCase().trim() === trimmedTopicName.toLowerCase();
      }
      return false;
    });

    if (existingMatch) {
      duplicatesDetected.push({
        subjectName,
        chapterName: chapterName || '—',
        topicName: trimmedTopicName,
        existingId: existingMatch.id,
        reason: 'A topic with this name already exists in this subject.',
      });
    } else {
      topicsToCreate.push({
        subjectName,
        chapterName,
        name: trimmedTopicName,
        description: top.description || '',
        estimatedHours: Number(top.estimatedHours) || 2,
        estimatedMinutes: (Number(top.estimatedHours) || 2) * 60,
        difficulty: ['Easy', 'Medium', 'Hard', 'Very Hard'].includes(top.difficulty) ? top.difficulty : 'Medium',
        importance: ['Critical', 'High', 'Medium', 'Low'].includes(top.importance) ? top.importance : 'High',
        status: top.status || 'Not Started',
        completionPercentage: Number(top.completionPercentage) || 0,
        resourceReference: top.resourceReference || '',
        resources: Array.isArray(top.resources) ? top.resources : [],
        subtopics: Array.isArray(top.subtopics) ? top.subtopics : [],
      });
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('; '),
      subjectsToAdd: [],
      chaptersToAdd: [],
      topicsToAdd: [],
      duplicatesDetected,
      summary: null,
    };
  }

  return {
    valid: true,
    error: null,
    targetArea,
    courseName,
    isNewCourse,
    targetCourse,
    subjectsToAdd: subjectsToCreate,
    chaptersToAdd: chaptersToCreate,
    topicsToAdd: topicsToCreate,
    duplicatesDetected,
    summary: {
      newSubjectsCount: subjectsToCreate.length,
      newChaptersCount: chaptersToCreate.length,
      newTopicsCount: topicsToCreate.length,
      duplicatesCount: duplicatesDetected.length,
    },
  };
}

/**
 * Safely executes syllabus import with duplicate resolution strategies:
 * - duplicateStrategy = 'skip' (default): skip duplicates
 * - duplicateStrategy = 'update': update existing topic fields
 * - duplicateStrategy = 'create': create as separate topic
 */
export async function executeSyllabusImport(validationResult, duplicateStrategy = 'skip') {
  if (!validationResult || !validationResult.valid) {
    throw new Error(validationResult?.error || 'Validation failed. Cannot import.');
  }

  const { targetArea, courseName, isNewCourse, targetCourse, subjectsToAdd, chaptersToAdd, topicsToAdd, duplicatesDetected } = validationResult;

  // 1. Resolve Course ID
  let courseId = targetCourse?.id || null;
  if (isNewCourse && courseName) {
    courseId = await addCourse({
      preparationAreaId: targetArea.id,
      name: courseName,
      platform: courseName,
      provider: courseName,
      status: 'Active',
      description: `Course for ${targetArea.name}`,
      color: '#6366f1',
    });
  }

  // 2. Create New Subjects
  const subjectMap = new Map();
  const currentSubjects = await getAllSubjects();
  currentSubjects
    .filter((s) => s.preparationAreaId === targetArea.id)
    .forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s.id));

  for (const subj of subjectsToAdd) {
    const id = await addSubject({
      ...subj,
      courseId,
    });
    subjectMap.set(subj.name.toLowerCase().trim(), id);
  }

  // 3. Create Chapters
  const chapterMap = new Map(); // "subjectName:chapterName" -> Chapter ID
  const currentChapters = await getAllChapters();
  currentChapters
    .filter((c) => c.preparationAreaId === targetArea.id)
    .forEach((c) => {
      const subj = currentSubjects.find((s) => s.id === c.subjectId);
      if (subj) chapterMap.set(`${subj.name.toLowerCase()}:${c.name.toLowerCase()}`, c.id);
    });

  for (const chap of chaptersToAdd) {
    const subjectId = subjectMap.get(chap.subjectName.toLowerCase().trim());
    if (!subjectId) continue;

    const key = `${chap.subjectName.toLowerCase()}:${chap.name.toLowerCase()}`;
    if (!chapterMap.has(key)) {
      const id = await addChapter({
        preparationAreaId: targetArea.id,
        courseId,
        subjectId,
        name: chap.name,
        description: chap.description || '',
        order: chap.order || 0,
      });
      chapterMap.set(key, id);
    }
  }

  // 4. Create New Topics
  let addedTopicsCount = 0;
  for (const top of topicsToAdd) {
    const subjectId = subjectMap.get(top.subjectName.toLowerCase().trim());
    if (!subjectId) continue;

    let chapterId = null;
    if (top.chapterName) {
      chapterId = chapterMap.get(`${top.subjectName.toLowerCase()}:${top.chapterName.toLowerCase()}`) || null;
    }

    const topicId = await addTopic({
      preparationAreaId: targetArea.id,
      courseId,
      subjectId,
      chapterId,
      name: top.name,
      description: top.description || '',
      estimatedHours: top.estimatedHours,
      estimatedMinutes: top.estimatedMinutes,
      difficulty: top.difficulty,
      importance: top.importance,
      status: top.status || 'Not Started',
      completionPercentage: top.completionPercentage || 0,
      resourceReference: top.resourceReference || '',
      parentTopicId: null,
    });

    addedTopicsCount++;

    // Add study resources if included
    if (top.resources && top.resources.length > 0) {
      for (const res of top.resources) {
        await addStudyResource({
          topicId,
          preparationAreaId: targetArea.id,
          courseId,
          subjectId,
          title: res.title || top.name + ' Resource',
          resourceType: res.resourceType || 'PDF',
          url: res.url || '',
          durationMinutes: res.durationMinutes || 0,
          completed: res.completed || false,
          watchedPercentage: res.watchedPercentage || 0,
          notes: res.notes || '',
        });
      }
    }
  }

  // 5. Handle Duplicates if strategy is 'update'
  if (duplicateStrategy === 'update' && duplicatesDetected.length > 0) {
    for (const dup of duplicatesDetected) {
      if (dup.existingId) {
        await updateTopic(dup.existingId, {
          lastStudiedDate: new Date().toISOString().slice(0, 10),
        });
      }
    }
  }

  return {
    success: true,
    addedSubjects: subjectsToAdd.length,
    addedChapters: chaptersToAdd.length,
    addedTopics: addedTopicsCount,
    courseId,
  };
}

/**
 * Generates sample JSON template for download.
 */
export function generateSyllabusTemplateJSON(areaName = 'IBPS SO IT Officer', courseName = 'Adda247 MahaPack') {
  return JSON.stringify(
    {
      preparationArea: areaName,
      course: courseName,
      subjects: [
        {
          name: 'Database Management Systems',
          color: '#6366f1',
          chapters: [
            {
              name: 'Relational Database Design',
              topics: [
                {
                  name: 'Functional Dependencies & Normal Forms (1NF to BCNF)',
                  estimatedHours: 3,
                  difficulty: 'Hard',
                  importance: 'Critical',
                  resourceReference: 'Chapter 3 / Lecture 14',
                  resources: [
                    { title: 'Video Lecture - Normalization', resourceType: 'Video Lecture', durationMinutes: 60 },
                    { title: 'Study Notes & Cheat Sheet', resourceType: 'Notes' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    null,
    2
  );
}

/**
 * Generates sample CSV template for download.
 */
export function generateSyllabusTemplateCSV(areaName = 'Panchayat', courseName = 'YourStudy') {
  return [
    'PreparationArea,Course,Subject,Chapter,Topic,EstimatedHours,Difficulty,Importance,ResourceReference,Notes',
    `"${areaName}","${courseName}","General Studies","Polity & Constitution","73rd Constitutional Amendment Act",3,"Medium","Critical","Lecture 1","Key amendment for Panchayati Raj"`,
    `"${areaName}","${courseName}","General Studies","Polity & Constitution","Gram Panchayat Powers and Finances",2,"Easy","High","Lecture 2","Financial structure"`,
    `"${areaName}","${courseName}","Rural Development","Schemes","MGNREGA & PMAY Overview",4,"Medium","High","Lecture 5","Important flagship schemes"`,
  ].join('\n');
}
