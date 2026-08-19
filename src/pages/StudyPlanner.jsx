// src/pages/StudyPlanner.jsx
import { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Plus, X, ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';
import {
  getTasksByDate, addTask, updateTask, deleteTask, getAllTopics, getAllTasks,
  getAllSubjects, getAllAreas, getTeachingSchedule, getAllSessions, getAllMocks, getSettings
} from '../services/db';
import { getRevisionsDueToday } from '../services/revisionService';
import { generateDailyPlan } from '../services/studyPlanningEngine';
import { scanAndMarkMissedTasks, getRescheduleRecommendations } from '../services/reschedulingEngine';
import { useAppStore } from '../store/useAppStore';

const PRIORITIES = ['High', 'Medium', 'Low'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudyPlanner() {
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [teachingSlots, setTeachingSlots] = useState([]);
  const [showAddTask, setShowAddTask] = useState(null); // date string
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ topicId: '', subjectId: '', preparationAreaId: '', title: '', startTime: '09:00', endTime: '10:00', priority: 'Medium', notes: '' });
  const [missedTasks, setMissedTasks] = useState([]);
  const [rescheduleRecs, setRescheduleRecs] = useState([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [t, s, a, ts, sessions, settings] = await Promise.all([
      getAllTopics(), getAllSubjects(), getAllAreas(), getTeachingSchedule(), getAllSessions(), getSettings()
    ]);
    setTopics(t); setSubjects(s); setAreas(a); setTeachingSlots(ts);
    
    // Check for missed tasks globally
    const allTasks = await getAllTasks();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newlyMissed = await scanAndMarkMissedTasks(allTasks, todayStr);
    
    // Refresh all tasks if we mutated them
    const freshTasks = newlyMissed > 0 ? await getAllTasks() : allTasks;
    const missed = freshTasks.filter(task => task.status === 'Missed');
    setMissedTasks(missed);
    
    if (missed.length > 0) {
      const recs = await getRescheduleRecommendations(missed, ts, sessions, settings, new Date());
      setRescheduleRecs(recs);
    }
    
    await loadTasks();
  };

  const loadTasks = async () => {
    // Load tasks for visible range
    const start = view === 'week' ? startOfWeek(currentDate) : currentDate;
    const end = view === 'week' ? addDays(startOfWeek(currentDate), 6) : currentDate;
    const days = eachDayOfInterval({ start, end });
    const taskArrays = await Promise.all(days.map((d) => getTasksByDate(format(d, 'yyyy-MM-dd'))));
    setTasks(taskArrays.flat());
  };

  useEffect(() => { loadTasks(); }, [currentDate, view]);

  const getTeachingBlocksForDay = (dayOfWeek) => {
    return teachingSlots.filter((s) => s.dayOfWeek === dayOfWeek);
  };

  const isTeachingTime = (dayOfWeek, time) => {
    const blocks = getTeachingBlocksForDay(dayOfWeek);
    return blocks.some((b) => time >= b.startTime && time < b.endTime);
  };

  const getTasksForDate = (dateStr) => tasks.filter((t) => t.date === dateStr);

  const handleAddTask = async () => {
    const topic = topics.find((t) => String(t.id || t._id) === String(form.topicId));
    const subject = subjects.find((s) => String(s.id || s._id) === String(form.subjectId));
    const taskData = {
      ...form,
      date: showAddTask || format(currentDate, 'yyyy-MM-dd'),
      topicName: topic?.name,
      topicId: topic?.id || topic?._id || form.topicId,
      subjectName: subject?.name,
      subjectId: subject?.id || subject?._id || form.subjectId,
      preparationAreaId: form.preparationAreaId || null,
      status: 'Not Started',
    };
    if (editTask) {
      await updateTask(editTask.id, taskData);
    } else {
      await addTask(taskData);
    }
    setShowAddTask(null);
    setEditTask(null);
    setForm({ topicId: '', subjectId: '', preparationAreaId: '', title: '', startTime: '09:00', endTime: '10:00', priority: 'Medium', notes: '' });
    loadTasks();
  };

  const handleGeneratePlan = async (daysAhead = 0) => {
    const targetDate = addDays(new Date(), daysAhead);
    
    // Fetch context
    const [revDue, sessions, mocks, settings] = await Promise.all([
      getRevisionsDueToday(),
      getAllSessions(),
      getAllMocks(),
      getSettings()
    ]);
    
    const context = {
      topics,
      revisionsDue: daysAhead === 0 ? revDue : [], // Simplify: only apply revisions if planning for today
      teachingSlots,
      scheduledTasks: tasks,
      sessions,
      mocks,
      prepAreas: areas,
      subjects,
      settings,
      today: format(new Date(), 'yyyy-MM-dd'),
      vocabToday: 0 // Simplification for planner
    };
    
    const result = await generateDailyPlan(targetDate, context);
    if (result.success) {
      alert(`Successfully planned ${result.tasksPlanned} tasks (${result.minutesPlanned} mins) for ${format(targetDate, 'MMM d')}.`);
      loadTasks();
    } else {
      alert(result.reason || 'Failed to generate plan.');
    }
  };

  const weekStart = startOfWeek(currentDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Study Planner</h1>
          <p className="page-subtitle">Schedule your study sessions around teaching periods</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => handleGeneratePlan(0)}>
            ✨ Generate Today
          </button>
          <button className="btn btn-ghost" onClick={() => handleGeneratePlan(1)}>
            ✨ Generate Tomorrow
          </button>
          <div className="tabs">
            {['day', 'week'].map((v) => (
              <button key={v} className={`tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddTask(format(currentDate, 'yyyy-MM-dd'))}>
            <Plus size={14} /> Add Task
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate((d) => view === 'week' ? addDays(d, -7) : addDays(d, -1))}>
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 600 }}>
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
        <div style={{ background: 'var(--danger-glass)', border: '1px solid var(--danger)', padding: 16, borderRadius: 'var(--radius)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontWeight: 600, marginBottom: 8 }}>
            <AlertTriangle size={16} /> You have {missedTasks.length} missed study task(s)
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
            {rescheduleRecs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rescheduleRecs.slice(0, 2).map((rec, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                    <span>Reschedule <strong>{rec.task.title}</strong> to {format(parseISO(rec.suggestedDate), 'MMM d')} at {rec.suggestedStartTime}</span>
                    <button className="btn btn-sm btn-ghost" onClick={async () => {
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

      {/* Teaching legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, background: 'var(--warning)', opacity: 0.7, borderRadius: 2 }} />
          Teaching Period (unavailable)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 12, height: 12, background: 'var(--primary)', borderRadius: 2 }} />
          Study Task
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
                  padding: 12,
                  minHeight: 200,
                }}
              >
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 600 }}>{DAY_NAMES[dayOfWeek]}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? 'var(--primary-light)' : 'var(--text)' }}>
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Teaching blocks */}
                {teachingBlocks.map((block, i) => (
                  <div key={i} style={{
                    background: 'var(--warning-glass)', border: '1px solid var(--warning)',
                    borderRadius: 'var(--radius-sm)', padding: '4px 6px', marginBottom: 4,
                    fontSize: 10, color: 'var(--warning)',
                  }}>
                    🏫 {block.startTime}–{block.endTime}
                  </div>
                ))}

                {/* Tasks */}
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: task.status === 'Completed' ? 'var(--success-glass)' : 'var(--primary-glass)',
                      border: `1px solid ${task.status === 'Completed' ? 'var(--success)' : 'var(--primary)'}`,
                      borderRadius: 'var(--radius-sm)', padding: '4px 6px', marginBottom: 4,
                      fontSize: 10, cursor: 'pointer',
                    }}
                    onClick={() => { setEditTask(task); setForm({ ...task }); setShowAddTask(task.date); }}
                  >
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.topicName || task.title || 'Task'}
                    </div>
                    <div style={{ color: 'var(--text-2)' }}>{task.startTime}–{task.endTime}</div>
                  </div>
                ))}

                <button
                  style={{ width: '100%', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', background: 'transparent', color: 'var(--text-3)', fontSize: 11, cursor: 'pointer', marginTop: 4 }}
                  onClick={() => setShowAddTask(dateStr)}
                >
                  + Add
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
          onAddTask={() => setShowAddTask(format(currentDate, 'yyyy-MM-dd'))}
          onEditTask={(task) => { setEditTask(task); setForm({ ...task }); setShowAddTask(task.date); }}
          onCompleteTask={async (taskId) => {
            await updateTask(taskId, { status: 'Completed' });
            loadTasks();
          }}
          onDeleteTask={async (taskId) => {
            await deleteTask(taskId);
            loadTasks();
          }}
        />
      )}

      {/* Add/Edit Task Modal */}
      {showAddTask && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && (setShowAddTask(null), setEditTask(null))}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editTask ? 'Edit Task' : 'Add Study Task'}</h2>
              <button className="modal-close" onClick={() => { setShowAddTask(null); setEditTask(null); }}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--surface)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                📅 {showAddTask}
              </div>
              <div className="form-group">
                <label className="form-label">Preparation Area</label>
                <select className="form-select" value={form.preparationAreaId} onChange={(e) => setForm({ ...form, preparationAreaId: e.target.value })}>
                  <option value="">Select...</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Topic</label>
                <select className="form-select" value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })}>
                  <option value="">Select topic...</option>
                  {topics.filter((t) => !form.preparationAreaId || String(t.preparationAreaId) === String(form.preparationAreaId))
                    .map((t) => <option key={t.id || t._id} value={t.id || t._id}>{t.name}</option>)}
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
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {form.topicId && form.startTime && form.endTime && isTeachingTime(new Date(showAddTask + 'T00:00:00').getDay(), form.startTime) && (
                <div style={{ background: 'var(--warning-glass)', border: '1px solid var(--warning)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 12, color: 'var(--warning)' }}>
                  ⚠️ Warning: This overlaps with a teaching period!
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setShowAddTask(null); setEditTask(null); }}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAddTask}>
                  {editTask ? 'Update' : 'Add Task'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DayView({ date, tasks, teachingBlocks, onAddTask, onEditTask, onCompleteTask, onDeleteTask }) {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{format(date, 'EEEE, MMMM d')}</div>
        <button className="btn btn-sm btn-primary" onClick={onAddTask}><Plus size={12} /> Add Task</button>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 600 }}>
        {hours.map((hour) => {
          const timeStr = `${String(hour).padStart(2, '0')}:00`;
          const isTeaching = teachingBlocks.some((b) => hour >= parseInt(b.startTime) && hour < parseInt(b.endTime));
          const hourTasks = tasks.filter((t) => t.startTime && parseInt(t.startTime.split(':')[0]) === hour);

          return (
            <div key={hour} style={{
              display: 'flex', minHeight: 60,
              borderBottom: '1px solid var(--border)',
              background: isTeaching ? 'var(--warning-glass)' : 'transparent',
            }}>
              <div style={{ width: 60, padding: '8px 12px', fontSize: 11, color: 'var(--text-3)', flexShrink: 0, borderRight: '1px solid var(--border)' }}>
                {timeStr}
              </div>
              <div style={{ flex: 1, padding: '6px 12px', display: 'flex', gap: 6, flexWrap: 'wrap', alignContent: 'flex-start' }}>
                {isTeaching && (
                  <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    🏫 Teaching Period
                  </div>
                )}
                {hourTasks.map((task) => (
                  <div key={task.id} style={{
                    background: task.status === 'Completed' ? 'var(--success-glass)' : 'var(--primary-glass)',
                    border: `1px solid ${task.status === 'Completed' ? 'var(--success)' : 'var(--primary)'}`,
                    borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: 12,
                    display: 'flex', gap: 6, alignItems: 'center',
                  }}>
                    <span>{task.topicName || task.title}</span>
                    <span style={{ color: 'var(--text-2)', fontSize: 11 }}>{task.startTime}–{task.endTime}</span>
                    {task.status !== 'Completed' && (
                      <button style={{ fontSize: 11, color: 'var(--success)', background: 'none', border: 'none', cursor: 'pointer' }}
                        onClick={() => onCompleteTask(task.id)}>✓</button>
                    )}
                    <button style={{ fontSize: 11, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                      onClick={() => onDeleteTask(task.id)}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
