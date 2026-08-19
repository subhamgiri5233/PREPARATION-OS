// src/pages/StudySessions.jsx
// Synchronized with Study Planner: Displays planned topics for selected date + Dual Stats + Full Edit/Delete on every item

import { useEffect, useState, useRef } from 'react';
import {
  Play, Pause, Square, Plus, Clock, X, Calendar, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle2, Circle, AlertCircle, BookOpen, Layers, BarChart2,
  Lock, ArrowRight, RotateCcw, Edit2, Trash2
} from 'lucide-react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import {
  addSession, updateSession, deleteSession, getAllSessions,
  getAllTopics, getAllSubjects, getAllAreas, getAllTasks,
  updateTopic, updateTask, deleteTask, addNotification, getSettings
} from '../services/db';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';

function formatSeconds(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StudySessions() {
  const { activeSession, setActiveSession } = useAppStore();
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Selected date for planner sync and day metrics
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [historyFilter, setHistoryFilter] = useState('selected'); // 'selected' | 'all'

  // Live Timer states
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSession, setNewSession] = useState({
    topicId: '', subjectId: '', preparationAreaId: '', taskId: null, notes: ''
  });

  // Edit Modals
  const [editingSession, setEditingSession] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Timer references
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);
  const pauseStartRef = useRef(null);
  const totalPausedRef = useRef(0);

  useEffect(() => {
    loadData();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadData = async () => {
    try {
      const [sess, tsk, top, sub, ar, sett] = await Promise.all([
        getAllSessions(),
        getAllTasks(),
        getAllTopics(),
        getAllSubjects(),
        getAllAreas(),
        getSettings(),
      ]);
      setSessions(sess || []);
      setTasks(tsk || []);
      setTopics(top || []);
      setSubjects(sub || []);
      setAreas(ar || []);
      setSettings(sett || {});
    } catch (err) {
      console.error('[StudySessions] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer interval tick
  useEffect(() => {
    if (activeSession && !isPaused) {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const rawElapsed = now - sessionStartRef.current - totalPausedRef.current;
        setElapsed(Math.floor(rawElapsed / 1000));
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeSession, isPaused]);

  // Start a new session
  const handleStartTimer = (sessionConfig) => {
    const topic = topics.find((t) => String(t.id || t._id) === String(sessionConfig.topicId));
    const subject = subjects.find((s) => String(s.id || s._id) === String(sessionConfig.subjectId || topic?.subjectId));
    const now = new Date();
    const targetDateStr = format(selectedDate, 'yyyy-MM-dd');

    const sessionData = {
      topicId: topic?.id || topic?._id || sessionConfig.topicId || null,
      topicName: topic?.name || sessionConfig.topicName || 'Study Session',
      subjectId: subject?.id || subject?._id || sessionConfig.subjectId || null,
      subjectName: subject?.name || sessionConfig.subjectName || '',
      preparationAreaId: sessionConfig.preparationAreaId || topic?.preparationAreaId || null,
      taskId: sessionConfig.taskId || null,
      startTime: now.toISOString(),
      date: targetDateStr,
      durationMinutes: 0,
      notes: sessionConfig.notes || '',
    };

    sessionStartRef.current = Date.now();
    totalPausedRef.current = 0;
    pauseStartRef.current = null;
    setActiveSession(sessionData);
    setElapsed(0);
    setIsPaused(false);
    setShowNewSession(false);
    setNewSession({ topicId: '', subjectId: '', preparationAreaId: '', taskId: null, notes: '' });

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (sessionConfig.taskId) {
      updateTask(sessionConfig.taskId, { status: 'In Progress' }).catch(() => {});
      setTasks((prev) =>
        prev.map((t) => (String(t.id || t._id) === String(sessionConfig.taskId) ? { ...t, status: 'In Progress' } : t))
      );
    }
  };

  const handlePause = () => {
    pauseStartRef.current = Date.now();
    setIsPaused(true);
  };

  const handleResume = () => {
    if (pauseStartRef.current) {
      totalPausedRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setIsPaused(false);
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    clearInterval(timerRef.current);

    const now = Date.now();
    let finalPaused = totalPausedRef.current;
    if (isPaused && pauseStartRef.current) {
      finalPaused += now - pauseStartRef.current;
    }
    const actualMs = now - (sessionStartRef.current || now) - finalPaused;
    const actualSeconds = Math.max(0, Math.floor(actualMs / 1000));
    const durationMinutes = Math.max(1, Math.round(actualSeconds / 60));
    const endTime = new Date();

    try {
      const payload = {
        topicId: activeSession.topicId || null,
        topicName: activeSession.topicName || 'Study Session',
        subjectId: activeSession.subjectId || null,
        subjectName: activeSession.subjectName || '',
        preparationAreaId: activeSession.preparationAreaId || null,
        taskId: activeSession.taskId || null,
        startTime: activeSession.startTime || new Date(now - actualMs).toISOString(),
        endTime: endTime.toISOString(),
        date: activeSession.date || format(new Date(), 'yyyy-MM-dd'),
        durationMinutes,
        notes: activeSession.notes || '',
      };

      const isValidObjectId =
        activeSession.id && typeof activeSession.id === 'string' && /^[0-9a-fA-F]{24}$/.test(activeSession.id);

      if (isValidObjectId) {
        await updateSession(activeSession.id, { endTime: endTime.toISOString(), durationMinutes });
      } else {
        await addSession(payload);
      }

      if (activeSession.taskId) {
        await updateTask(activeSession.taskId, { status: 'Completed' }).catch(() => {});
      }

      if (activeSession.topicId) {
        const topic = topics.find((t) => String(t.id || t._id) === String(activeSession.topicId));
        if (topic) {
          const newHours = (Number(topic.studyHours) || 0) + durationMinutes / 60;
          await updateTopic(activeSession.topicId, {
            studyHours: Math.round(newHours * 10) / 10,
            status: topic.status === 'Not Started' ? 'Learning' : topic.status,
            lastStudiedDate: format(new Date(), 'yyyy-MM-dd'),
          }).catch(() => {});
        }
      }

      await addNotification({
        type: 'session',
        title: '✅ Session Completed',
        message: `${activeSession.topicName || 'Study session'} — ${durationMinutes} min studied.`,
        scheduledAt: endTime.toISOString(),
        idempotencyKey: `session-completed-${Date.now()}`,
      }).catch(() => {});
    } catch (err) {
      console.error('[StudySessions] Error completing session:', err);
    } finally {
      setActiveSession(null);
      setElapsed(0);
      setIsPaused(false);
      await loadData();
    }
  };

  // ── DELETE / EDIT HANDLERS ─────────────────────────────────────
  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this study session record?')) return;
    try {
      await deleteSession(sessionId);
      await loadData();
    } catch (err) {
      alert('Failed to delete session: ' + err.message);
    }
  };

  const handleSaveEditSession = async (e) => {
    e.preventDefault();
    if (!editingSession) return;
    try {
      await updateSession(editingSession.id || editingSession._id, {
        durationMinutes: Number(editingSession.durationMinutes) || 0,
        notes: editingSession.notes || '',
        topicName: editingSession.topicName,
      });
      setEditingSession(null);
      await loadData();
    } catch (err) {
      alert('Failed to update session: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this scheduled task?')) return;
    try {
      await deleteTask(taskId);
      await loadData();
    } catch (err) {
      alert('Failed to delete task: ' + err.message);
    }
  };

  const handleSaveEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      await updateTask(editingTask.id || editingTask._id, {
        title: editingTask.title,
        startTime: editingTask.startTime,
        endTime: editingTask.endTime,
        durationMinutes: Number(editingTask.durationMinutes) || 60,
        priority: editingTask.priority,
        status: editingTask.status,
        isUserEdited: true,
      });
      setEditingTask(null);
      await loadData();
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    }
  };

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const isSelectedToday = isSameDay(selectedDate, new Date());

  // Planned tasks for the selected date from Study Planner
  const plannedDayTasks = tasks.filter((t) => t.date === selectedDateStr);

  // Sessions logged for the selected date
  const selectedDaySessions = sessions.filter((s) => {
    const sDate = (s.date || s.startTime || '').slice(0, 10);
    return sDate === selectedDateStr;
  });

  // ── STATS COMPUTATION ──────────────────────────────────────────
  const dayStudyMinutes = selectedDaySessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const dayStudyHours = dayStudyMinutes / 60;
  const dayCompletedTasks = plannedDayTasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
  const dayAvgSessionMins = selectedDaySessions.length
    ? Math.round(dayStudyMinutes / selectedDaySessions.length)
    : 0;

  const totalStudyMinutes = sessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const totalStudyHours = totalStudyMinutes / 60;
  const allTimeAvgSessionMins = sessions.length
    ? Math.round(totalStudyMinutes / sessions.length)
    : 0;

  const displaySessions = historyFilter === 'selected' ? selectedDaySessions : sessions;

  const getTopicName = (topicId) => topics.find((t) => String(t.id || t._id) === String(topicId))?.name || '—';
  const getSubjectName = (subjectId) => subjects.find((s) => String(s.id || s._id) === String(subjectId))?.name || '—';
  const getAreaName = (areaId) => areas.find((a) => String(a.id || a._id) === String(areaId))?.name || '—';

  const filteredTopics = topics.filter((t) =>
    !newSession.subjectId || String(t.subjectId) === String(newSession.subjectId)
  );
  const filteredSubjects = subjects.filter((s) =>
    !newSession.preparationAreaId || String(s.preparationAreaId) === String(newSession.preparationAreaId)
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div>
      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 className="page-title">Study Sessions & Focus Timer</h1>
          <p className="page-subtitle">Start sessions planned in your Study Planner, track focus time, and manage records</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!activeSession && (
            <button className="btn btn-primary" onClick={() => setShowNewSession(true)}>
              <Plus size={14} /> Custom Session
            </button>
          )}
        </div>
      </div>

      {/* ── ACTIVE SESSION LIVE TIMER BANNER ──────────────────────── */}
      {activeSession && (
        <div
          style={{
            background: 'linear-gradient(135deg, var(--success-glass), var(--primary-glass))',
            border: `2px solid ${isPaused ? 'var(--warning)' : 'var(--success)'}`,
            borderRadius: 'var(--radius-xl)',
            padding: '28px 24px',
            marginBottom: 24,
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <div
            style={{
              fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
              color: isPaused ? 'var(--warning)' : 'var(--success)', marginBottom: 6,
            }}
          >
            {isPaused ? '⏸ SESSION PAUSED' : '🔴 STUDY SESSION ACTIVE'}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            {activeSession.topicName || 'Study Session'}
          </div>
          {activeSession.subjectName && (
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 16 }}>
              {activeSession.subjectName}
            </div>
          )}

          <div
            style={{
              fontSize: 68, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em', marginBottom: 6, color: isPaused ? 'var(--text-2)' : 'var(--text)',
            }}
          >
            {formatSeconds(elapsed)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
            {Math.round(elapsed / 60)} minutes focused study time
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {!isPaused ? (
              <button className="btn btn-ghost" onClick={handlePause} style={{ padding: '8px 20px' }}>
                <Pause size={16} /> Pause
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleResume} style={{ padding: '8px 20px' }}>
                <Play size={16} /> Resume
              </button>
            )}
            <button className="btn btn-success" onClick={handleComplete} style={{ padding: '8px 24px' }}>
              <Square size={16} /> Complete & Save Session
            </button>
          </div>
        </div>
      )}

      {/* ── DATE NAVIGATION STRIP ─────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          background: 'var(--card)', padding: '12px 18px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            title="Previous Day"
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 800 }}>
            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </span>
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            title="Next Day"
          >
            <ChevronRight size={16} />
          </button>
          {!isSelectedToday && (
            <button className="btn btn-sm btn-ghost" onClick={() => setSelectedDate(new Date())}>
              Today
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Jump to Date:</span>
          <input
            type="date"
            value={selectedDateStr}
            onChange={(e) => {
              if (e.target.value) setSelectedDate(parseISO(e.target.value));
            }}
            style={{
              padding: '4px 8px', fontSize: 12, borderRadius: 6,
              background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)',
            }}
          />
        </div>
      </div>

      {/* ── DUAL SCOPE METRICS (DAY STATS & ALL-TIME STATS) ────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Day Stats */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} /> {format(selectedDate, 'MMM d')} Day Summary
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
            <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                {dayCompletedTasks} / {plannedDayTasks.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Planned Tasks Done</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-light)' }}>
                {dayStudyHours.toFixed(1)}h
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Hours Studied</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--success)' }}>
                {dayAvgSessionMins}m
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Avg Session</div>
            </div>
          </div>
        </div>

        {/* All-Time Overall Stats */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} /> All-Time Overall Performance
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
            <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
                {sessions.length}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Total Sessions</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary-light)' }}>
                {totalStudyHours.toFixed(1)}h
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Total Study Hours</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '10px', borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--warning)' }}>
                {allTimeAvgSessionMins}m
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Overall Avg Session</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. PLANNER SYNCHRONIZED STUDY QUEUE FOR SELECTED DATE ──── */}
      <div className="card mb-24" style={{ padding: '20px' }}>
        <div className="card-header" style={{ marginBottom: 14 }}>
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={16} style={{ color: 'var(--primary-light)' }} />
              Scheduled Study Tasks for {format(selectedDate, 'MMMM d, yyyy')}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
              Items planned in your Study Planner for this day appear here with full Edit, Delete, and 1-click timer execution.
            </p>
          </div>
          <span className="badge badge-primary">{plannedDayTasks.length} Planned</span>
        </div>

        {plannedDayTasks.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
              No Study Tasks Scheduled for {format(selectedDate, 'MMM d')}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 420, margin: '6px auto 16px' }}>
              Generate your routine in the Study Planner to see scheduled topics appear here automatically.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <a href="/planner" className="btn btn-primary btn-sm">
                <Sparkles size={12} /> Go to Study Planner
              </a>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewSession(true)}>
                <Plus size={12} /> Custom Session
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plannedDayTasks.map((task) => {
              const isDone = (task.status || '').toLowerCase() === 'completed';
              const isInProgress = (task.status || '').toLowerCase() === 'in progress';
              const isLocked = !!task.isLocked;
              const isAi = task.source === 'auto' && !task.isUserEdited;
              const isEdited = !!task.isUserEdited;
              const isCurrentActive =
                activeSession &&
                (String(activeSession.taskId) === String(task.id || task._id) ||
                  (task.topicId && String(activeSession.topicId) === String(task.topicId)));

              return (
                <div
                  key={task.id || task._id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                    padding: '12px 16px', borderRadius: 'var(--radius)',
                    background: isCurrentActive ? 'var(--primary-glass)' : isDone ? 'var(--success-glass)' : 'var(--surface-2)',
                    border: `2px solid ${isCurrentActive ? 'var(--primary-light)' : isDone ? 'var(--success)' : isInProgress ? 'var(--warning)' : isLocked ? '#ef4444' : 'var(--border)'}`,
                    boxShadow: isCurrentActive ? '0 0 16px rgba(99, 102, 241, 0.3)' : 'none',
                  }}
                >
                  {/* Left: Status icon & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: 1 }}>
                    <div style={{ color: isCurrentActive ? 'var(--primary-light)' : isDone ? 'var(--success)' : isInProgress ? 'var(--warning)' : 'var(--text-3)' }}>
                      {isCurrentActive ? <Play size={20} style={{ animation: 'pulse 1.5s infinite' }} /> : isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-2)' : 'var(--text)' }}>
                          {isAuthenticated ? (task.topicName || task.title) : (task.title?.startsWith('🔄') ? '🔒 Private Revision' : '🔒 Focus Study Block')}
                        </span>

                        {isCurrentActive && (
                          <span className="badge badge-primary" style={{ fontSize: 10, fontWeight: 800 }}>
                            🔴 LIVE: {formatSeconds(elapsed)}
                          </span>
                        )}

                        {/* Priority Badge */}
                        <span className={`badge ${task.priority === 'High' ? 'badge-danger' : task.priority === 'Medium' ? 'badge-warning' : 'badge-muted'}`} style={{ fontSize: 9 }}>
                          {task.priority || 'Medium'}
                        </span>

                        {/* Provenance Badge */}
                        {isLocked ? (
                          <span className="badge" style={{ fontSize: 9, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>🔒 Locked</span>
                        ) : isEdited ? (
                          <span className="badge badge-warning" style={{ fontSize: 9 }}>✏️ Edited</span>
                        ) : isAi ? (
                          <span className="badge badge-primary" style={{ fontSize: 9 }}>✨ AI Planned</span>
                        ) : (
                          <span className="badge badge-muted" style={{ fontSize: 9 }}>👤 Manual</span>
                        )}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{task.subjectName || getSubjectName(task.subjectId)}</span>
                        <span>·</span>
                        <span style={{ color: 'var(--text)' }}>
                          ⏰ {task.startTime && task.endTime ? `${task.startTime} – ${task.endTime}` : `${task.durationMinutes || 60}m duration`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {isCurrentActive ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!isPaused ? (
                          <button className="btn btn-sm btn-ghost" onClick={handlePause}>
                            <Pause size={12} /> Pause
                          </button>
                        ) : (
                          <button className="btn btn-sm btn-primary" onClick={handleResume}>
                            <Play size={12} /> Resume
                          </button>
                        )}
                        <button className="btn btn-sm btn-success" onClick={handleComplete}>
                          <Square size={12} /> Complete
                        </button>
                      </div>
                    ) : isDone ? (
                      <span className="badge badge-success" style={{ fontSize: 11, padding: '4px 10px' }}>
                        ✅ Completed
                      </span>
                    ) : (
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() =>
                          handleStartTimer({
                            topicId: task.topicId,
                            topicName: task.topicName || task.title,
                            subjectId: task.subjectId,
                            subjectName: task.subjectName,
                            preparationAreaId: task.preparationAreaId,
                            taskId: task.id || task._id,
                            notes: task.reason || '',
                          })
                        }
                      >
                        <Play size={12} /> Start Timer
                      </button>
                    )}

                    {/* Edit Task Button */}
                    <button
                      className="btn btn-sm btn-ghost btn-icon"
                      onClick={() => setEditingTask({ ...task })}
                      title="Edit Task"
                      style={{ padding: '6px' }}
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Delete Task Button */}
                    <button
                      className="btn btn-sm btn-ghost btn-icon"
                      onClick={() => handleDeleteTask(task.id || task._id)}
                      title="Delete Task"
                      style={{ padding: '6px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. SESSION HISTORY TABLE ──────────────────────────────── */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} /> Completed Session History ({displaySessions.length})
          </div>
          <div className="tabs">
            <button
              className={`tab ${historyFilter === 'selected' ? 'active' : ''}`}
              onClick={() => setHistoryFilter('selected')}
            >
              {format(selectedDate, 'MMM d')} Only ({selectedDaySessions.length})
            </button>
            <button
              className={`tab ${historyFilter === 'all' ? 'active' : ''}`}
              onClick={() => setHistoryFilter('all')}
            >
              All Time ({sessions.length})
            </button>
          </div>
        </div>

        {displaySessions.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            {historyFilter === 'selected'
              ? `No completed study sessions recorded for ${format(selectedDate, 'MMMM d, yyyy')}.`
              : 'No study sessions recorded yet.'}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Subject</th>
                  <th>Area</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displaySessions.map((s) => (
                  <tr key={s.id || s._id}>
                    <td style={{ fontWeight: 600, maxWidth: 180 }} className="truncate">
                      {isAuthenticated ? (s.topicName || getTopicName(s.topicId)) : '🔒 Private Study Session'}
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {s.subjectName || getSubjectName(s.subjectId)}
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>
                      {getAreaName(s.preparationAreaId)}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {s.startTime ? format(new Date(s.startTime), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td>
                      {s.endTime || s.durationMinutes ? (
                        <span className="badge badge-primary">{s.durationMinutes || 0} min</span>
                      ) : (
                        <span className="badge badge-warning">In Progress</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-3)', fontSize: 12, maxWidth: 140 }} className="truncate">
                      {isAuthenticated ? (s.notes || '—') : (s.notes ? '🔒 Private Notes' : '—')}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isAuthenticated ? (
                        <>
                          <button
                            className="btn btn-xs btn-ghost btn-icon"
                            onClick={() => setEditingSession({ ...s })}
                            title="Edit Session"
                            style={{ marginRight: 4 }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            className="btn btn-xs btn-ghost btn-icon"
                            onClick={() => handleDeleteSession(s.id || s._id)}
                            title="Delete Session"
                            style={{ color: 'var(--danger)' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>🔒 Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EDIT SESSION MODAL ────────────────────────────────────── */}
      {editingSession && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingSession(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Study Session</h2>
              <button className="modal-close" onClick={() => setEditingSession(null)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveEditSession} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Topic / Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingSession.topicName || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, topicName: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input
                  type="number"
                  className="form-input"
                  value={editingSession.durationMinutes || 0}
                  onChange={(e) => setEditingSession({ ...editingSession, durationMinutes: e.target.value })}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession({ ...editingSession, notes: e.target.value })}
                  style={{ minHeight: 60 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingSession(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT SCHEDULED TASK MODAL ────────────────────────────── */}
      {editingTask && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingTask(null)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Scheduled Task</h2>
              <button className="modal-close" onClick={() => setEditingTask(null)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={handleSaveEditTask} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editingTask.title || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editingTask.startTime || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, startTime: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input
                    type="time"
                    className="form-input"
                    value={editingTask.endTime || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Duration (Min)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={editingTask.durationMinutes || 60}
                    onChange={(e) => setEditingTask({ ...editingTask, durationMinutes: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={editingTask.priority || 'Medium'}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={editingTask.status || 'Not Started'}
                  onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                >
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingTask(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CUSTOM NEW SESSION MODAL ──────────────────────────────── */}
      {showNewSession && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowNewSession(false)}>
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h2 className="modal-title">Start Custom Study Session</h2>
              <button className="modal-close" onClick={() => setShowNewSession(false)}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Session Type */}
              <div className="form-group">
                <label className="form-label">Session Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${newSession.type !== 'Revision' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: 12, justifyContent: 'center' }}
                    onClick={() => setNewSession({ ...newSession, type: 'Concept Study', topicId: '' })}
                  >
                    📚 Concept Study
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${newSession.type === 'Revision' ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ fontSize: 12, justifyContent: 'center' }}
                    onClick={() => setNewSession({ ...newSession, type: 'Revision', topicId: '' })}
                  >
                    🔄 Revision (Completed)
                  </button>
                </div>
                {newSession.type === 'Revision' && (
                  <div style={{ fontSize: 11, color: 'var(--primary-light)', marginTop: 4 }}>
                    ✨ Showing completed topics for revision.
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Preparation Area</label>
                <select
                  className="form-select"
                  value={newSession.preparationAreaId}
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,
                      preparationAreaId: e.target.value,
                      subjectId: '',
                      topicId: '',
                    })
                  }
                >
                  <option value="">Select area…</option>
                  {areas.map((a) => (
                    <option key={a.id || a._id} value={a.id || a._id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  className="form-select"
                  value={newSession.subjectId}
                  onChange={(e) =>
                    setNewSession({
                      ...newSession,
                      subjectId: e.target.value,
                      topicId: '',
                    })
                  }
                >
                  <option value="">Select subject…</option>
                  {filteredSubjects.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {newSession.type === 'Revision' ? 'Completed Topic for Revision *' : 'Topic *'}
                </label>
                <select
                  className="form-select"
                  value={newSession.topicId}
                  onChange={(e) =>
                    setNewSession({ ...newSession, topicId: e.target.value })
                  }
                >
                  <option value="">
                    {newSession.type === 'Revision' ? 'Select completed topic to revise…' : 'Select topic…'}
                  </option>
                  {(() => {
                    const list =
                      newSession.type === 'Revision'
                        ? filteredTopics.filter(
                            (t) => (t.status || '').toLowerCase() === 'completed' || (Number(t.studyHours) || 0) > 0
                          )
                        : filteredTopics;

                    if (newSession.type === 'Revision' && list.length === 0) {
                      return (
                        <>
                          <option disabled value="" style={{ color: 'var(--text-3)' }}>
                            (No completed topics in this subject — select below)
                          </option>
                          {filteredTopics.map((t) => {
                            const isDone = (t.status || '').toLowerCase() === 'completed';
                            const isLearning = (t.status || '').toLowerCase() === 'learning' || (Number(t.studyHours) || 0) > 0;
                            return (
                              <option
                                key={t.id || t._id}
                                value={t.id || t._id}
                                style={{
                                  color: isDone ? '#22c55e' : isLearning ? '#eab308' : '#ef4444',
                                  fontWeight: isDone ? 700 : 500,
                                  background: '#111827',
                                }}
                              >
                                {isDone ? '🟢' : isLearning ? '🟡' : '🔴'} {t.name} ({t.status || 'Not Started'})
                              </option>
                            );
                          })}
                        </>
                      );
                    }

                    return list.map((t) => {
                      const isDone = (t.status || '').toLowerCase() === 'completed';
                      const isLearning = (t.status || '').toLowerCase() === 'learning' || (Number(t.studyHours) || 0) > 0;
                      return (
                        <option
                          key={t.id || t._id}
                          value={t.id || t._id}
                          style={{
                            color: isDone ? '#22c55e' : isLearning ? '#eab308' : '#ef4444',
                            fontWeight: isDone ? 700 : 500,
                            background: '#111827',
                          }}
                        >
                          {isDone ? '🟢' : isLearning ? '🟡' : '🔴'} {t.name} ({isDone ? 'Completed' : isLearning ? 'Learning' : 'Not Started'})
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Session Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  value={newSession.notes}
                  onChange={(e) =>
                    setNewSession({ ...newSession, notes: e.target.value })
                  }
                  placeholder="What is your focus for this session?"
                  style={{ minHeight: 60 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setShowNewSession(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  style={{ flex: 1, opacity: newSession.topicId ? 1 : 0.5 }}
                  onClick={() => handleStartTimer(newSession)}
                  disabled={!newSession.topicId}
                >
                  <Play size={14} /> Start Timer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STICKY FLOATING BOTTOM TIMER BAR ────────────────────── */}
      {activeSession && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            background: 'var(--surface-2)',
            border: '2px solid var(--primary-light)',
            borderRadius: 100,
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 12px 36px rgba(0,0,0,0.6)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge badge-primary" style={{ fontWeight: 800, fontSize: 10 }}>
              🔴 {isPaused ? 'PAUSED' : 'LIVE'}
            </span>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', maxWidth: 220 }} className="truncate">
              {activeSession.topicName || 'Study Session'}
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: isPaused ? 'var(--warning)' : 'var(--success)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatSeconds(elapsed)}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isPaused ? (
              <button className="btn btn-xs btn-ghost" onClick={handlePause}>
                <Pause size={12} /> Pause
              </button>
            ) : (
              <button className="btn btn-xs btn-primary" onClick={handleResume}>
                <Play size={12} /> Resume
              </button>
            )}
            <button className="btn btn-xs btn-success" onClick={handleComplete}>
              <Square size={12} /> Complete & Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
