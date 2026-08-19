// src/services/studyPlanningEngine.js
import { format, addMinutes, parseISO, differenceInMinutes, isBefore } from 'date-fns';
import { calculateAvailableSlots, chunkSlots } from './availabilityEngine.js';
import { calculatePriorityScore, determineSessionType } from './priorityEngine.js';
import { addTask, deleteTask } from './db.js';

/**
 * Generates a full daily plan by calculating availability, sorting pending work, and filling slots.
 * Strictly respects user-edited, locked, and manual tasks when preserveUserEdits is enabled.
 */
export async function generateDailyPlan(dateObj, context, options = { preserveUserEdits: true }) {
  const { topics, revisionsDue, teachingSlots, scheduledTasks = [], sessions = [], mocks, prepAreas, subjects, settings, today, vocabToday } = context;
  const dateStr = format(dateObj, 'yyyy-MM-dd');
  const targetMinutes = (settings?.dailyStudyHours || 8) * 60;

  // 1. Separate existing tasks into preserved vs replaceable
  const dayTasks = (scheduledTasks || []).filter((t) => t.date === dateStr);
  const preservedTasks = [];
  const replaceableTasks = [];

  for (const t of dayTasks) {
    const isCompleted = (t.status || '').toLowerCase() === 'completed';
    const isLocked = t.isLocked === true;
    const isUserEdited = t.isUserEdited === true;
    const isManual = t.source === 'manual' || (!t.source && !t.plannedBy);

    if (options.preserveUserEdits && (isCompleted || isLocked || isUserEdited || isManual)) {
      preservedTasks.push(t);
    } else {
      replaceableTasks.push(t);
    }
  }

  // Delete replaceable tasks from DB
  for (const t of replaceableTasks) {
    if (t.id || t._id) {
      await deleteTask(t.id || t._id);
    }
  }

  // Calculate already planned minutes from preserved tasks
  let preservedMinutes = 0;
  for (const pt of preservedTasks) {
    if (pt.durationMinutes) {
      preservedMinutes += Number(pt.durationMinutes);
    } else if (pt.startTime && pt.endTime) {
      const [sh, sm] = pt.startTime.split(':').map(Number);
      const [eh, em] = pt.endTime.split(':').map(Number);
      preservedMinutes += (eh * 60 + em) - (sh * 60 + sm);
    } else {
      preservedMinutes += 60;
    }
  }

  // If preserved tasks already meet or exceed daily study target, keep them
  if (preservedMinutes >= targetMinutes) {
    return {
      success: true,
      tasksPlanned: preservedTasks.length,
      minutesPlanned: preservedMinutes,
      preservedCount: preservedTasks.length,
    };
  }

  // 2. Get raw available slots considering teaching schedule + preserved tasks + completed sessions
  const rawSlots = calculateAvailableSlots(dateObj, teachingSlots, preservedTasks, sessions, settings);

  // 3. Chunk slots into workable sizes (e.g. 90m, 60m, 45m, 30m)
  const blockPrefs = [90, 60, 45, 30];
  const availableSlots = chunkSlots(rawSlots, blockPrefs);

  if (availableSlots.length === 0) {
    return {
      success: true,
      tasksPlanned: preservedTasks.length,
      minutesPlanned: preservedMinutes,
      preservedCount: preservedTasks.length,
      reason: preservedTasks.length > 0 ? 'Preserved existing schedule.' : 'No available time slots found.',
    };
  }

  // 4. Collect and score all potential work
  const potentialTasks = [];
  const priorityContext = { mocks, prepAreas, subjects, sessions, today };

  // Collect existing planned topic IDs to prevent scheduling duplicates
  const plannedTopicIds = new Set(preservedTasks.map((t) => String(t.topicId)).filter(Boolean));

  // Add Revisions
  (revisionsDue || []).forEach((r) => {
    if (!plannedTopicIds.has(String(r.topicId))) {
      const score = calculatePriorityScore({ ...r, type: 'revision' }, priorityContext);
      potentialTasks.push({
        item: r,
        type: 'Revision',
        score,
        topicId: r.topicId,
        title: r.topicName || `Revision #${r.revisionNumber}`,
        reason: r.dueDate < today ? 'Overdue revision' : 'Revision due today',
        durationMinutes: 30,
      });
    }
  });

  // Add Vocabulary if target not met
  const vocabTarget = settings?.vocabDailyTarget || 10;
  if (vocabToday < vocabTarget && dateStr === today) {
    potentialTasks.push({
      item: null,
      type: 'Vocabulary',
      score: 85,
      title: 'Daily Vocabulary',
      reason: 'Daily target pending',
      durationMinutes: 15,
    });
  }

  // Add Pending Topics
  const pendingTopics = (topics || []).filter((t) => {
    if (plannedTopicIds.has(String(t.id || t._id))) return false;
    const s = (t.status || '').toLowerCase();
    return s !== 'completed' && s !== 'mastered';
  });

  pendingTopics.forEach((t) => {
    const score = calculatePriorityScore(t, priorityContext);
    const sessionType = determineSessionType(t, priorityContext);
    const duration = t.estimatedMinutes || 60;

    potentialTasks.push({
      item: t,
      type: sessionType,
      score,
      topicId: t.id || t._id,
      subjectId: t.subjectId,
      preparationAreaId: t.preparationAreaId,
      title: t.name,
      reason: score > 60 ? 'High priority based on mock weaknesses/urgency' : 'Pending syllabus topic',
      durationMinutes: duration,
    });
  });

  // 5. Sort by highest score first
  potentialTasks.sort((a, b) => b.score - a.score);

  // 6. Fill slots up to remaining target minutes
  const newlyPlannedTasks = [];
  let remainingMinutesNeeded = targetMinutes - preservedMinutes;
  let plannedNewMinutes = 0;
  let taskIndex = 0;

  for (const slot of availableSlots) {
    if (plannedNewMinutes >= remainingMinutesNeeded) break;
    if (taskIndex >= potentialTasks.length) break;

    const candidate = potentialTasks[taskIndex];
    const slotDuration = slot.durationMinutes || 60;

    const taskData = {
      date: dateStr,
      startTime: slot.start,
      endTime: slot.end,
      durationMinutes: slotDuration,
      title: candidate.title,
      topicId: candidate.topicId,
      subjectId: candidate.subjectId,
      preparationAreaId: candidate.preparationAreaId,
      status: 'Not Started',
      priority: candidate.score > 70 ? 'High' : candidate.score > 40 ? 'Medium' : 'Low',
      source: 'auto',
      isUserEdited: false,
      isLocked: false,
      plannedBy: 'system',
      type: candidate.type,
      reason: candidate.reason,
    };

    newlyPlannedTasks.push(taskData);
    plannedNewMinutes += slotDuration;
    taskIndex++;
  }

  // 7. Save new tasks to DB
  for (const task of newlyPlannedTasks) {
    await addTask(task);
  }

  return {
    success: true,
    tasksPlanned: preservedTasks.length + newlyPlannedTasks.length,
    minutesPlanned: preservedMinutes + plannedNewMinutes,
    preservedCount: preservedTasks.length,
    newCount: newlyPlannedTasks.length,
  };
}

