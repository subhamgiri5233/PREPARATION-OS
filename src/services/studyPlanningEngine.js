// src/services/studyPlanningEngine.js
import { format, addMinutes, parseISO, differenceInMinutes, isBefore } from 'date-fns';
import { calculateAvailableSlots, chunkSlots } from './availabilityEngine.js';
import { calculatePriorityScore, determineSessionType } from './priorityEngine.js';
import { addTask } from './db.js';

/**
 * Generates a full daily plan by calculating availability, sorting pending work, and filling slots.
 */
export async function generateDailyPlan(dateObj, context) {
  const { topics, revisionsDue, teachingSlots, scheduledTasks, sessions, mocks, prepAreas, subjects, settings, today, vocabToday } = context;
  const dateStr = format(dateObj, 'yyyy-MM-dd');

  // 1. Get raw available slots
  const rawSlots = calculateAvailableSlots(dateObj, teachingSlots, scheduledTasks, sessions, settings);
  
  // 2. Chunk slots into workable sizes (e.g., 60m, 45m, 30m)
  const blockPrefs = [90, 60, 45, 30]; // Configurable later
  const availableSlots = chunkSlots(rawSlots, blockPrefs);
  
  if (availableSlots.length === 0) {
    return { success: false, reason: 'No available time slots found for this date.' };
  }

  // 3. Collect and score all potential work
  const potentialTasks = [];
  
  const priorityContext = { mocks, prepAreas, subjects, sessions, today };

  // Add Revisions
  revisionsDue.forEach(r => {
    // Revisions get artificially high priority from priorityEngine if due today/overdue
    const score = calculatePriorityScore({ ...r, type: 'revision' }, priorityContext);
    potentialTasks.push({
      item: r,
      type: 'Revision',
      score,
      topicId: r.topicId,
      title: r.topicName || `Revision #${r.revisionNumber}`,
      reason: r.dueDate < today ? 'Overdue revision' : 'Revision due today',
      durationMinutes: 30, // Default revision block
    });
  });

  // Add Vocabulary if target not met
  const vocabTarget = settings?.vocabDailyTarget || 10;
  if (vocabToday < vocabTarget && dateStr === today) {
    potentialTasks.push({
      item: null,
      type: 'Vocabulary',
      score: 85, // Very high priority to build daily habit
      title: 'Daily Vocabulary',
      reason: 'Daily target pending',
      durationMinutes: 15,
    });
  }

  // Add Pending Topics
  const pendingTopics = topics.filter(t => t.status !== 'Completed' && t.status !== 'Mastered');
  pendingTopics.forEach(t => {
    const score = calculatePriorityScore(t, priorityContext);
    const sessionType = determineSessionType(t, priorityContext);
    
    // Determine duration based on topic estimate or fallback
    let duration = t.estimatedMinutes || 60;
    
    potentialTasks.push({
      item: t,
      type: sessionType,
      score,
      topicId: t.id,
      subjectId: t.subjectId,
      preparationAreaId: t.preparationAreaId,
      title: t.name,
      reason: score > 60 ? 'High priority based on mock weaknesses/urgency' : 'Pending syllabus topic',
      durationMinutes: duration,
    });
  });

  // 4. Sort by highest score first
  potentialTasks.sort((a, b) => b.score - a.score);

  // 5. Fill slots
  const plannedTasks = [];
  const targetMinutes = (settings?.dailyStudyHours || 8) * 60;
  let plannedMinutes = 0;
  
  let taskIndex = 0;
  for (const slot of availableSlots) {
    if (plannedMinutes >= targetMinutes) break; // Reached daily limit (sustainable)
    if (taskIndex >= potentialTasks.length) break; // Ran out of work
    
    const candidate = potentialTasks[taskIndex];
    
    // Fit the candidate into the slot.
    // If the candidate needs more time than the slot, we schedule part of it.
    // If it needs less, we schedule it and leave the slot partially filled (simplified for MVP: we just use the slot start/end).
    
    const taskData = {
      date: dateStr,
      startTime: slot.start,
      endTime: slot.end,
      title: candidate.title,
      topicId: candidate.topicId,
      subjectId: candidate.subjectId,
      preparationAreaId: candidate.preparationAreaId,
      status: 'Not Started',
      priority: candidate.score > 70 ? 'High' : candidate.score > 40 ? 'Medium' : 'Low',
      plannedBy: 'system',
      type: candidate.type,
      reason: candidate.reason,
    };
    
    plannedTasks.push(taskData);
    plannedMinutes += slot.durationMinutes;
    
    // If this slot satisfies the candidate, move to the next candidate.
    // (In a perfect engine, we'd subtract slot duration from candidate duration. Here we just consume the candidate).
    taskIndex++;
  }
  
  // 6. Save to DB
  for (const task of plannedTasks) {
    await addTask(task);
  }
  
  return { success: true, tasksPlanned: plannedTasks.length, minutesPlanned: plannedMinutes };
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
  const currentSlot = rawSlots.find(s => s.start <= nowTime && s.end > nowTime);
  
  // 2. Score tasks
  const priorityContext = { mocks, prepAreas, subjects, sessions, today };
  
  let topCandidate = null;
  let topScore = -1;
  let isRevision = false;
  
  // Check revisions
  revisionsDue.forEach(r => {
    const score = calculatePriorityScore({ ...r, type: 'revision' }, priorityContext);
    if (score > topScore) {
      topScore = score;
      topCandidate = r;
      isRevision = true;
    }
  });
  
  // Check topics
  topics.filter(t => t.status !== 'Completed' && t.status !== 'Mastered').forEach(t => {
    const score = calculatePriorityScore(t, priorityContext);
    if (score > topScore) {
      topScore = score;
      topCandidate = t;
      isRevision = false;
    }
  });
  
  if (!topics || topics.length === 0) {
    return { available: false, message: "Add your syllabus/course data to generate intelligent recommendations." };
  }

  if (!topCandidate) {
    return { available: true, message: "No pending tasks found. Take a break!" };
  }

  // Hierarchical Area -> Subject -> Chapter -> Topic lookup
  let areaName = '';
  const areaId = topCandidate.preparationAreaId;
  if (areaId && prepAreas) {
    const area = prepAreas.find(a => a.id === areaId);
    if (area) areaName = area.name;
  }

  let subjectName = '';
  const subjectId = topCandidate.subjectId;
  if (subjectId && subjects) {
    const subj = subjects.find(s => s.id === subjectId);
    if (subj) subjectName = subj.name;
  }

  let chapterName = '';
  const chapterId = topCandidate.chapterId;
  if (chapterId && context.chapters) {
    const chap = context.chapters.find(c => c.id === chapterId);
    if (chap) chapterName = chap.name;
  }

  const topicName = topCandidate.name || topCandidate.topicName || 'Study Topic';
  const hierarchicalName = subjectName ? `${subjectName} → ${topicName}` : topicName;
  const fullHierarchicalPath = [areaName, subjectName, chapterName, topicName].filter(Boolean).join(' → ');

  // Build comprehensive justification reasons
  const reasonsList = [];
  if (isRevision) {
    reasonsList.push('Revision due today (Spaced Repetition)');
    if (topCandidate.priorityData?.reason) {
      reasonsList.push(topCandidate.priorityData.reason);
    }
  } else {
    if (topCandidate.importance === 'Critical' || topCandidate.importance === 'High') {
      reasonsList.push(`High syllabus importance (${topCandidate.importance})`);
    }
    if (topCandidate.status === 'In Progress' || topCandidate.status === 'Learning') {
      reasonsList.push('Currently in progress');
    }
    if (topCandidate.status === 'Weak') {
      reasonsList.push('Weak topic from mock error analysis');
    }
    if (topCandidate.difficulty === 'Hard' || topCandidate.difficulty === 'Very Hard') {
      reasonsList.push(`Challenging topic (${topCandidate.difficulty})`);
    }
  }

  if (reasonsList.length === 0) {
    reasonsList.push(topScore > 80 ? 'Critical priority based on deadlines/mocks' : 'Highest ranked pending topic');
  }

  const reason = reasonsList.join(' · ');

  // Recommended duration in minutes
  const estMins = topCandidate.estimatedMinutes || (topCandidate.estimatedHours ? topCandidate.estimatedHours * 60 : 60);
  const recommendedDuration = Math.min(90, Math.max(30, Math.round(estMins)));

  return {
    available: !!currentSlot,
    slot: currentSlot || null,
    candidate: topCandidate,
    isRevision,
    score: topScore,
    reason,
    reasonsList,
    areaName,
    subjectName,
    chapterName,
    topicName,
    hierarchicalName,
    fullHierarchicalPath,
    recommendedDuration,
    message: `Top priority: ${hierarchicalName}`
  };
}

