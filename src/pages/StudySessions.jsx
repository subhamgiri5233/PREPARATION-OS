// src/pages/StudySessions.jsx
// Synchronized with Study Planner: Displays planned topics for selected date + Dual Stats (Day vs All-Time)

import { useEffect, useState, useRef } from 'react';
import {
  Play, Pause, Square, Plus, Clock, X, Calendar, ChevronLeft, ChevronRight,
  Sparkles, CheckCircle2, Circle, AlertCircle, BookOpen, Layers, BarChart2,
  Lock, ArrowRight, RotateCcw
} from 'lucide-react';
import { format, addDays, parseISO, isSameDay } from 'date-fns';
import {
  addSession, updateSession, getAllSessions,
  getAllTopics, getAllSubjects, getAllAreas, getAllTasks,
  updateTopic, updateTask, addNotification, getSettings
} from '../services/db';
import { useAppStore } from '../store/useAppStore';

function formatSeconds(totalSecs) {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StudySessions() {
  const { activeSession, setActiveSession } = useAppStore();
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

  // Start a new session (either from planned task or manual modal)
  const handleStartTimer = async (sessionConfig) => {
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
      endTime: null,
      durationMinutes: 0,
      notes: sessionConfig.notes || '',
    };

    const id = await addSession(sessionData);

    // If attached to a scheduled task, mark task as In Progress
    if (sessionConfig.taskId) {
      await updateTask(sessionConfig.taskId, { status: 'In Progress' });
      setTasks((prev) => prev.map((t) => String(t.id || t._id) === String(sessionConfig.taskId) ? { ...t, status: 'In Progress' } : t));
    }

    sessionStartRef.current = Date.now();
    totalPausedRef.current = 0;
    pauseStartRef.current = null;
    setActiveSession({ id, ...sessionData });
    setElapsed(0);
    setIsPaused(false);
    setShowNewSession(false);
    setNewSession({ topicId: '', subjectId: '', preparationAreaId: '', taskId: null, notes: '' });
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
    const actualMs = now - sessionStartRef.current - finalPaused;
    const actualSeconds = Math.max(0, Math.floor(actualMs / 1000));
    const durationMinutes = Math.max(1, Math.round(actualSeconds / 60));

    const endTime = new Date();
    await updateSession(activeSession.id, {
      endTime: endTime.toISOString(),
      durationMinutes,
    });

    // If attached to a scheduled task, mark task as Completed
    if (activeSession.taskId) {
      await updateTask(activeSession.taskId, { status: 'Completed' });
    }

    // Update topic study hours
    if (activeSession.topicId) {
      const topic = topics.find((t) => String(t.id || t._id) === String(activeSession.topicId));
      if (topic) {
        const newHours = (Number(topic.studyHours) || 0) + durationMinutes / 60;
        await updateTopic(activeSession.topicId, {
          studyHours: Math.round(newHours * 10) / 10,
          status: topic.status === 'Not Started' ? 'Learning' : topic.status,
          lastStudiedDate: format(new Date(), 'yyyy-MM-dd'),
        });
      }
    }

    // Add completion notification
    await addNotification({
      type: 'session',
      title: '✅ Session Completed',
      message: `${activeSession.topicName || 'Study session'} — ${durationMinutes} min studied.`,
      scheduledAt: endTime.toISOString(),
      idempotencyKey: `session-completed-${activeSession.id}`,
    });

    setActiveSession(null);
    setElapsed(0);
    setIsPaused(false);
    await loadData();
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
  // 1. Day Stats (Selected Date)
  const dayStudyMinutes = selectedDaySessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const dayStudyHours = dayStudyMinutes / 60;
  const dayCompletedTasks = plannedDayTasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
  const dayAvgSessionMins = selectedDaySessions.length
    ? Math.round(dayStudyMinutes / selectedDaySessions.length)
    : 0;

  // 2. All-Time Stats
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const totalStudyHours = totalStudyMinutes / 60;
  const allTimeAvgSessionMins = sessions.length
    ? Math.round(totalStudyMinutes / sessions.length)
    : 0;
  const uniqueStudyDays = new Set(sessions.map((s) => (s.date || s.startTime || '').slice(0, 10)).filter(Boolean)).size;

  // History table sessions
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
          <p className="page-subtitle">Start sessions planned in your Study Planner and track focused study hours</p>
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
              Items planned in your Study Planner for this day appear here for immediate 1-click execution.
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

              return (
                <div
                  key={task.id || task._id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
                    padding: '12px 16px', borderRadius: 'var(--radius)',
                    background: isDone ? 'var(--success-glass)' : 'var(--surface-2)',
                    border: `1px solid ${isDone ? 'var(--success)' : isInProgress ? 'var(--warning)' : isLocked ? '#ef4444' : 'var(--border)'}`,
                  }}
                >
                  {/* Left: Status icon & Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 240, flex: 1 }}>
                    <div style={{ color: isDone ? 'var(--success)' : isInProgress ? 'var(--warning)' : 'var(--text-3)' }}>
                      {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text-2)' : 'var(--text)' }}>
                          {task.topicName || task.title}
                        </span>

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

                  {/* Right: Action Button */}
                  <div>
                    {isDone ? (
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
                </tr>
              </thead>
              <tbody>
                {displaySessions.map((s) => (
                  <tr key={s.id || s._id}>
                    <td style={{ fontWeight: 600, maxWidth: 200 }} className="truncate">
                      {s.topicName || getTopicName(s.topicId)}
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
                    <td style={{ color: 'var(--text-3)', fontSize: 12, maxWidth: 180 }} className="truncate">
                      {s.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <label className="form-label">Topic *</label>
                <select
                  className="form-select"
                  value={newSession.topicId}
                  onChange={(e) =>
                    setNewSession({ ...newSession, topicId: e.target.value })
                  }
                >
                  <option value="">Select topic…</option>
                  {filteredTopics.map((t) => (
                    <option key={t.id || t._id} value={t.id || t._id}>
                      {t.name}
                    </option>
                  ))}
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
    </div>
  );
}