/**
 * Optimizes the daily routine: keeps user-edited, locked, completed tasks and teaching periods fixed,
 * while rearranging remaining pending tasks into optimal non-conflicting time slots.
 */
export async function optimizeDailyRoutine(dateObj, context) {
  return await generateDailyPlan(dateObj, context, { preserveUserEdits: true });
}

/**
 * Returns a real-time single recommendation for "What should I study NOW?"
 */
export function getStudyNowRecommendation(context) {
  const { topics, revisionsDue, mocks, prepAreas, subjects, sessions, today, teachingSlots, scheduledTasks, settings } = context;

  const now = new Date();

  // 1. Check if currently in a teaching period or scheduled task
  const rawSlots = calculateAvailableSlots(now, teachingSlots, scheduledTasks, sessions, settings);
  const nowTime = format(now, 'HH:mm');

  // Find a slot that encompasses NOW
  const currentSlot = rawSlots.find((s) => s.start <= nowTime && s.end > nowTime);

  // 2. Score tasks
  const priorityContext = { mocks, prepAreas, subjects, sessions, today };

  let topCandidate = null;
  let topScore = -1;
  let isRevision = false;

  // Check revisions first
  (revisionsDue || []).forEach((r) => {
    const score = calculatePriorityScore({ ...r, type: 'revision' }, priorityContext);
    if (score > topScore) {
      topScore = score;
      topCandidate = r;
      isRevision = true;
    }
  });

  // If no high-priority revisions, check pending topics
  if (!topCandidate || topScore < 60) {
    const pendingTopics = (topics || []).filter((t) => t.status !== 'Completed' && t.status !== 'Mastered');
    pendingTopics.forEach((t) => {
      const score = calculatePriorityScore(t, priorityContext);
      if (score > topScore) {
        topScore = score;
        topCandidate = t;
        isRevision = false;
      }
    });
  }

  if (!topCandidate) {
    return { candidate: null, message: 'Great job! No urgent study tasks pending right now.' };
  }

  const topicObj = isRevision
    ? (topics || []).find((t) => String(t.id || t._id) === String(topCandidate.topicId)) || topCandidate
    : topCandidate;

  const subject = (subjects || []).find((s) => String(s.id || s._id) === String(topicObj.subjectId));
  const area = (prepAreas || []).find((a) => String(a.id || a._id) === String(topicObj.preparationAreaId || subject?.preparationAreaId));

  const hierarchicalName = subject ? `${subject.name} → ${topicObj.name || topCandidate.title}` : (topicObj.name || topCandidate.title);
  const fullHierarchicalPath = area ? `${area.name} > ${hierarchicalName}` : hierarchicalName;

  return {
    candidate: topCandidate,
    isRevision,
    score: topScore,
    reason: isRevision ? 'Spaced repetition revision due' : 'High priority topic based on target and performance',
    reasonsList: [
      isRevision ? 'Due for spaced repetition review' : 'Core syllabus milestone',
      area ? `High priority area: ${area.name}` : null,
      topScore > 70 ? 'Identified as focus area from mock test results' : null,
    ].filter(Boolean),
    hierarchicalName,
    fullHierarchicalPath,
    recommendedDuration: topicObj.estimatedMinutes || 60,
  };
}

/**
 * Returns top recommendation specifically for revision
 */
export function getReviseNowRecommendation(context) {
  return getStudyNowRecommendation(context);
}