/**
 * Returns a real-time single recommendation for "What should I REVISE NOW?"
 * Specifically for the Phase 5 Revision Engine.
 */
export function getReviseNowRecommendation(context) {
  const { revisionsDue, teachingSlots, scheduledTasks, sessions, settings } = context;
  
  const now = new Date();
  const rawSlots = calculateAvailableSlots(now, teachingSlots, scheduledTasks, sessions, settings);
  const nowTime = format(now, 'HH:mm');
  const currentSlot = rawSlots.find(s => s.start <= nowTime && s.end > nowTime);
  
  if (!revisionsDue || revisionsDue.length === 0) {
    return { available: true, message: "No revisions due. You are all caught up!" };
  }

  // Find the highest priority revision
  let topCandidate = revisionsDue[0]; // Assuming revisionsDue is sorted by priority
  let topScore = topCandidate.priorityData ? topCandidate.priorityData.score : 0;
  
  // If not sorted, find max
  revisionsDue.forEach(r => {
    const score = r.priorityData ? r.priorityData.score : 0;
    if (score > topScore) {
      topScore = score;
      topCandidate = r;
    }
  });

  const reason = topCandidate.priorityData ? topCandidate.priorityData.reason : 'Spaced repetition due';

  return {
    available: !!currentSlot,
    slot: currentSlot || null,
    candidate: topCandidate,
    score: topScore,
    reason,
    message: `Top revision priority: ${topCandidate.topicName}`
  };
}
