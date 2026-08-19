// src/services/reminderScheduler.js
// Central Smart Pre-Study Reminder System & Idempotent Scheduler

import { format, parseISO, addMinutes, isBefore, isAfter } from 'date-fns';
import {
  getSettings,
  getTasksByDate,
  getTeachingSchedule,
  getAllTopics,
  getAllSubjects,
  getAllCourses,
  getAllAreas,
  getAllNotifications,
  addNotification,
  updateNotification
} from './db.js';
import { sendNativeNotification } from './nativeNotificationService.js';

let _schedulerInterval = null;
let _isChecking = false;

/**
 * Format a 24-hour time string ("14:30") into a friendly 12-hour string ("2:30 PM")
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return '—';
  // If full ISO string, parse it
  if (timeStr.includes('T')) {
    try {
      return format(parseISO(timeStr), 'h:mm a');
    } catch (_) {}
  }
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

/**
 * Checks if a study time window overlaps with any teaching schedule periods.
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} startTimeStr - 'HH:MM'
 * @param {number} durationMinutes - e.g. 60
 * @param {Array} teachingSlots - slots from database
 */
export function checkTeachingConflict(dateStr, startTimeStr, durationMinutes, teachingSlots) {
  if (!teachingSlots || teachingSlots.length === 0 || !startTimeStr) return false;
  
  const targetDate = parseISO(dateStr);
  const dayName = format(targetDate, 'EEEE'); // 'Monday', 'Tuesday', etc.

  const [startH, startM] = startTimeStr.split(':').map(Number);
  const taskStartMinutes = startH * 60 + startM;
  const taskEndMinutes = taskStartMinutes + (Number(durationMinutes) || 60);

  for (const slot of teachingSlots) {
    if (!slot.active) continue;
    // Check day match
    const slotDay = slot.day || slot.dayOfWeek;
    if (slotDay && slotDay.toLowerCase() !== dayName.toLowerCase()) continue;

    const [slotStartH, slotStartM] = (slot.startTime || '00:00').split(':').map(Number);
    const [slotEndH, slotEndM] = (slot.endTime || '00:00').split(':').map(Number);
    const slotStartMinutes = slotStartH * 60 + slotStartM;
    const slotEndMinutes = slotEndH * 60 + slotEndM;

    // Overlap condition: taskStart < slotEnd AND taskEnd > slotStart
    if (taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes) {
      return true; // Conflict found
    }
  }
  return false;
}

/**
 * Checks and creates pre-study and missed session reminders for today.
 * Strictly idempotent — never creates duplicate notifications.
 */
