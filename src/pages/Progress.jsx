// src/pages/Progress.jsx
// Visual analytics driven 100% by real user database entries

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllTopics, getAllSessions, getAllMocks, getAllVocab,
  getAllAreas, getAllSubjects, getAllRevisions
} from '../services/db';
import { getScoreTrend, calculateAccuracy } from '../services/analyticsService';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { Clock, BookOpen, Brain, RotateCcw, Play, Target, Award } from 'lucide-react';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];
const PIE_COLORS = {
  'Not Started': '#475569',
  'Learning': '#3b82f6',
  'Completed': '#22c55e',
  'Needs Revision': '#f59e0b',
  'Mastered': '#6366f1',
};

export default function Progress() {
  const [topics, setTopics] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [mocks, setMocks] = useState([]);
  const [vocab, setVocab] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [filter, setFilter] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, s, m, v, a, subs, revs] = await Promise.all([
        getAllTopics(),
        getAllSessions(),
        getAllMocks(),
        getAllVocab(),
        getAllAreas(),
        getAllSubjects(),
        getAllRevisions(),
      ]);
      setTopics(t || []);
      setSessions(s || []);
      setMocks(m || []);
      setVocab(v || []);
      setAreas(a || []);
      setSubjects(subs || []);
      setRevisions(revs || []);
    } catch (err) {
      console.error('[Progress] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysCount = () => {
    if (filter === '7') return 7;
    if (filter === '30') return 30;
    if (filter === '90') return 90;
    return 365;
  };

  const daysCount = getDaysCount();
  const cutoffDateStr = format(subDays(new Date(), daysCount), 'yyyy-MM-dd');

  // Filter sessions in range
  const filteredSessions = sessions.filter((s) => {
    const sDate = (s.startTime || s.date || '').slice(0, 10);
    return sDate && sDate >= cutoffDateStr;
  });

  const totalStudyMinutes = filteredSessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
  const totalHours = totalStudyMinutes / 60;
  const avgDailyHours = totalHours / Math.max(1, Math.min(daysCount, 30));

  // Build honest daily hours data for the selected range
  let dailyHoursData = [];
  if (filter === '7' || filter === '30') {
    const dayInterval = eachDayOfInterval({ start: subDays(new Date(), daysCount - 1), end: new Date() });
    dailyHoursData = dayInterval.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const daySessions = filteredSessions.filter((s) => (s.startTime || s.date || '').startsWith(dateStr));
      const mins = daySessions.reduce((sum, s) => sum + (Number(s.durationMinutes) || 0), 0);
      return {
        date: format(day, filter === '7' ? 'EEE, d' : 'MMM d'),
        hours: Math.round((mins / 60) * 10) / 10,
      };
    });
  } else {
    // For 90 days or All Time: group strictly by days with actual sessions or weekly buckets
    const dateMap = {};
    filteredSessions.forEach((s) => {
      const dateStr = (s.startTime || s.date || '').slice(0, 10);
      if (dateStr) {
        dateMap[dateStr] = (dateMap[dateStr] || 0) + (Number(s.durationMinutes) || 0);
      }
    });
    const sortedDates = Object.keys(dateMap).sort();
    dailyHoursData = sortedDates.map((d) => ({
      date: format(parseISO(d), 'MMM d'),
      hours: Math.round((dateMap[d] / 60) * 10) / 10,
    }));
  }

  // Topic status distribution from real topics
  const statusCounts = {
    'Not Started': topics.filter((t) => t.status === 'Not Started' || !t.status).length,
    'Learning': topics.filter((t) => t.status === 'Learning' || t.status === 'In Progress').length,
    'Completed': topics.filter((t) => t.status === 'Completed').length,
    'Needs Revision': topics.filter((t) => t.status === 'Needs Revision').length,
    'Mastered': topics.filter((t) => t.status === 'Mastered').length,
  };
  const pieData = Object.entries(statusCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  // Mock score trend from real mocks
  const filteredMocks = mocks
    .filter((m) => m.date && m.date >= cutoffDateStr)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const scoreTrend = getScoreTrend(filteredMocks);

  // Completed revisions & memory rating
  const completedRevisions = revisions.filter(
    (r) => (r.status || '').toLowerCase() === 'completed' && (r.completedDate || r.updatedAt || '').slice(0, 10) >= cutoffDateStr
  );
  const avgMemory = completedRevisions.length > 0
    ? completedRevisions.reduce((sum, r) => sum + (Number(r.confidence || r.memoryRating || 0)), 0) / completedRevisions.length
    : 0;

  // Retention Trend (memory ratings over time)
  const retentionMap = {};
  completedRevisions.forEach((r) => {
    const rating = Number(r.confidence || r.memoryRating || 0);
    const dateStr = (r.completedDate || r.updatedAt || '').slice(0, 10);
    if (rating > 0 && dateStr) {
      const label = format(parseISO(dateStr), 'MMM d');
      if (!retentionMap[label]) retentionMap[label] = { date: label, sum: 0, count: 0, rawDate: dateStr };
      retentionMap[label].sum += rating;
      retentionMap[label].count += 1;
    }
  });
  const retentionTrendData = Object.values(retentionMap)
    .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
    .map((d) => ({
      date: d.date,
      memory: Number((d.sum / d.count).toFixed(1)),
    }));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 className="page-title">Progress & Visual Analytics</h1>
          <p className="page-subtitle">Real-time progress calculated strictly from your study logs</p>
        </div>
        <div className="tabs">
          {[
            { key: '7', label: '7 Days' },
            { key: '30', label: '30 Days' },
            { key: '90', label: '90 Days' },
            { key: 'all', label: 'All Time' },
          ].map((f) => (
            <button
              key={f.key}
              className={`tab ${filter === f.key ? 'active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TOP STATS BAR ────────────────────────────────────────── */}
      <div className="grid-4 mb-24">
        <StatCard
          icon="⏱️"
          label="Total Study Hours"
          value={`${totalHours.toFixed(1)}h`}
          sub={`${filteredSessions.length} sessions logged`}
          color="var(--primary)"
        />
        <StatCard
          icon="📚"
          label="Topics Completed"
          value={topics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length}
          sub={`of ${topics.length} syllabus topics`}
          color="var(--success)"
        />
        <StatCard
          icon="🧠"
          label="Avg Memory Rating"
          value={avgMemory > 0 ? avgMemory.toFixed(1) : '—'}
          sub={completedRevisions.length > 0 ? `out of 5.0 (${completedRevisions.length} reviews)` : 'No revisions yet'}
          color="var(--info)"
        />
        <StatCard
          icon="🔄"
          label="Revisions Done"
          value={completedRevisions.length}
          sub={`in selected period`}
          color="var(--warning)"
        />
      </div>

      {/* ── 1. DAILY STUDY HOURS GRAPH ────────────────────────────── */}
      <div className="card mb-24" style={{ padding: '20px' }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} /> Daily Study Hours
          </div>
          {totalHours > 0 && (
            <span className="badge badge-primary">
              {totalHours.toFixed(1)}h Total · {avgDailyHours.toFixed(1)}h/day avg
            </span>
          )}
        </div>

        {totalStudyMinutes === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏱️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>No Study Hours Recorded Yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 420, margin: '6px auto 14px' }}>
              Your daily study hours will automatically graph here in real-time as you complete study timer sessions.
            </div>
            <Link to="/sessions" className="btn btn-primary btn-sm">
              <Play size={12} /> Start Study Timer
            </Link>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyHoursData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-2)', fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-2)', fontSize: 11 }} tickLine={false} unit="h" />
              <Tooltip
                formatter={(val) => [`${val} hours`, 'Study Time']}
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="hours" name="Study Hours" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 2. PREPARATION AREA PROGRESS & TOPIC STATUS ─────────── */}
      <div className="progress-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24 }}>
        {/* Preparation Area Progress */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Target size={16} /> Preparation Area Progress
            </div>
          </div>

          {areas.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No preparation areas created yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {areas.map((area) => {
                const areaTopics = topics.filter((t) => String(t.preparationAreaId) === String(area.id || area._id));
                const done = areaTopics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
                const isMapped = areaTopics.length > 0;
                const pct = isMapped ? Math.round((done / areaTopics.length) * 100) : 0;

                return (
                  <div
                    key={area.id || area._id}
                    style={{
                      padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--radius)',
                      borderLeft: `4px solid ${area.color || 'var(--primary)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{area.name}</span>
                      {isMapped ? (
                        <span style={{ fontSize: 13, fontWeight: 800, color: area.color || 'var(--primary)' }}>{pct}%</span>
                      ) : (
                        <span className="badge badge-muted" style={{ fontSize: 10 }}>0 Topics</span>
                      )}
                    </div>
                    {isMapped ? (
                      <>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: area.color || 'var(--primary)' }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
                          {done} of {areaTopics.length} topics completed
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
                        No topics assigned to this area yet.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Topic Status Breakdown */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={16} /> Topic Status ({topics.length})
            </div>
          </div>

          {topics.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              No topics in syllabus yet.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#6366f1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {pieData.map((entry) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[entry.name] || '#6366f1' }} />
                      <span style={{ color: 'var(--text-2)' }}>{entry.name}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{entry.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── 3. MOCK TEST SCORE PROGRESSION ───────────────────────── */}
      <div className="card mb-24">
        <div className="card-header" style={{ marginBottom: 12 }}>
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={16} /> Mock Test Progression ({filteredMocks.length})
          </div>
        </div>

        {scoreTrend.length < 2 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
            {scoreTrend.length === 1
              ? '1 mock test recorded. Complete at least 2 mock tests to view score trends.'
              : 'No mock tests completed in this period yet.'}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreTrend} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-2)', fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="percentage" name="Score %" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── 4. RETENTION & MEMORY RATING TREND ───────────────────── */}
      {retentionTrendData.length > 0 && (
        <div className="card mb-24">
          <div className="card-header" style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Brain size={16} /> Spaced Repetition Retention Trend (Memory Rating)
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={retentionTrendData} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="memory" name="Avg Rating (1-5)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ '--accent-color': color }}>
      <div className="stat-icon" style={{ background: `${color}20`, fontSize: 20 }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{sub}</div>}
    </div>
  );
}
