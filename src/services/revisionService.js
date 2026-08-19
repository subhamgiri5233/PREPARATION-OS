// src/services/revisionService.js
// Revision engine - auto-creates spaced repetition revision tasks

import { addRevisionTask, getPendingRevisions, updateRevisionTask, bulkAddRevisions, getAllTopics, getErrorLogs, getAllMocks } from './db.js';
import { format, addDays, parseISO, differenceInDays } from 'date-fns';
import { calculateNextInterval } from './spacedRepetitionEngine.js';
import { calculateRevisionPriorityScore } from './revisionPriorityEngine.js';
import { classifyTopicPerformance } from './performanceEngine.js';
import { detectRepeatedErrors } from './errorAnalysisEngine.js';

/**
 * Creates the initial revision for a topic completion.
 * The system creates the first revision, and upon completion, dynamically schedules the next.
 */
export async function createInitialRevision(topicId, topicName, completionDate) {
  const baseDate = typeof completionDate === 'string' ? parseISO(completionDate) : completionDate;

  const existingPending = await getPendingRevisions();
  const alreadyScheduled = existingPending.some((r) => String(r.topicId) === String(topicId));
  if (alreadyScheduled) return null;

  const revision = {
    topicId: String(topicId),
    topicName: topicName || `Topic #${topicId}`,
    revisionNumber: 1,
    dueDate: format(addDays(baseDate, 1), 'yyyy-MM-dd'),
    status: 'Pending',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    completedDate: null,
    confidence: 0,
    difficulty: 'Medium',
    errorCount: 0,
    repeatedErrorCount: 0,
    intervalDays: 1,
    sourceType: 'Topic Completion',
    isManual: false,
    notes: '',
    createdAt: new Date().toISOString(),
  };
  
  const created = await addRevisionTask(revision);
  return { ...revision, id: created?.id || created?._id || created };
}

/**
 * Legacy compatibility
 */
export async function createRevisionSchedule(topicId, topicName, completionDate, intervals) {
  return await createInitialRevision(topicId, topicName, completionDate);
}

/**
 * Completes a revision and dynamically schedules the next one.
 */
export async function completeRevision(id, memoryRating, notes = '') {
  const pending = await getPendingRevisions();
  const rev = pending.find((r) => String(r.id || r._id) === String(id));
  if (!rev) throw new Error("Revision not found");

  // 1. Mark current as completed
  await updateRevisionTask(id, {
    status: 'Completed',
    completedDate: format(new Date(), 'yyyy-MM-dd'),
    confidence: memoryRating,
    notes,
  });

  // 2. Fetch mock performance for intelligence
  const errs = await getErrorLogs();
  const mocks = await getAllMocks();
  const topics = await getAllTopics();
  const topic = topics.find((t) => String(t.id || t._id) === String(rev.topicId));
  
  let mockPerformance = null;
  if (topic) {
    const areaMocks = mocks.filter((m) => String(m.preparationAreaId) === String(topic.preparationAreaId)).length;
    const perf = classifyTopicPerformance(topic.id, errs, areaMocks);
    const repeated = detectRepeatedErrors(errs, topics);
    const isRepeated = repeated.some((r) => String(r.topic?.id || r.topic?._id) === String(topic.id || topic._id) && r.mockCount > 1);
    
    mockPerformance = {
      accuracy: 100 - (perf.errorFrequency * 100),
      hasRepeatedErrors: isRepeated,
      isWeak: perf.label === 'Critical' || perf.label === 'Weak'
    };
  }

  // 3. Calculate next interval
  const nextInterval = calculateNextInterval(
    rev.intervalDays || 1, 
    memoryRating, 
    topic?.difficulty || 'Medium', 
    mockPerformance
  );

  // 4. Create the next revision in the sequence
  const nextRevision = {
    topicId: String(rev.topicId),
    topicName: rev.topicName,
    revisionNumber: (rev.revisionNumber || 1) + 1,
    dueDate: format(addDays(new Date(), nextInterval), 'yyyy-MM-dd'),
    status: 'Pending',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    completedDate: null,
    confidence: 0,
    difficulty: topic?.difficulty || 'Medium',
    intervalDays: nextInterval,
    sourceType: 'Spaced Repetition',
    isManual: false,
    notes: '',
    createdAt: new Date().toISOString(),
  };

  const createdNext = await addRevisionTask(nextRevision);
  return { ...nextRevision, id: createdNext?.id || createdNext?._id || createdNext };
}

export async function skipRevision(id) {
  const pending = await getPendingRevisions();
  const rev = pending.find((r) => String(r.id || r._id) === String(id));
  if (rev) {
    await updateRevisionTask(id, {
      dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      notes: (rev.notes ? rev.notes + '\n' : '') + 'Skipped on ' + format(new Date(), 'yyyy-MM-dd')
    });
  }
}

/**
 * Returns all pending revisions due on or before today, fully enriched and prioritized.
 */
export async function getRevisionsDueToday() {
  const all = await getAllPendingRevisionsEnriched();
  const today = format(new Date(), 'yyyy-MM-dd');
  return all
    .filter((r) => r.dueDate <= today)
    .sort((a, b) => b.priorityData.score - a.priorityData.score);
}

/**
 * Returns all pending revisions, enriched with topic names and priority data.
 */
export async function getAllPendingRevisionsEnriched() {
  const pending = await getPendingRevisions();
  const topics = await getAllTopics();
  const errs = await getErrorLogs();
  const mocks = await getAllMocks();
  const repeated = detectRepeatedErrors(errs, topics);
  
  return pending.map((r) => {
    const topic = topics.find((t) => String(t.id || t._id) === String(r.topicId));
    
    // Calculate mock performance for priority
    let mockPerformance = null;
    if (topic) {
      const areaMocks = mocks.filter((m) => String(m.preparationAreaId) === String(topic.preparationAreaId)).length;
      const perf = classifyTopicPerformance(topic.id, errs, areaMocks);
      const isRepeated = repeated.some((re) => String(re.topic?.id || re.topic?._id) === String(topic.id || topic._id) && re.mockCount > 1);
      
      mockPerformance = {
        accuracy: 100 - (perf.errorFrequency * 100),
        hasRepeatedErrors: isRepeated,
        isWeak: perf.label === 'Critical' || perf.label === 'Weak'
      };
    }

    const priorityData = calculateRevisionPriorityScore(r, topic, mockPerformance);

    return { 
      ...r, 
      topicName: topic?.name || `Topic #${r.topicId}`,
      topic,
      priorityData
    };
  });
}
