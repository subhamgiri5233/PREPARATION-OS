// src/pages/StudyPlanner.jsx
// Phase 9: Final Smart Daily Routine, Editable Schedule & Smart Reminders

import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import {
  Plus, X, ChevronLeft, ChevronRight, Clock, AlertTriangle,
  Lock, Unlock, Edit3, Trash2, CheckCircle2, Sparkles, User, Zap, RefreshCw
} from 'lucide-react';
import {
  getTasksByDate, addTask, updateTask, deleteTask, getAllTopics, getAllTasks,
  getAllSubjects, getAllAreas, getTeachingSchedule, getAllSessions, getAllMocks, getSettings
} from '../services/db';
import { getRevisionsDueToday } from '../services/revisionService';
import { generateDailyPlan, optimizeDailyRoutine } from '../services/studyPlanningEngine';
import { scanAndMarkMissedTasks, getRescheduleRecommendations } from '../services/reschedulingEngine';

const PRIORITIES = ['High', 'Medium', 'Low'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StudyPlanner() {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [teachingSlots, setTeachingSlots] = useState([]);
  const [settings, setSettings] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showAddTask, setShowAddTask] = useState(null); // date string
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({
    topicId: '', subjectId: '', preparationAreaId: '', title: '',
    startTime: '09:00', endTime: '10:00', durationMinutes: 60,
    priority: 'Medium', notes: '', isLocked: false, source: 'manual', isUserEdited: false
  });
  const [missedTasks, setMissedTasks] = useState([]);
  const [rescheduleRecs, setRescheduleRecs] = useState([]);

  // Regeneration Modal State
  const [regenTargetDate, setRegenTargetDate] = useState(null);
  const [showRegenModal, setShowRegenModal] = useState(false);

  // Conflict Modal State
  const [conflictData, setConflictData] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [t, s, a, ts, sess, sett] = await Promise.all([
      getAllTopics(), getAllSubjects(), getAllAreas(), getTeachingSchedule(), getAllSessions(), getSettings()
    ]);
    setTopics(t); setSubjects(s); setAreas(a); setTeachingSlots(ts); setSessions(sess); setSettings(sett);
    
    // Check for missed tasks globally
    const allTasks = await getAllTasks();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newlyMissed = await scanAndMarkMissedTasks(allTasks, todayStr);
    
    const freshTasks = newlyMissed > 0 ? await getAllTasks() : allTasks;
    const missed = freshTasks.filter((task) => task.status === 'Missed');
    setMissedTasks(missed);
    
    if (missed.length > 0) {
      const recs = await getRescheduleRecommendations(missed, ts, sess, sett, new Date());
      setRescheduleRecs(recs);
    }
    
    await loadTasks();
  };

  const loadTasks = async () => {
    const start = view === 'week' ? startOfWeek(currentDate) : currentDate;
    const end = view === 'week' ? addDays(startOfWeek(currentDate), 6) : currentDate;
    const days = eachDayOfInterval({ start, end });
    const taskArrays = await Promise.all(days.map((d) => getTasksByDate(format(d, 'yyyy-MM-dd'))));
    setTasks(taskArrays.flat());
  };

  useEffect(() => { loadTasks(); }, [currentDate, view]);

  const getTeachingBlocksForDay = (dayOfWeek) => {
    return teachingSlots.filter((s) => {
      if (!s.active) return false;
      const day = s.day || s.dayOfWeek;
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      return day && (day.toLowerCase() === dayName.toLowerCase() || day === dayOfWeek);
    });
  };

  const checkConflict = (dateStr, startTime, endTime, taskIdToIgnore = null) => {
    if (!startTime || !endTime) return null;
    const dateObj = parseISO(dateStr);
    const dayOfWeek = dateObj.getDay();
    const dayName = format(dateObj, 'EEEE');

    // 1. Check Teaching Conflict
    for (const slot of teachingSlots) {
      if (!slot.active) continue;
      const slotDay = slot.day || slot.dayOfWeek;
      if (slotDay && (slotDay.toLowerCase() === dayName.toLowerCase() || slotDay === dayOfWeek)) {
        if (startTime < slot.endTime && endTime > slot.startTime) {
          return { type: 'teaching', title: slot.title || 'Teaching Period', time: `${slot.startTime}–${slot.endTime}` };
        }
      }
    }

    // 2. Check Study Task Overlap
    const dayTasks = tasks.filter((t) => t.date === dateStr && String(t.id || t._id) !== String(taskIdToIgnore));
    for (const other of dayTasks) {
      if (other.startTime && other.endTime) {
        if (startTime < other.endTime && endTime > other.startTime) {
          return { type: 'task', title: other.topicName || other.title || 'Study Session', time: `${other.startTime}–${other.endTime}` };
        }
      }
    }

    return null;
  };

  const getTasksForDate = (dateStr) => tasks.filter((t) => t.date === dateStr);

  const handleOpenAdd = (dateStr) => {
    setEditTask(null);
    setForm({
      type: 'Concept Study',
      topicId: '', subjectId: '', preparationAreaId: '', title: '',
      startTime: '09:00', endTime: '10:00', durationMinutes: 60,
      priority: 'Medium', notes: '', isLocked: false, source: 'manual', isUserEdited: false
    });
    setShowAddTask(dateStr);
  };

  const handleOpenEdit = (task) => {
    setEditTask(task);
    setForm({
      ...task,
      type: task.type || (task.title?.startsWith('🔄') ? 'Revision' : 'Concept Study'),
      topicId: task.topicId || '',
      subjectId: task.subjectId || '',
      preparationAreaId: task.preparationAreaId || '',
      startTime: task.startTime || '09:00',
      endTime: task.endTime || '10:00',
      durationMinutes: task.durationMinutes || 60,
      priority: task.priority || 'Medium',
      notes: task.notes || '',
      isLocked: !!task.isLocked,
      source: task.source || 'auto',
      isUserEdited: task.source === 'auto' ? true : !!task.isUserEdited,
    });
    setShowAddTask(task.date);
  };

  const handleSaveTask = async (forceSave = false) => {
    const targetDate = showAddTask || format(currentDate, 'yyyy-MM-dd');
    
    // Check conflict if not forcing save
    if (!forceSave) {
      const conflict = checkConflict(targetDate, form.startTime, form.endTime, editTask?.id || editTask?._id);
      if (conflict) {
        setConflictData({ conflict, pendingTaskData: form });
        return;
      }
    }

    const topic = topics.find((t) => String(t.id || t._id) === String(form.topicId));
    const subject = subjects.find((s) => String(s.id || s._id) === String(form.subjectId || topic?.subjectId));
    
    // Calculate duration in minutes
    let duration = form.durationMinutes;
    if (form.startTime && form.endTime) {
      const [sh, sm] = form.startTime.split(':').map(Number);
      const [eh, em] = form.endTime.split(':').map(Number);
      duration = Math.max(15, (eh * 60 + em) - (sh * 60 + sm));
    }

    const isRevision = form.type === 'Revision';
    const rawTitle = topic?.name || form.title || 'Study Session';
    const taskTitle = isRevision && !rawTitle.startsWith('🔄')
      ? `🔄 Revision: ${rawTitle}`
      : rawTitle;

    const taskData = {
      ...form,
      date: targetDate,
      durationMinutes: duration,
      type: form.type || 'Concept Study',
      topicName: taskTitle,
      title: taskTitle,
      topicId: topic?.id || topic?._id || form.topicId || null,
      subjectName: subject?.name || 'Study Subject',
      subjectId: subject?.id || subject?._id || form.subjectId || null,
      preparationAreaId: form.preparationAreaId || topic?.preparationAreaId || null,
      status: editTask ? editTask.status : 'Not Started',
      source: editTask?.source === 'auto' ? 'auto' : (editTask?.source || 'manual'),
      isUserEdited: editTask ? true : (form.isUserEdited || false),
      isLocked: !!form.isLocked,
    };

    if (editTask) {
      await updateTask(editTask.id || editTask._id, taskData);
    } else {
      await addTask(taskData);
    }

    setShowAddTask(null);
    setEditTask(null);
    setConflictData(null);
    loadTasks();
  };

  const handleToggleLock = async (task, e) => {
    e.stopPropagation();
    const newLockState = !task.isLocked;
    await updateTask(task.id || task._id, { isLocked: newLockState, isUserEdited: true });
    loadTasks();
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const handleRequestGenerate = (daysAhead = 0) => {
    const targetDate = addDays(new Date(), daysAhead);
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    const dayTasks = getTasksForDate(targetDateStr);

    setCurrentDate(targetDate);

    const hasUserEdits = dayTasks.some((t) => t.isUserEdited || t.isLocked || t.source === 'manual');
    if (hasUserEdits) {
      setRegenTargetDate(targetDate);
      setShowRegenModal(true);
    } else {
      executeGeneratePlan(targetDate, { preserveUserEdits: true });
    }
  };

  const executeGeneratePlan = async (targetDate, options) => {
    setShowRegenModal(false);
    setIsGenerating(true);
    try {
      const [revDue, sess, mocks, sett, allT, allS, allA] = await Promise.all([
        getRevisionsDueToday(),
        getAllSessions(),
        getAllMocks(),
        getSettings(),
        getAllTopics(),
        getAllSubjects(),
        getAllAreas(),
      ]);

      const context = {
        topics: allT && allT.length > 0 ? allT : topics,
        revisionsDue: revDue,
        teachingSlots,
        scheduledTasks: tasks,
        sessions: sess,
        mocks,
        prepAreas: allA && allA.length > 0 ? allA : areas,
        subjects: allS && allS.length > 0 ? allS : subjects,
        settings: sett,
        today: format(new Date(), 'yyyy-MM-dd'),
        vocabToday: 0
      };

      const result = await generateDailyPlan(targetDate, context, options);
      await loadData();
      setCurrentDate(targetDate);
      if (result.success) {
        alert(`✨ Successfully generated daily routine (${result.tasksPlanned} sessions planned, ${Math.round(result.minutesPlanned / 60 * 10) / 10} hours).`);
      } else {
        alert(result.reason || 'No free slots available for this date.');
      }
    } catch (err) {
      console.error('Error generating daily plan:', err);
      alert('Error generating routine: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeDay = async () => {
    const targetDate = currentDate;
    setIsGenerating(true);
    try {
      const [revDue, sess, mocks, sett, allT, allS, allA] = await Promise.all([
        getRevisionsDueToday(),
        getAllSessions(),
        getAllMocks(),
        getSettings(),
        getAllTopics(),
        getAllSubjects(),
        getAllAreas(),
      ]);

      const context = {
        topics: allT && allT.length > 0 ? allT : topics,
        revisionsDue: revDue,
        teachingSlots,
        scheduledTasks: tasks,
        sessions: sess,
        mocks,
        prepAreas: allA && allA.length > 0 ? allA : areas,
        subjects: allS && allS.length > 0 ? allS : subjects,
        settings: sett,
        today: format(new Date(), 'yyyy-MM-dd'),
        vocabToday: 0
      };

      const result = await optimizeDailyRoutine(targetDate, context);
      await loadData();
      if (result.success) {
        alert(`⚡ Routine optimized! Preserved your fixed commitments & filled available study gaps (${result.tasksPlanned} sessions).`);
      }
    } catch (err) {
      console.error('Error optimizing day:', err);
      alert('Error optimizing routine: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Compute daily hours stats for current date
  const currentDateStr = format(currentDate, 'yyyy-MM-dd');
  const currentDayTasks = getTasksForDate(currentDateStr);
  const targetStudyHours = settings?.dailyStudyHours || 8;
  
  let plannedMinutesToday = 0;
  let completedMinutesToday = 0;
  for (const t of currentDayTasks) {
    const dur = Number(t.durationMinutes || 60);
    plannedMinutesToday += dur;
    if ((t.status || '').toLowerCase() === 'completed') {
      completedMinutesToday += dur;
    }
  }
  const plannedHoursToday = Math.round((plannedMinutesToday / 60) * 10) / 10;
  const completedHoursToday = Math.round((completedMinutesToday / 60) * 10) / 10;
  const remainingHoursToday = Math.max(0, Math.round((plannedHoursToday - completedHoursToday) * 10) / 10);

  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 14 }}>
        <div className="page-header-left">
          <h1 className="page-title">Smart Study Planner & Daily Routine</h1>
          <p className="page-subtitle">Auto-generated intelligent routine with full editing control</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" disabled={isGenerating} onClick={() => handleRequestGenerate(0)}>
            <Sparkles size={14} /> {isGenerating ? 'Generating...' : 'Generate Today'}
          </button>
          <button className="btn btn-ghost" disabled={isGenerating} onClick={() => handleRequestGenerate(1)}>
            <Sparkles size={14} /> {isGenerating ? 'Generating...' : 'Generate Tomorrow'}
          </button>
          <button className="btn btn-ghost" disabled={isGenerating} onClick={handleOptimizeDay} title="Optimize remaining gaps while preserving your edits">
            <Zap size={14} /> {isGenerating ? 'Optimizing...' : 'Optimize My Day'}
          </button>
          <div className="tabs">
            {['day', 'week'].map((v) => (
              <button key={v} className={`tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenAdd(format(currentDate, 'yyyy-MM-dd'))}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* ── DAILY TARGET & PLANNED HOURS SUMMARY BAR ──────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12,
        background: 'var(--surface-2)', padding: '12px 18px', borderRadius: 'var(--radius)',
        border: '1px solid var(--border)', marginBottom: 16, alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Daily Goal</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--primary-light)' }}>{targetStudyHours}h Target</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Planned Routine</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: plannedHoursToday >= targetStudyHours ? 'var(--success)' : 'var(--warning)' }}>
            {plannedHoursToday}h Planned
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Completed Today</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)' }}>{completedHoursToday}h Done</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Remaining</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: remainingHoursToday > 0 ? 'var(--text)' : 'var(--success)' }}>
            {remainingHoursToday}h Remaining
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate((d) => view === 'week' ? addDays(d, -7) : addDays(d, -1))}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {view === 'week'
            ? `${format(weekStart, 'MMM d')} – ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`
            : format(currentDate, 'EEEE, MMMM d, yyyy')}
        </span>
        <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate((d) => view === 'week' ? addDays(d, 7) : addDays(d, 1))}>
          <ChevronRight size={16} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(new Date())}>Today</button>
      </div>

      {/* Missed Tasks Banner */}
      {missedTasks.length > 0 && (
        <div style={{ background: 'var(--danger-glass)', border: '1px solid var(--danger)', padding: 14, borderRadius: 'var(--radius)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontWeight: 700, marginBottom: 6 }}>
            <AlertTriangle size={16} /> You have {missedTasks.length} missed study task(s)
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            {rescheduleRecs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rescheduleRecs.slice(0, 2).map((rec, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                    <span>Reschedule <strong>{rec.task.title}</strong> to {format(parseISO(rec.suggestedDate), 'MMM d')} at {rec.suggestedStartTime}</span>
                    <button className="btn btn-xs btn-ghost" onClick={async () => {
                      await updateTask(rec.task.id, { date: rec.suggestedDate, startTime: rec.suggestedStartTime, endTime: rec.suggestedEndTime, status: 'Not Started' });
                      loadData();
                    }}>Accept</button>
                  </div>
                ))}
              </div>
            ) : (
              <span>No available slots found to auto-reschedule. Please review manually.</span>
            )}
          </div>
        </div>
      )}

      {/* Teaching legend & Provenance Badges Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, fontSize: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, background: 'var(--warning)', opacity: 0.7, borderRadius: 2 }} />
          Teaching (unavailable)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="badge badge-primary" style={{ fontSize: 10 }}>✨ AI Generated</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="badge badge-warning" style={{ fontSize: 10 }}>✏️ Edited by You</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="badge badge-muted" style={{ fontSize: 10 }}>👤 Manually Added</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="badge" style={{ fontSize: 10, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>🔒 Locked</span>
        </div>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayOfWeek = day.getDay();
            const dayTasks = getTasksForDate(dateStr);
            const teachingBlocks = getTeachingBlocksForDay(dayOfWeek);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={dateStr}
                style={{
                  background: isToday ? 'var(--primary-glass)' : 'var(--card)',
                  border: `1px solid ${isToday ? 'var(--border-accent)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-lg)',
                  padding: 10,
                  minHeight: 220,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 700 }}>{DAY_NAMES[dayOfWeek]}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: isToday ? 'var(--primary-light)' : 'var(--text)' }}>
                      {format(day, 'd')}
                    </div>
                  </div>
                </div>

                {/* Teaching blocks */}
                {teachingBlocks.map((block, i) => (
                  <div key={i} style={{
                    background: 'var(--warning-glass)', border: '1px solid var(--warning)',
                    borderRadius: 'var(--radius-sm)', padding: '4px 6px', marginBottom: 4,
                    fontSize: 10, color: 'var(--warning)', fontWeight: 600,
                  }}>
                    🏫 {block.startTime}–{block.endTime}
                  </div>
                ))}

                {/* Study Tasks */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayTasks.map((task) => {
                    const isAi = task.source === 'auto' && !task.isUserEdited;
                    const isEdited = !!task.isUserEdited;
                    const isLocked = !!task.isLocked;

                    return (
                      <div
                        key={task.id || task._id}
                        style={{
                          background: task.status === 'Completed' ? 'var(--success-glass)' : 'var(--surface-2)',
                          border: `1px solid ${task.status === 'Completed' ? 'var(--success)' : isLocked ? '#ef4444' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)', padding: '6px 8px',
                          fontSize: 11, cursor: 'pointer', position: 'relative',
                        }}
                        onClick={() => handleOpenEdit(task)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                            {task.topicName || task.title}
                          </span>
                          <button
                            onClick={(e) => handleToggleLock(task, e)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: isLocked ? '#ef4444' : 'var(--text-3)' }}
                            title={isLocked ? 'Locked (will not be moved)' : 'Unlocked'}
                          >
                            {isLocked ? <Lock size={11} /> : <Unlock size={11} />}
                          </button>
                        </div>

                        <div style={{ color: 'var(--text-2)', fontSize: 10, marginBottom: 3 }}>
                          {task.startTime}–{task.endTime} ({task.durationMinutes || 60}m)
                        </div>

                        {/* Provenance Badge */}
                        <div>
                          {isLocked ? (
                            <span className="badge" style={{ fontSize: 8, padding: '1px 4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>🔒 Locked</span>
                          ) : isEdited ? (
                            <span className="badge badge-warning" style={{ fontSize: 8, padding: '1px 4px' }}>✏️ Edited</span>
                          ) : isAi ? (
                            <span className="badge badge-primary" style={{ fontSize: 8, padding: '1px 4px' }}>✨ AI</span>
                          ) : (
                            <span className="badge badge-muted" style={{ fontSize: 8, padding: '1px 4px' }}>👤 Manual</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  style={{ width: '100%', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', marginTop: 6 }}
                  onClick={() => handleOpenAdd(dateStr)}
                >
                  + Add Task
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {view === 'day' && (
        <DayView
          date={currentDate}
          tasks={getTasksForDate(format(currentDate, 'yyyy-MM-dd'))}
          teachingBlocks={getTeachingBlocksForDay(currentDate.getDay())}
          onAddTask={() => handleOpenAdd(format(currentDate, 'yyyy-MM-dd'))}
          onEditTask={handleOpenEdit}
          onToggleLock={handleToggleLock}
          onCompleteTask={async (taskId) => {
            await updateTask(taskId, { status: 'Completed', completedAt: new Date().toISOString() });
            loadTasks();
          }}
          onDeleteTask={async (taskId) => {
            await deleteTask(taskId);
            loadTasks();
          }}
        />
      )}

      {/* Add / Edit Task Modal */}
      {showAddTask && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && (setShowAddTask(null), setEditTask(null))}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editTask ? 'Edit Study Session' : 'Add Study Task'}</h2>
              <button className="modal-close" onClick={() => { setShowAddTask(null); setEditTask(null); }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface-2)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <span>📅 {showAddTask}</span>
                {editTask && (
                  <span>Provenance: <strong>{editTask.source === 'auto' ? (editTask.isUserEdited ? 'Edited AI' : 'AI Generated') : 'Manual'}</strong></span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Preparation Area</label>
                <select className="form-select" value={form.preparationAreaId} onChange={(e) => setForm({ ...form, preparationAreaId: e.target.value })}>
                  <option value="">Select Area...</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {/* Session Type: Concept Study vs Revision */}
              <div className="form-group">
                <label className="form-label">Session Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${form.type !== 'Revision' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: 12, justifyContent: 'center' }}
                    onClick={() => setForm({ ...form, type: 'Concept Study', topicId: '' })}
                  >
                    📚 Concept Study
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${form.type === 'Revision' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: 12, justifyContent: 'center' }}
                    onClick={() => setForm({ ...form, type: 'Revision', topicId: '' })}
                  >
                    🔄 Revision (Completed)
                  </button>
                </div>
                {form.type === 'Revision' && (
                  <div style={{ fontSize: 11, color: 'var(--primary-light)', marginTop: 4 }}>
                    ✨ Showing completed topics for spaced repetition revision.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  {form.type === 'Revision' ? 'Completed Topic for Revision *' : 'Topic *'}
                </label>
                <select
                  className="form-select"
                  value={form.topicId}
                  onChange={(e) => setForm({ ...form, topicId: e.target.value })}
                >
                  <option value="">
                    {form.type === 'Revision' ? 'Select completed topic to revise…' : 'Select topic…'}
                  </option>
                  {(() => {
                    const areaFiltered = topics.filter(
                      (t) => !form.preparationAreaId || String(t.preparationAreaId) === String(form.preparationAreaId)
                    );
                    const list =
                      form.type === 'Revision'
                        ? areaFiltered.filter(
                            (t) => (t.status || '').toLowerCase() === 'completed' || (Number(t.studyHours) || 0) > 0
                          )
                        : areaFiltered;

                    if (form.type === 'Revision' && list.length === 0) {
                      return (
                        <>
                          <option disabled value="">(No completed topics yet — showing all)</option>
                          {areaFiltered.map((t) => (
                            <option key={t.id || t._id} value={t.id || t._id}>
                              {t.name} ({t.status || 'Not Started'})
                            </option>
                          ))}
                        </>
                      );
                    }

                    return list.map((t) => (
                      <option key={t.id || t._id} value={t.id || t._id}>
                        {t.name} {((t.status || '').toLowerCase() === 'completed') ? '✅ (Completed)' : ''}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="form-input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="form-input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Lock Time 🔒</label>
                  <button
                    type="button"
                    className={`btn ${form.isLocked ? 'btn-danger' : 'btn-ghost'}`}
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={() => setForm({ ...form, isLocked: !form.isLocked })}
                  >
                    {form.isLocked ? '🔒 Time Locked' : '🔓 Unlocked'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Focus points, questions, reminders..."
                  value={form.notes || ''}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAddTask(null); setEditTask(null); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSaveTask(false)}>
                  {editTask ? 'Save Changes' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CONFLICT DETECTION MODAL ──────────────────────────────── */}
      {conflictData && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420, border: '1px solid var(--danger)' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={18} /> Schedule Conflict
              </h2>
              <button className="modal-close" onClick={() => setConflictData(null)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 13, color: 'var(--text)' }}>
                This study session overlaps with:
              </p>
              <div style={{ background: 'var(--danger-glass)', border: '1px solid var(--danger)', padding: 12, borderRadius: 'var(--radius)', fontSize: 13 }}>
                <strong>{conflictData.conflict.title}</strong>
                <div style={{ color: 'var(--text-2)', marginTop: 2 }}>Time: {conflictData.conflict.time}</div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
                How would you like to proceed?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // Move automatically 1 hour ahead
                    const [eh, em] = (conflictData.conflict.time.split('–')[1] || '11:00').trim().split(':').map(Number);
                    const newStart = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                    const newEnd = `${String(eh + 1).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
                    setForm({ ...form, startTime: newStart, endTime: newEnd });
                    setConflictData(null);
                  }}
                >
                  Move Automatically
                </button>
                <button className="btn btn-ghost" onClick={() => setConflictData(null)}>
                  Choose Another Time
                </button>
                <button className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleSaveTask(true)}>
                  Save Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── REGENERATION PRESERVATION MODAL ───────────────────────── */}
      {showRegenModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--primary-light)" /> Regenerate Study Routine
              </h2>
              <button className="modal-close" onClick={() => setShowRegenModal(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ fontSize: 13, color: 'var(--text)' }}>
                Some study sessions have been manually edited or locked. Do you want to preserve your changes?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => executeGeneratePlan(regenTargetDate, { preserveUserEdits: true })}
                >
                  ✓ Preserve My Changes (Recommended)
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ color: 'var(--danger)' }}
                  onClick={() => executeGeneratePlan(regenTargetDate, { preserveUserEdits: false })}
                >
                  Regenerate Everything
                </button>
                <button className="btn btn-ghost" onClick={() => setShowRegenModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DayView({ date, tasks, teachingBlocks, onAddTask, onEditTask, onToggleLock, onCompleteTask, onDeleteTask }) {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{format(date, 'EEEE, MMMM d, yyyy')}</div>
        <button className="btn btn-sm btn-primary" onClick={onAddTask}><Plus size={12} /> Add Task</button>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 650 }}>
        {hours.map((hour) => {
          const timeStr = `${String(hour).padStart(2, '0')}:00`;
          const isTeaching = teachingBlocks.some((b) => {
            const sh = parseInt((b.startTime || '00:00').split(':')[0], 10);
            const eh = parseInt((b.endTime || '00:00').split(':')[0], 10);
            return hour >= sh && hour < eh;
          });
          const hourTasks = tasks.filter((t) => t.startTime && parseInt(t.startTime.split(':')[0], 10) === hour);

          return (
            <div key={hour} style={{
              display: 'flex', minHeight: 64,
              borderBottom: '1px solid var(--border)',
              background: isTeaching ? 'var(--warning-glass)' : 'transparent',
            }}>
              <div style={{ width: 64, padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', flexShrink: 0, borderRight: '1px solid var(--border)', fontWeight: 600 }}>
                {timeStr}
              </div>
              <div style={{ flex: 1, padding: '6px 12px', display: 'flex', gap: 8, flexWrap: 'wrap', alignContent: 'flex-start' }}>
                {isTeaching && (
                  <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    🏫 Teaching Period (unavailable)
                  </div>
                )}
                {hourTasks.map((task) => {
                  const isAi = task.source === 'auto' && !task.isUserEdited;
                  const isEdited = !!task.isUserEdited;
                  const isLocked = !!task.isLocked;

                  return (
                    <div key={task.id || task._id} style={{
                      background: task.status === 'Completed' ? 'var(--success-glass)' : 'var(--card)',
                      border: `1px solid ${task.status === 'Completed' ? 'var(--success)' : isLocked ? '#ef4444' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: 12,
                      display: 'flex', gap: 8, alignItems: 'center',
                    }}>
                      <button
                        onClick={(e) => onToggleLock(task, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: isLocked ? '#ef4444' : 'var(--text-3)', padding: 0 }}
                        title={isLocked ? 'Locked' : 'Unlocked'}
                      >
                        {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>

                      <span style={{ fontWeight: 700 }} onClick={() => onEditTask(task)}>
                        {task.topicName || task.title}
                      </span>
                      
                      <span style={{ color: 'var(--text-2)', fontSize: 11 }}>
                        {task.startTime}–{task.endTime}
                      </span>

                      {/* Provenance */}
                      {isLocked ? (
                        <span className="badge" style={{ fontSize: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>🔒</span>
                      ) : isEdited ? (
                        <span className="badge badge-warning" style={{ fontSize: 8 }}>✏️ Edited</span>
                      ) : isAi ? (
                        <span className="badge badge-primary" style={{ fontSize: 8 }}>✨ AI</span>
                      ) : (
                        <span className="badge badge-muted" style={{ fontSize: 8 }}>👤 Manual</span>
                      )}

                      <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                        <button
                          className="btn btn-xs btn-ghost"
                          onClick={() => onEditTask(task)}
                          title="Edit Task"
                        >
                          <Edit3 size={11} />
                        </button>
                        {task.status !== 'Completed' && (
                          <button
                            className="btn btn-xs btn-ghost"
                            style={{ color: 'var(--success)' }}
                            onClick={() => onCompleteTask(task.id || task._id)}
                            title="Mark Complete"
                          >
                            <CheckCircle2 size={12} />
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-ghost"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => onDeleteTask(task.id || task._id)}
                          title="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
