// src/services/availabilityEngine.js
import { format, parse, addMinutes, differenceInMinutes, isBefore, isEqual, isAfter } from 'date-fns';

/**
 * Parses a "HH:mm" time string into a Date object on a reference date.
 */
function parseTime(timeStr, referenceDate) {
  return parse(timeStr, 'HH:mm', referenceDate);
}

/**
 * Calculates available time blocks for a given date.
 * 
 * @param {Date} date The date to calculate availability for
 * @param {Array} teachingSlots All teaching slots
 * @param {Array} scheduledTasks All tasks scheduled for this date
 * @param {Array} sessions Active/completed sessions for this date
 * @param {Object} settings User settings (preferred start/end times)
 * @returns {Array<{start: string, end: string, durationMinutes: number}>}
 */
export function calculateAvailableSlots(date, teachingSlots, scheduledTasks, sessions, settings) {
  const dayOfWeek = date.getDay();
  const dateStr = format(date, 'yyyy-MM-dd');
  
  // 1. Determine overall bounded window for the day
  const prefStartStr = settings?.preferredStartTime || '06:00';
  const prefEndStr = settings?.preferredEndTime || '22:00';
  
  const windowStart = parseTime(prefStartStr, date);
  const windowEnd = parseTime(prefEndStr, date);

  // 2. Gather all blocked periods
  const blocks = [];

  // Teaching periods
  const todaysTeaching = teachingSlots.filter((s) => s.dayOfWeek === dayOfWeek);
  todaysTeaching.forEach((t) => {
    blocks.push({
      start: parseTime(t.startTime, date),
      end: parseTime(t.endTime, date),
    });
  });

  // Scheduled tasks (that are not missed/skipped)
  const todaysTasks = scheduledTasks.filter((t) => 
    t.date === dateStr && t.status !== 'Skipped' && t.status !== 'Missed'
  );
  todaysTasks.forEach((t) => {
    if (t.startTime && t.endTime) {
      blocks.push({
        start: parseTime(t.startTime, date),
        end: parseTime(t.endTime, date),
      });
    }
  });

  // Active/past sessions 
  // (Usually sessions overlap with tasks, but we add them to be safe if manual sessions exist)
  const todaysSessions = sessions.filter((s) => s.startTime && s.startTime.startsWith(dateStr));
  todaysSessions.forEach((s) => {
    const sStart = new Date(s.startTime);
    const sEnd = s.endTime ? new Date(s.endTime) : addMinutes(sStart, s.durationMinutes || 60);
    blocks.push({ start: sStart, end: sEnd });
  });

  // 3. Merge overlapping blocks
  blocks.sort((a, b) => a.start.getTime() - b.start.getTime());
  const mergedBlocks = [];
  if (blocks.length > 0) {
    let current = blocks[0];
    for (let i = 1; i < blocks.length; i++) {
      if (isBefore(blocks[i].start, current.end) || isEqual(blocks[i].start, current.end)) {
        if (isAfter(blocks[i].end, current.end)) {
          current.end = blocks[i].end;
        }
      } else {
        mergedBlocks.push(current);
        current = blocks[i];
      }
    }
    mergedBlocks.push(current);
  }

  // 4. Invert blocks to find free slots within the bounded window
  const freeSlots = [];
  let currentTime = windowStart;

  // If calculating for TODAY, adjust current time to NOW (rounded up to next 15 mins) if NOW is after preferred start
  if (format(new Date(), 'yyyy-MM-dd') === dateStr) {
    const now = new Date();
    if (isAfter(now, windowStart)) {
      // Round up to nearest 15 mins to avoid weird 3-minute slots
      const ms = 1000 * 60 * 15;
      const roundedNow = new Date(Math.ceil(now.getTime() / ms) * ms);
      currentTime = isAfter(roundedNow, windowStart) ? roundedNow : windowStart;
    }
  }

  mergedBlocks.forEach((block) => {
    if (isBefore(currentTime, block.start)) {
      // Free slot from currentTime to block.start
      const duration = differenceInMinutes(block.start, currentTime);
      if (duration >= 15) { // Minimum practical study block
        freeSlots.push({
          start: format(currentTime, 'HH:mm'),
          end: format(block.start, 'HH:mm'),
          durationMinutes: duration,
        });
      }
    }
    if (isBefore(currentTime, block.end)) {
      currentTime = block.end;
    }
  });

  // Final slot from last block end to window end
  if (isBefore(currentTime, windowEnd)) {
    const duration = differenceInMinutes(windowEnd, currentTime);
    if (duration >= 15) {
      freeSlots.push({
        start: format(currentTime, 'HH:mm'),
        end: format(windowEnd, 'HH:mm'),
        durationMinutes: duration,
      });
    }
  }

  return freeSlots;
}

/**
 * Chunks large free slots into preferred study block sizes.
 * Defaults to 60, 90, 45, 30.
 */
export function chunkSlots(slots, blockPreferences = [60, 45, 30]) {
  const chunked = [];
  
  slots.forEach((slot) => {
    let remaining = slot.durationMinutes;
    let currentStart = slot.start;
    const dateRef = new Date(`1970-01-01T${currentStart}:00`);

    while (remaining >= Math.min(...blockPreferences)) {
      // Find largest preference that fits, or fall back to remaining if it's acceptable
      let blockDuration = blockPreferences.find(p => p <= remaining) || remaining;
      
      const nextEnd = addMinutes(dateRef, blockDuration);
      const nextEndStr = format(nextEnd, 'HH:mm');

      chunked.push({
        start: currentStart,
        end: nextEndStr,
        durationMinutes: blockDuration,
      });

      remaining -= blockDuration;
      currentStart = nextEndStr;
      dateRef.setTime(nextEnd.getTime());
    }
  });

  return chunked;
}
