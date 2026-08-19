// src/pages/StudySessions.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Pause, Square, Plus, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  addSession, updateSession, getAllSessions,
  getAllTopics, getAllSubjects, getAllAreas, updateTopic, addNotification
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
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showNewSession, setShowNewSession] = useState(false);
  const [newSession, setNewSession] = useState({
    topicId: '', subjectId: '', preparationAreaId: '', notes: ''
  });

  // Timer references
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);   // wall-clock time when session started
  const pauseStartRef = useRef(null);     // wall-clock time when paused
  const totalPausedRef = useRef(0);       // total ms spent paused

  useEffect(() => {
    loadData();
    return () => clearInterval(timerRef.current);
  }, []);

  const loadData = async () => {
    const [s, t, subs, a] = await Promise.all([
      getAllSessions(),
      getAllTopics(),
      getAllSubjects(),
      getAllAreas(),
    ]);
    setSessions(s);
    setTopics(t);
    setSubjects(subs);
    setAreas(a);
  };

  // Tick timer
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

  const handleStart = async () => {
    if (!newSession.topicId) return;
    const topic = topics.find((t) => String(t.id || t._id) === String(newSession.topicId));
    const subject = subjects.find((s) => String(s.id || s._id) === String(newSession.subjectId));
    const now = new Date();
    const sessionData = {
      topicId: topic?.id || topic?._id || newSession.topicId,
      topicName: topic?.name || '',
      subjectId: subject?.id || subject?._id || newSession.subjectId,
      subjectName: subject?.name || '',
      preparationAreaId: newSession.preparationAreaId || null,
      startTime: now.toISOString(),
      endTime: null,
      durationMinutes: 0,
      notes: newSession.notes,
    };
    const id = await addSession(sessionData);

    sessionStartRef.current = Date.now();
    totalPausedRef.current = 0;
    pauseStartRef.current = null;
    setActiveSession({ id, ...sessionData });
    setElapsed(0);
    setIsPaused(false);
    setShowNewSession(false);
    setNewSession({ topicId: '', subjectId: '', preparationAreaId: '', notes: '' });
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

    // Calculate actual study time (excluding paused time)
    const now = Date.now();
    let finalPaused = totalPausedRef.current;
    if (isPaused && pauseStartRef.current) {
      finalPaused += now - pauseStartRef.current;
    }
    const actualMs = now - sessionStartRef.current - finalPaused;
    const actualSeconds = Math.max(0, Math.floor(actualMs / 1000));
    const durationMinutes = Math.round(actualSeconds / 60);

    const endTime = new Date();
    await updateSession(activeSession.id, {
      endTime: endTime.toISOString(),
      durationMinutes,
    });

    // Update topic study hours
    if (activeSession.topicId) {
      const topic = topics.find((t) => t.id === activeSession.topicId);
      const newHours = (topic?.studyHours || 0) + durationMinutes / 60;
      await updateTopic(activeSession.topicId, {
        studyHours: Math.round(newHours * 10) / 10,
        status: topic?.status === 'Not Started' ? 'Learning' : topic?.status,
      });
    }

    // Generate notification
    await addNotification({
      type: 'session',
      title: 'Session Completed',
      message: `${activeSession.topicName || 'Study session'} — ${durationMinutes} min studied.`,
      scheduledAt: endTime.toISOString(),
      idempotencyKey: `session-completed-${activeSession.id}`
    });

    setActiveSession(null);
    setElapsed(0);
    setIsPaused(false);
    loadData();
  };

  const getTopicName = (topicId) => topics.find((t) => t.id === topicId)?.name || '—';
  const getSubjectName = (subjectId) => subjects.find((s) => s.id === subjectId)?.name || '—';
  const getAreaName = (areaId) => areas.find((a) => a.id === areaId)?.name || '—';

  const filteredTopics = topics.filter((t) =>
    !newSession.subjectId || t.subjectId === parseInt(newSession.subjectId)
  );
  const filteredSubjects = subjects.filter((s) =>
    !newSession.preparationAreaId || s.preparationAreaId === parseInt(newSession.preparationAreaId)
  );

  const today = format(new Date(), 'yyyy-MM-dd');
  const totalStudyMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const totalStudyHours = totalStudyMinutes / 60;
  const todayMinutes = sessions
    .filter((s) => s.startTime?.startsWith(today))
    .reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
  const avgSession = sessions.length
    ? Math.round(sessions.reduce((a, b) => a + (b.durationMinutes || 0), 0) / sessions.length)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Study Sessions</h1>
          <p className="page-subtitle">Track your focused study time with a live timer</p>
        </div>
        {!activeSession && (
          <button className="btn btn-primary" onClick={() => setShowNewSession(true)}>
            <Play size={14} /> Start Session
          </button>
        )}
      </div>

      {/* Active Session Banner */}
      {activeSession && (
        <div style={{
          background: 'linear-gradient(135deg, var(--success-glass), var(--primary-glass))',
          border: `2px solid ${isPaused ? 'var(--warning)' : 'var(--success)'}`,
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px', marginBottom: 24,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
            color: isPaused ? 'var(--warning)' : 'var(--success)', marginBottom: 6,
          }}>
            {isPaused ? '⏸  PAUSED' : '🔴  SESSION ACTIVE'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 12 }}>
            <strong style={{ color: 'var(--text)' }}>{activeSession.topicName || 'Study Session'}</strong>
            {activeSession.subjectName && ` · ${activeSession.subjectName}`}
          </div>
          <div style={{
            fontSize: 64, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em', marginBottom: 8, color: isPaused ? 'var(--text-2)' : 'var(--text)',
          }}>
            {formatSeconds(elapsed)}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20 }}>
            {Math.round(elapsed / 60)} minutes elapsed
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {!isPaused ? (
              <button className="btn btn-ghost" onClick={handlePause}>
                <Pause size={16} /> Pause
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleResume}>
                <Play size={16} /> Resume
              </button>
            )}
            <button className="btn btn-success" onClick={handleComplete}>
              <Square size={16} /> Complete Session
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid-4 mb-24">
        <MiniStatCard icon="📊" label="Total Sessions" value={sessions.length} />
        <MiniStatCard icon="⏱️" label="Total Hours" value={`${totalStudyHours.toFixed(1)}h`} />
        <MiniStatCard icon="📈" label="Avg Session" value={`${avgSession}m`} />
        <MiniStatCard icon="📅" label="Today" value={`${(todayMinutes / 60).toFixed(1)}h`} />
      </div>

      {/* Session History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><Clock size={16} /> Session History</div>
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{sessions.length} sessions recorded</span>
        </div>
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⏱️</div>
            <div className="empty-title">No sessions yet</div>
            <div className="empty-desc">Start your first study session to begin tracking your time</div>
            <button className="btn btn-primary" onClick={() => setShowNewSession(true)}>
              <Play size={14} /> Start Session
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Subject</th>
                  <th>Area</th>
                  <th>Date</th>
                  <th>Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500, maxWidth: 200 }} className="truncate">
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
                      {s.endTime ? (
                        <span className="badge badge-primary">{s.durationMinutes || 0}m</span>
                      ) : (
                        <span className="badge badge-warning">In Progress</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-2)', fontSize: 12, maxWidth: 180 }} className="truncate">
                      {s.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Session Modal */}
      {showNewSession && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowNewSession(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Start Study Session</h2>
              <button className="modal-close" onClick={() => setShowNewSession(false)}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Preparation Area</label>
                <select className="form-select" value={newSession.preparationAreaId}
                  onChange={(e) => setNewSession({
                    ...newSession, preparationAreaId: e.target.value,
                    subjectId: '', topicId: ''
                  })}>
                  <option value="">Select area…</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <select className="form-select" value={newSession.subjectId}
                  onChange={(e) => setNewSession({ ...newSession, subjectId: e.target.value, topicId: '' })}>
                  <option value="">Select subject…</option>
                  {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Topic *</label>
                <select className="form-select" value={newSession.topicId}
                  onChange={(e) => setNewSession({ ...newSession, topicId: e.target.value })}>
                  <option value="">Select topic…</option>
                  {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Session Notes</label>
                <textarea className="form-textarea" value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  placeholder="What will you focus on?"
                  style={{ minHeight: 60 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowNewSession(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-success" style={{ flex: 1 }}
                  onClick={handleStart}
                  disabled={!newSession.topicId}
                  style={{ flex: 1, opacity: newSession.topicId ? 1 : 0.5 }}
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

function MiniStatCard({ icon, label, value }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{label}</div>
    </div>
  );
}
