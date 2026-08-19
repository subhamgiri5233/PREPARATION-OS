// src/pages/Dashboard.jsx
// Phase 7 Daily Command Center & Course-Specific Dashboard

import { useEffect, useState, useCallback, useMemo } from 'react';
import { format, isToday, parseISO } from 'date-fns';
import {
  CheckCircle2, Circle, Clock, BookOpen, Target, Flame,
  TrendingUp, AlertTriangle, RotateCcw, Zap, ChevronRight,
  BookMarked, BarChart3, Play, Layers, Calendar, CheckSquare,
  HelpCircle, ArrowRight, ShieldAlert, Award
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import {
  getTasksByDate, updateTask, getAllTopics, getAllSubjects, getAllChapters,
  getAllCourses, getAllAreas, getVocabByDate, getPendingRevisions, getAllMocks, getSettings,
  getAllSessions, getErrorLogs, getErrorLogsByMock, getTeachingSchedule, getTodayGitaShloka
} from '../services/db';
import { getRevisionsDueToday, completeRevision } from '../services/revisionService';
import { getStudyNowRecommendation } from '../services/studyPlanningEngine';
import { analyzeSubjectWiseMocks, getScoreTrend, calculateAccuracy } from '../services/analyticsService';
import { generateLossSummary } from '../services/errorAnalysisEngine';
import { classifyTopicPerformance } from '../services/performanceEngine';
import { compareMocks } from '../services/mockAnalysisEngine';
import { calculateSyllabusProgress, calculateAreaProgress, calculateCourseProgress } from '../services/syllabusService';
import { getNextUpcomingStudySession } from '../services/reminderScheduler';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function RingProgress({ value, size = 70, stroke = 6, color = 'var(--primary)' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const { preparationAreas } = useAppStore();

  // Selected Area filter for course-specific dashboard
  const [selectedAreaId, setSelectedAreaId] = useState('all'); // 'all' or areaId

  // Data states
  const [settings, setSettings] = useState(null);
  const [areas, setAreas] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [topics, setTopics] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [revisionsDue, setRevisionsDue] = useState([]);
  const [todayVocab, setTodayVocab] = useState([]);
  const [todayGita, setTodayGita] = useState(null);
  const [allMocks, setAllMocks] = useState([]);
  const [allErrors, setAllErrors] = useState([]);
  const [teachingSlots, setTeachingSlots] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  // Mock analysis states
  const [latestMockComparison, setLatestMockComparison] = useState(null);
  const [latestMockLosses, setLatestMockLosses] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const [
        s, a, c, subs, chaps, t, todayTasks, sess, revDue, vocab, mocks, errs, teachSlots, gita
      ] = await Promise.all([
        getSettings(),
        getAllAreas(),
        getAllCourses(),
        getAllSubjects(),
        getAllChapters(),
        getAllTopics(),
        getTasksByDate(TODAY),
        getAllSessions(),
        getRevisionsDueToday(),
        getVocabByDate(TODAY),
        getAllMocks(),
        getErrorLogs(),
        getTeachingSchedule(),
        getTodayGitaShloka(),
      ]);

      setSettings(s);
      setAreas(a);
      setCourses(c);
      setSubjects(subs);
      setChapters(chaps);
      setTopics(t);
      setTasks(todayTasks);
      setSessions(sess);
      setRevisionsDue(revDue);
      setTodayVocab(vocab);
      setAllMocks(mocks);
      setAllErrors(errs);
      setTeachingSlots(teachSlots || []);
      setTodayGita(gita || null);

      // Calculate streak
      const sessionDates = new Set(sess.map((session) => session.startTime?.split('T')[0]).filter(Boolean));
      let currentStreak = 0;
      let checkDate = new Date();
      while (sessionDates.has(format(checkDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
      setStreak(currentStreak);

      // Real-time Recommendation Engine
      const rec = getStudyNowRecommendation({
        topics: t,
        revisionsDue: revDue,
        mocks,
        prepAreas: a,
        subjects: subs,
        chapters: chaps,
        sessions: sess,
        today: TODAY,
        teachingSlots: teachSlots,
        scheduledTasks: todayTasks,
        settings: s,
      });
      setRecommendation(rec);

      // Latest Mock Analysis
      if (mocks.length > 0) {
        const latest = mocks[0];
        const previous = mocks.slice(1);
        const comp = compareMocks(latest, previous);
        setLatestMockComparison(comp);
        const losses = generateLossSummary(errs.filter((e) => e.mockId === latest.id));
        setLatestMockLosses(losses);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Next Upcoming Study Session for Dashboard Card
  const nextStudySession = useMemo(() => {
    return getNextUpcomingStudySession(tasks, subjects, topics, areas, settings, teachingSlots);
  }, [tasks, subjects, topics, areas, settings, teachingSlots]);

  // Filtered views based on selected Area
  const currentArea = useMemo(() => {
    if (selectedAreaId === 'all') return null;
    return areas.find((a) => String(a.id || a._id) === String(selectedAreaId)) || null;
  }, [areas, selectedAreaId]);

  const filteredTopics = useMemo(() => {
    if (selectedAreaId === 'all') return topics;
    return topics.filter((t) => String(t.preparationAreaId) === String(selectedAreaId));
  }, [topics, selectedAreaId]);

  const filteredRevisions = useMemo(() => {
    if (selectedAreaId === 'all') return revisionsDue;
    return revisionsDue.filter((r) => {
      const top = topics.find((t) => String(t.id || t._id) === String(r.topicId));
      return top && String(top.preparationAreaId) === String(selectedAreaId);
    });
  }, [revisionsDue, topics, selectedAreaId]);

  const filteredMocks = useMemo(() => {
    if (selectedAreaId === 'all') return allMocks;
    return allMocks.filter((m) => String(m.preparationAreaId) === String(selectedAreaId));
  }, [allMocks, selectedAreaId]);

  // Today study calculations
  const todaySessions = useMemo(() => {
    return sessions.filter((s) => s.startTime && s.startTime.startsWith(TODAY));
  }, [sessions]);

  const completedHoursToday = useMemo(() => {
    const totalMinutes = todaySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [todaySessions]);

  const dailyTargetHours = settings?.dailyStudyHours || 8;
  const scheduledHoursToday = useMemo(() => {
    const mins = tasks.reduce((sum, t) => sum + (t.durationMinutes || 60), 0);
    return Math.round((mins / 60) * 10) / 10;
  }, [tasks]);
  const remainingHoursToday = Math.max(0, Math.round((dailyTargetHours - completedHoursToday) * 10) / 10);

  // Weak topics from mock errors
  const weakTopics = useMemo(() => {
    const list = [];
    filteredTopics.forEach((t) => {
      const areaMocksCount = allMocks.filter((m) => m.preparationAreaId === t.preparationAreaId).length;
      if (areaMocksCount > 0) {
        const perf = classifyTopicPerformance(t.id, allErrors, areaMocksCount);
        if (perf.label === 'Critical' || perf.label === 'Weak') {
          list.push({ topic: t, perf, count: allErrors.filter((e) => e.topicId === t.id).length });
        }
      }
    });
    return list.sort((a, b) => b.count - a.count).slice(0, 4);
  }, [filteredTopics, allMocks, allErrors]);

  // Quick memory rating handler
  const handleRateRevision = async (revId, rating) => {
    await completeRevision(revId, rating, 'Completed from Dashboard Command Center');
    loadData();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div>
      {/* ── DAILY COMMAND CENTER HEADER ────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">Daily Command Center</h1>
            {streak > 0 && (
              <span className="badge badge-warning" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={13} /> {streak} Day Streak
              </span>
            )}
          </div>
          <p className="page-subtitle">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} · Target: <strong>{dailyTargetHours} hours</strong>
          </p>
        </div>

        {/* Quick Area Switcher Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius)' }}>
          <button
            className={`btn btn-sm ${selectedAreaId === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSelectedAreaId('all')}
          >
            All Areas
          </button>
          {areas.map((a) => (
            <button
              key={a.id}
              className={`btn btn-sm ${selectedAreaId === String(a.id) ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setSelectedAreaId(String(a.id))}
            >
              {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── TARGET STATS BAR ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Study Target</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-light)', marginTop: 2 }}>{dailyTargetHours}h</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Daily goal</div>
          </div>
          <RingProgress value={Math.round((completedHoursToday / dailyTargetHours) * 100)} size={54} color="var(--primary)" />
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Scheduled</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--warning)', marginTop: 2 }}>{scheduledHoursToday}h</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{tasks.length} tasks planned</div>
          </div>
          <Clock size={28} style={{ color: 'var(--warning)', opacity: 0.8 }} />
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Completed</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)', marginTop: 2 }}>{completedHoursToday}h</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{todaySessions.length} sessions logged</div>
          </div>
          <CheckCircle2 size={28} style={{ color: 'var(--success)', opacity: 0.8 }} />
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 700 }}>Remaining</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: remainingHoursToday > 0 ? 'var(--text)' : 'var(--success)', marginTop: 2 }}>
              {remainingHoursToday}h
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>{remainingHoursToday > 0 ? 'To reach target' : 'Target met! 🎉'}</div>
          </div>
          <Target size={28} style={{ color: remainingHoursToday > 0 ? 'var(--text-3)' : 'var(--success)', opacity: 0.8 }} />
        </div>
      </div>

      {/* ── 2-COLUMN COMMAND CENTER GRID ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* LEFT COLUMN: Study Focus, Sessions, Revisions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* MODULE 0: NEXT STUDY SESSION CARD */}
          <div className="card" style={{ border: '1px solid rgba(99, 102, 241, 0.4)', background: 'linear-gradient(135deg, var(--surface), rgba(99, 102, 241, 0.05))', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-light)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                <Clock size={16} /> NEXT STUDY SESSION
              </div>
              {nextStudySession && (
                <span className="badge badge-primary" style={{ fontSize: 11 }}>
                  ⏰ Reminder: {nextStudySession.reminderTime}
                </span>
              )}
            </div>

            {!nextStudySession ? (
              <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No study sessions scheduled.
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span className="badge" style={{ background: `${nextStudySession.areaColor}20`, color: nextStudySession.areaColor, borderColor: nextStudySession.areaColor, fontSize: 10 }}>
                      {nextStudySession.areaName}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{nextStudySession.subjectName}</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                    {nextStudySession.subjectName} → {nextStudySession.topicName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <span>🕒 Starts at: <strong>{nextStudySession.startTime}</strong></span>
                    <span>⏱️ Duration: <strong>{nextStudySession.durationMinutes} min</strong></span>
                    {nextStudySession.isConflict && (
                      <span className="badge badge-danger" style={{ fontSize: 10 }}>⚠️ Overlaps Teaching Period</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      window.location.href = `/sessions?topicId=${nextStudySession.topicId || ''}&subjectId=${nextStudySession.subjectId || ''}&areaId=${nextStudySession.preparationAreaId || ''}`;
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Play size={14} /> Start Session
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MODULE 1: WHAT SHOULD I STUDY NOW? */}
          <div className="card" style={{ border: '1px solid var(--primary)', background: 'var(--primary-glass)', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary-light)', fontWeight: 800, fontSize: 14 }}>
                <Zap size={18} /> WHAT SHOULD I STUDY NOW?
              </div>
              {recommendation?.isRevision && <span className="badge badge-warning">Adaptive Revision</span>}
            </div>

            {!recommendation || !recommendation.candidate ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', background: 'var(--card)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>✨</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
                  {recommendation?.message || 'No pending tasks found. Take a break!'}
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', padding: 18 }}>
                {/* Hierarchical breadcrumb */}
                {recommendation.fullHierarchicalPath && (
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
                    {recommendation.fullHierarchicalPath}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                    {recommendation.hierarchicalName || recommendation.candidate.name}
                  </div>
                  <span className="badge badge-primary">
                    Priority Score: {recommendation.score}
                  </span>
                </div>

                {/* Why justification list */}
                <div style={{ fontSize: 12, background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--primary-light)', marginBottom: 4 }}>
                    Why this topic now?
                  </div>
                  {recommendation.reasonsList && recommendation.reasonsList.length > 1 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {recommendation.reasonsList.map((r, i) => (
                        <div key={i} style={{ color: 'var(--text-2)' }}>• {r}</div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-2)' }}>{recommendation.reason}</div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <a href="/sessions" className="btn btn-primary" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>
                    <Play size={14} /> START SESSION ({recommendation.recommendedDuration || 60}m)
                  </a>
                  <a href="/planner" className="btn btn-ghost" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>
                    SCHEDULE IN PLANNER
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* MODULE 2: TODAY'S ROUTINE (INTEGRATED TIMELINE) */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={16} /> TODAY'S ROUTINE ({tasks.length + (teachingSlots.filter((s) => s.active).length)} blocks)
              </div>
              <a href="/planner" className="btn btn-sm btn-ghost">
                Open Planner <ChevronRight size={12} />
              </a>
            </div>

            {(() => {
              const now = new Date();
              const nowMinutes = now.getHours() * 60 + now.getMinutes();
              const todayDayName = format(now, 'EEEE');

              // 1. Gather active teaching slots for today
              const todayTeaching = teachingSlots
                .filter((s) => {
                  if (!s.active) return false;
                  const d = s.day || s.dayOfWeek;
                  return d && (d.toLowerCase() === todayDayName.toLowerCase() || d === now.getDay());
                })
                .map((s) => ({
                  isTeaching: true,
                  startTime: s.startTime || '00:00',
                  endTime: s.endTime || '00:00',
                  title: s.title || 'Teaching Period',
                }));

              // 2. Gather today's study tasks
              const todayStudyTasks = tasks.map((t) => {
                let startM = 0;
                let endM = 0;
                if (t.startTime) {
                  const [sh, sm] = t.startTime.split(':').map(Number);
                  startM = sh * 60 + sm;
                }
                if (t.endTime) {
                  const [eh, em] = t.endTime.split(':').map(Number);
                  endM = eh * 60 + em;
                } else {
                  endM = startM + (Number(t.durationMinutes) || 60);
                }

                let statusBadge = '⚪ Not Started';
                let badgeClass = 'badge-muted';
                if ((t.status || '').toLowerCase() === 'completed') {
                  statusBadge = '✅ Completed';
                  badgeClass = 'badge-success';
                } else if (nowMinutes >= startM && nowMinutes <= endM) {
                  statusBadge = '🟡 In Progress';
                  badgeClass = 'badge-warning';
                } else if (nowMinutes > endM) {
                  statusBadge = '🔴 Missed';
                  badgeClass = 'badge-danger';
                } else if (nowMinutes < startM) {
                  statusBadge = '🟣 Upcoming';
                  badgeClass = 'badge-primary';
                }

                return {
                  isTeaching: false,
                  task: t,
                  startTime: t.startTime || '09:00',
                  endTime: t.endTime || '10:00',
                  title: t.topicName || t.title || 'Study Session',
                  subjectName: t.subjectName,
                  statusBadge,
                  badgeClass,
                  source: t.source || 'auto',
                  isUserEdited: !!t.isUserEdited,
                  isLocked: !!t.isLocked,
                };
              });

              // 3. Merge and sort chronologically
              const routineBlocks = [...todayTeaching, ...todayStudyTasks].sort((a, b) =>
                (a.startTime || '').localeCompare(b.startTime || '')
              );

              if (routineBlocks.length === 0) {
                return (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                    No scheduled routine for today yet. Use the Study Planner to generate or add your tasks!
                  </div>
                );
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {routineBlocks.map((block, idx) => {
                    if (block.isTeaching) {
                      return (
                        <div
                          key={`teach-${idx}`}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', background: 'var(--warning-glass)',
                            border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 16 }}>🏫</span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)' }}>
                                {block.title} — Unavailable for study
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                                {block.startTime} – {block.endTime}
                              </div>
                            </div>
                          </div>
                          <span className="badge" style={{ background: 'var(--warning)', color: '#000', fontSize: 10, fontWeight: 700 }}>
                            Teaching
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={block.task.id || block.task._id || `task-${idx}`}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', background: 'var(--surface)',
                          border: `1px solid ${block.isLocked ? '#ef4444' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)', flexWrap: 'wrap', gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                              📚 {block.subjectName ? `${block.subjectName} → ` : ''}{block.title}
                            </span>
                            {block.isLocked ? (
                              <span className="badge" style={{ fontSize: 8, background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>🔒 Locked</span>
                            ) : block.isUserEdited ? (
                              <span className="badge badge-warning" style={{ fontSize: 8 }}>✏️ Edited by You</span>
                            ) : block.source === 'auto' ? (
                              <span className="badge badge-primary" style={{ fontSize: 8 }}>✨ AI Generated</span>
                            ) : (
                              <span className="badge badge-muted" style={{ fontSize: 8 }}>👤 Manual</span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                            🕒 {block.startTime} – {block.endTime} ({block.task.durationMinutes || 60}m)
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={`badge ${block.badgeClass}`} style={{ fontSize: 10 }}>
                            {block.statusBadge}
                          </span>
                          {(block.statusBadge.includes('Upcoming') || block.statusBadge.includes('In Progress') || block.statusBadge.includes('Missed')) && (
                            <a
                              href={`/sessions?topicId=${block.task.topicId || ''}&subjectId=${block.task.subjectId || ''}&areaId=${block.task.preparationAreaId || ''}`}
                              className="btn btn-xs btn-primary"
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Play size={10} /> Start
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* MODULE 3: TODAY'S STUDY SESSIONS */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title">
                <Clock size={16} /> Completed Session Logs ({todaySessions.length})
              </div>
              <a href="/sessions" className="btn btn-sm btn-ghost">
                Session Timer <ChevronRight size={12} />
              </a>
            </div>

            {todaySessions.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                No study sessions logged today yet. Start a timer to track your hours!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {todaySessions.map((s) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                        {s.topicName || 'Study Session'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                        {s.startTime ? format(parseISO(s.startTime), 'hh:mm a') : 'Today'} · {s.durationMinutes || 0} minutes
                      </div>
                    </div>
                    <span className="badge badge-success">Logged</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MODULE 3: REVISIONS DUE TODAY */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title">
                <RotateCcw size={16} /> Adaptive Revisions Due ({filteredRevisions.length})
              </div>
              <a href="/revision" className="btn btn-sm btn-ghost">
                View All <ChevronRight size={12} />
              </a>
            </div>

            {filteredRevisions.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                ✅ No revisions due today! All spaced repetition intervals are up to date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredRevisions.slice(0, 4).map((r) => (
                  <div key={r.id} style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                          {r.topicName || `Topic #${r.topicId}`}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                          Revision #{r.revisionNumber || 1} · Interval: {r.intervalDays || 1}d
                        </div>
                      </div>
                      <span className="badge badge-warning">Due Today</span>
                    </div>

                    {/* Quick rate buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid var(--border-light, rgba(255,255,255,0.04))' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Rate Recall:</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            className="btn btn-xs btn-ghost"
                            onClick={() => handleRateRevision(r.id, rating)}
                            title={`Rate memory: ${rating}/5`}
                            style={{ padding: '2px 8px' }}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Syllabus, Weaknesses, Vocab & Mock Follow-up */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* SYLLABUS PROGRESS CARD (Course-Specific or All) */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title">
                <BookOpen size={16} /> Syllabus Progress
              </div>
              <a href="/preparation" className="btn btn-sm btn-ghost">
                Syllabus Map <ChevronRight size={12} />
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {areas.map((area) => {
                const areaTopics = topics.filter((t) => t.preparationAreaId === area.id);
                const prog = calculateAreaProgress(area.id, topics);
                if (selectedAreaId !== 'all' && selectedAreaId !== String(area.id)) return null;

                return (
                  <div key={area.id} style={{ padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${area.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{area.name}</span>
                      {prog.isMapped ? (
                        <span style={{ fontSize: 13, fontWeight: 800, color: area.color }}>{prog.percentage}%</span>
                      ) : (
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>Unmapped</span>
                      )}
                    </div>

                    {prog.isMapped ? (
                      <>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div className="progress-fill" style={{ width: `${prog.percentage}%`, background: area.color }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
                          {prog.completed}/{prog.total} topics completed
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>No syllabus mapped yet</span>
                        <a href="/preparation" style={{ fontSize: 11, color: area.color, fontWeight: 600 }}>
                          + Map Syllabus →
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MODULE 4: WEAK TOPICS */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title" style={{ color: 'var(--danger-light)' }}>
                <ShieldAlert size={16} /> Weak Topics from Mocks ({weakTopics.length})
              </div>
            </div>

            {weakTopics.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--success)', fontSize: 12 }}>
                ✅ No repeated error topics detected in your recent mocks.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {weakTopics.map(({ topic, perf, count }) => (
                  <div key={topic.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--danger-glass)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{topic.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--danger)' }}>{count} errors recorded · {perf.label}</div>
                    </div>
                    <a href="/preparation" className="btn btn-xs btn-ghost">Focus</a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MODULE 5: MOCK FOLLOW-UP & RECENT PERFORMANCE */}
          {filteredMocks.length > 0 && (
            <div className="card">
              <div className="card-header" style={{ marginBottom: 10 }}>
                <div className="card-title">
                  <BarChart3 size={16} /> Latest Mock Performance
                </div>
                <a href="/mocks" className="btn btn-sm btn-ghost">
                  All Mocks <ChevronRight size={12} />
                </a>
              </div>

              {(() => {
                const latest = filteredMocks[0];
                return (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Mock #{latest.mockNumber} ({latest.examName || 'Mock Test'})</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary-light)' }}>
                        {latest.score}/{latest.maxScore || 100}
                      </span>
                    </div>

                    {latestMockLosses.length > 0 && (
                      <div style={{ fontSize: 11, background: 'var(--surface-2)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ color: 'var(--text-3)' }}>Top Mark Loss: </span>
                        <strong>{latestMockLosses[0].errorType}</strong> (-{latestMockLosses[0].marksLost} marks)
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* MODULE 6: DAILY VOCABULARY */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 10 }}>
              <div className="card-title">
                <BookMarked size={16} /> Daily Vocabulary
                <span className={`badge ${todayVocab.length >= 10 ? 'badge-success' : 'badge-warning'}`}>
                  {todayVocab.length}/10 words
                </span>
              </div>
              <a href="/vocabulary" className="btn btn-sm btn-ghost">
                Practice <ChevronRight size={12} />
              </a>
            </div>

            {todayVocab.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                No words learned today yet. Add 10 words to maintain your vocabulary target!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todayVocab.slice(0, 3).map((v) => (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <strong>{v.word}</strong>
                    <span style={{ color: 'var(--text-2)' }}>{v.meaning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MODULE 7: TODAY'S GITA SHLOKA */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%)',
            border: '1px solid var(--border-accent)'
          }}>
            <div className="card-header" style={{ marginBottom: 10 }}>
              <div className="card-title">
                📖 Today's Gita Shloka
              </div>
              <a href="/gita-shloka" className="btn btn-sm btn-ghost">
                {todayGita ? 'View Shloka' : '+ Add Today\'s Shloka'} <ChevronRight size={12} />
              </a>
            </div>

            {todayGita ? (
              <div>
                {(todayGita.chapter || todayGita.verse) && (
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary-light)', marginBottom: 4 }}>
                    Chapter {todayGita.chapter || '?'} • Verse {todayGita.verse || '?'}
                  </div>
                )}
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontFamily: "'Segoe UI', 'Noto Sans Devanagari', 'Mangal', serif",
                  marginBottom: 6,
                  lineHeight: 1.4
                }} className="truncate">
                  {todayGita.sanskritText}
                </div>
                {todayGita.meaning && (
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }} className="truncate">
                    {todayGita.meaning}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 8 }}>
                  No shloka added today.
                </div>
                <a href="/gita-shloka" className="btn btn-sm btn-primary">
                  + Add Today's Shloka
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
