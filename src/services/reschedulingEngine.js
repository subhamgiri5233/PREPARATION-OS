// src/services/reschedulingEngine.js
import { updateTask, getTasksByDate } from './db.js';
import { calculateAvailableSlots } from './availabilityEngine.js';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';

/**
 * Scans for tasks that were scheduled in the past but not completed,
 * and marks them as 'Missed'.
 * 
 * @param {Array} allTasks All tasks from the database
 * @param {string} today YYYY-MM-DD
 */
export async function scanAndMarkMissedTasks(allTasks, today) {
  const missedTasks = allTasks.filter(t => 
    t.date < today && 
    (t.status === 'Not Started' || t.status === 'In Progress')
  );

  for (const task of missedTasks) {
    await updateTask(task.id, { status: 'Missed' });
  }
  
  return missedTasks.length;
}

/**
 * Generates recommendations for rescheduling missed tasks.
 * Looks for the next available slot that fits the task.
 */
export async function getRescheduleRecommendations(missedTasks, teachingSlots, allSessions, settings, todayDate) {
  const recommendations = [];
  
  for (const task of missedTasks) {
    // Start looking from today up to 7 days ahead
    let foundSlot = false;
    for (let i = 0; i < 7; i++) {
      const checkDate = addDays(todayDate, i);
      const checkDateStr = format(checkDate, 'yyyy-MM-dd');
      
      const dayTasks = await getTasksByDate(checkDateStr);
      const freeSlots = calculateAvailableSlots(checkDate, teachingSlots, dayTasks, allSessions, settings);
      
      // Calculate original duration
      let requiredMins = 60; // fallback
      if (task.startTime && task.endTime) {
        const [sh, sm] = task.startTime.split(':').map(Number);
        const [eh, em] = task.endTime.split(':').map(Number);
        requiredMins = (eh * 60 + em) - (sh * 60 + sm);
      }
      
      // Find a slot that fits
      const fittingSlot = freeSlots.find(s => s.durationMinutes >= requiredMins);
      if (fittingSlot) {
        recommendations.push({
          task,
          suggestedDate: checkDateStr,
          suggestedStartTime: fittingSlot.start,
          // Estimate end time
          suggestedEndTime: format(addDays(parseISO(`${checkDateStr}T${fittingSlot.start}:00`), 0).getTime() + requiredMins * 60000, 'HH:mm'),
        });
        foundSlot = true;
        break;
      }
    }
  }
  
  return recommendations;
}