export async function checkPreStudyReminders() {
  if (_isChecking) return;
  _isChecking = true;

  try {
    const settings = await getSettings();
    // Check if reminders are enabled in Settings
    const remindersEnabled = settings?.studyRemindersEnabled !== false;
    const leadMinutes = settings?.studyReminderMinutes !== undefined ? settings.studyReminderMinutes : 5;

    // If disabled or set to 0 (Off), skip
    if (!remindersEnabled || leadMinutes === 0) {
      _isChecking = false;
      return;
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const now = new Date();

    const [tasks, teachingSlots, topics, subjects, courses, areas, existingNotifs] = await Promise.all([
      getTasksByDate(todayStr),
      getTeachingSchedule(),
      getAllTopics(),
      getAllSubjects(),
      getAllCourses(),
      getAllAreas(),
      getAllNotifications()
    ]);

    // Build fast lookup maps
    const topicMap = new Map((topics || []).map((t) => [String(t.id || t._id), t]));
    const subjectMap = new Map((subjects || []).map((s) => [String(s.id || s._id), s]));
    const courseMap = new Map((courses || []).map((c) => [String(c.id || c._id), c]));
    const areaMap = new Map((areas || []).map((a) => [String(a.id || a._id), a]));
    const notifKeys = new Set((existingNotifs || []).map((n) => n.idempotencyKey).filter(Boolean));

    // Sort today's active tasks by start time
    const activeTasks = (tasks || [])
      .filter((t) => {
        if (!t.startTime) return false;
        const s = (t.status || '').toLowerCase();
        return s !== 'completed' && s !== 'cancelled' && s !== 'skipped' && s !== 'done';
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    if (activeTasks.length === 0) {
      _isChecking = false;
      return;
    }

    const firstTaskId = String(activeTasks[0].id || activeTasks[0]._id);

    for (const task of activeTasks) {
      const taskId = String(task.id || task._id);
      const [hours, mins] = task.startTime.split(':').map(Number);
      if (isNaN(hours) || isNaN(mins)) continue;

      const durationMinutes = Number(task.durationMinutes || task.duration || 60);

      // Check teaching schedule conflict
      const hasConflict = checkTeachingConflict(todayStr, task.startTime, durationMinutes, teachingSlots);
      if (hasConflict) {
        continue; // Never generate reminder for sessions that overlap with teaching periods
      }

      const taskStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, mins, 0);
      const reminderDate = new Date(taskStartDate.getTime() - leadMinutes * 60 * 1000);
      const formattedStartTime = formatTime12h(task.startTime);
      const formattedReminderTime = formatTime12h(format(reminderDate, 'HH:mm'));

      // Topic, Subject, Course, Area metadata resolution
      const topic = topicMap.get(String(task.topicId));
      const subject = subjectMap.get(String(task.subjectId || topic?.subjectId));
      const course = courseMap.get(String(task.courseId || topic?.courseId || subject?.courseId));
      const area = areaMap.get(String(task.preparationAreaId || topic?.preparationAreaId || subject?.preparationAreaId));

      const topicName = topic?.name || task.topicName || task.title || `Topic #${task.topicId}`;
      const subjectName = subject?.name || task.subjectName || 'Study Subject';
      const courseName = course?.name || 'Standard Course';
      const areaName = area?.name || 'Preparation OS';

      // ── 1. PRE-STUDY REMINDER TRIGGER ────────────────────────────────────────
      const preStudyKey = `pre-study-reminder-${taskId}-${todayStr}`;
      
      // Active window: now >= reminderDate and now < taskStartDate
      if (now >= reminderDate && now < taskStartDate) {
        if (!notifKeys.has(preStudyKey)) {
          const isFirstSession = taskId === firstTaskId;
          const title = '🔔 Upcoming Study Session';
          const message = isFirstSession
            ? `Your first study session today starts in ${leadMinutes} minutes.\n${subjectName} → ${topicName}\nStarts at: ${formattedStartTime} · Duration: ${durationMinutes} min`
            : `Your ${subjectName} — ${topicName} session starts in ${leadMinutes} minutes. Start preparing now.\nStarts at: ${formattedStartTime} · Duration: ${durationMinutes} min`;

          const notifPayload = {
            type: 'study-reminder',
            title,
            message,
            scheduledAt: new Date().toISOString(),
            idempotencyKey: preStudyKey,
            taskId,
            scheduledTime: formattedStartTime,
            reminderTime: formattedReminderTime,
            status: 'sent',
            actionData: {
              topicId: task.topicId,
              subjectId: task.subjectId || topic?.subjectId,
              preparationAreaId: task.preparationAreaId || topic?.preparationAreaId,
              durationMinutes,
              topicName,
              subjectName,
              areaName,
              courseName,
            }
          };

          await addNotification(notifPayload);
          notifKeys.add(preStudyKey);

          // Native Push / OS Tray notification
          await sendNativeNotification({
            title: `🔔 Upcoming: ${subjectName} → ${topicName}`,
            body: `Starts at ${formattedStartTime} (${leadMinutes} min remaining). Tap to start studying!`,
            url: '/sessions',
            tag: preStudyKey
          });
        }
      }

      // ── 2. MISSED STUDY SESSION TRIGGER ──────────────────────────────────────
      const missedKey = `missed-study-${taskId}-${todayStr}`;
      const missedGraceDate = new Date(taskStartDate.getTime() + 5 * 60 * 1000); // 5 mins past scheduled start

      if (now >= missedGraceDate) {
        if (!notifKeys.has(missedKey)) {
          const title = '⚠️ Missed Study Session';
          const message = `Your scheduled session for ${subjectName} → ${topicName} started at ${formattedStartTime}.\n${areaName} · Duration: ${durationMinutes} min`;

          const missedPayload = {
            type: 'missed-session',
            title,
            message,
            scheduledAt: new Date().toISOString(),
            idempotencyKey: missedKey,
            taskId,
            scheduledTime: formattedStartTime,
            status: 'missed',
            actionData: {
              topicId: task.topicId,
              subjectId: task.subjectId || topic?.subjectId,
              preparationAreaId: task.preparationAreaId || topic?.preparationAreaId,
              durationMinutes,
              topicName,
              subjectName,
              areaName,
            }
          };

          await addNotification(missedPayload);
          notifKeys.add(missedKey);

          await sendNativeNotification({
            title: `⚠️ Missed: ${subjectName} → ${topicName}`,
            body: `Scheduled start was ${formattedStartTime}. Tap to start or reschedule.`,
            url: '/sessions',
            tag: missedKey
          });
        }
      }
    }
  } catch (err) {
    console.warn('[SmartReminder] Error in checkPreStudyReminders:', err);
  } finally {
    _isChecking = false;
  }
}

/**
 * Snoozes a reminder notification by X minutes.
 */
export async function snoozeReminder(notificationId, minutes = 5) {
  const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
  await updateNotification(notificationId, {
    status: 'snoozed',
    snoozedUntil,
    read: true,
  });
}

/**
 * Dismisses a reminder notification.
 */
export async function dismissReminder(notificationId) {
  await updateNotification(notificationId, {
    status: 'dismissed',
    dismissed: true,
    read: true,
  });
}

/**
 * Computes the Next Study Session for the Dashboard card.
 */
export function getNextUpcomingStudySession(tasks, subjects, topics, areas, settings, teachingSlots) {
  if (!Array.isArray(tasks) || tasks.length === 0) return null;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const leadMinutes = settings?.studyReminderMinutes !== undefined ? settings.studyReminderMinutes : 5;
  const todayStr = format(now, 'yyyy-MM-dd');

  const topicMap = new Map((topics || []).map((t) => [String(t.id || t._id), t]));
  const subjectMap = new Map((subjects || []).map((s) => [String(s.id || s._id), s]));
  const areaMap = new Map((areas || []).map((a) => [String(a.id || a._id), a]));

  const upcomingTasks = tasks
    .filter((t) => {
      if (!t.startTime) return false;
      const s = (t.status || '').toLowerCase();
      if (s === 'completed' || s === 'cancelled' || s === 'skipped' || s === 'done') return false;

      const [h, m] = t.startTime.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) return false;
      const taskStartMinutes = h * 60 + m;

      // Filter out tasks whose end time has already completely elapsed
      const duration = Number(t.durationMinutes || t.duration || 60);
      return (taskStartMinutes + duration) > currentMinutes;
    })
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

  if (upcomingTasks.length === 0) return null;

  const nextTask = upcomingTasks[0];
  const [h, m] = nextTask.startTime.split(':').map(Number);
  const taskStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  const reminderDate = new Date(taskStartDate.getTime() - leadMinutes * 60 * 1000);

  const topic = topicMap.get(String(nextTask.topicId));
  const subject = subjectMap.get(String(nextTask.subjectId || topic?.subjectId));
  const area = areaMap.get(String(nextTask.preparationAreaId || topic?.preparationAreaId || subject?.preparationAreaId));

  const durationMinutes = Number(nextTask.durationMinutes || nextTask.duration || 60);
  const isConflict = checkTeachingConflict(todayStr, nextTask.startTime, durationMinutes, teachingSlots);

  return {
    taskId: String(nextTask.id || nextTask._id),
    topicId: nextTask.topicId,
    subjectId: nextTask.subjectId || topic?.subjectId,
    preparationAreaId: nextTask.preparationAreaId || topic?.preparationAreaId,
    topicName: topic?.name || nextTask.topicName || nextTask.title || `Topic #${nextTask.topicId}`,
    subjectName: subject?.name || nextTask.subjectName || 'Study Subject',
    areaName: area?.name || 'Preparation OS',
    areaColor: area?.color || 'var(--primary)',
    startTime: formatTime12h(nextTask.startTime),
    rawStartTime: nextTask.startTime,
    durationMinutes,
    reminderTime: formatTime12h(format(reminderDate, 'HH:mm')),
    isConflict,
    task: nextTask,
  };
}

/**
 * Starts the global recurring reminder scheduler.
 */
export function startReminderScheduler() {
  if (_schedulerInterval) return;

  // Run immediately once
  checkPreStudyReminders();

  // Run every 30 seconds
  _schedulerInterval = setInterval(checkPreStudyReminders, 30000);

  // Check immediately on tab focus or visibility change
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkPreStudyReminders();
      }
    });
  }
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', checkPreStudyReminders);
  }
}
