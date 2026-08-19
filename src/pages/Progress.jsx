// src/pages/Progress.jsx
import { useEffect, useState } from 'react';
import { getAllTopics, getAllSessions, getAllMocks, getAllVocab, getAllAreas, getAllSubjects, getPendingRevisions } from '../services/db';
import { getScoreTrend, calculateAccuracy, analyzeSubjectWiseMocks, classifySubjectPerformance } from '../services/analyticsService';
import { format, subDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

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
    const [t, s, m, v, a, subs, revs] = await Promise.all([
      getAllTopics(), getAllSessions(), getAllMocks(), getAllVocab(), getAllAreas(), getAllSubjects(), getPendingRevisions()
    ]);
    setTopics(t); setSessions(s); setMocks(m); setVocab(v); setAreas(a); setSubjects(subs); setRevisions(revs);
    setLoading(false);
  };

  const getDays = () => {
    if (filter === '7') return 7;
    if (filter === '30') return 30;
    if (filter === '90') return 90;
    return 365;
  };

  const cutoffDate = format(subDays(new Date(), getDays()), 'yyyy-MM-dd');

  // Daily study hours for chart
  const days = eachDayOfInterval({ start: subDays(new Date(), getDays()), end: new Date() });
  const dailyHoursData = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySessions = sessions.filter((s) => s.startTime?.startsWith(dateStr));
    const hours = daySessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60;
    return { date: format(day, 'MMM d'), hours: Math.round(hours * 10) / 10 };
  });

  // Area-wise completion
  const areaProgress = areas.map((area) => {
    const areaTopics = topics.filter((t) => t.preparationAreaId === area.id);
    const done = areaTopics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
    return { name: area.name.split(' ').slice(0, 2).join(' '), completed: done, total: areaTopics.length, pct: areaTopics.length ? Math.round((done / areaTopics.length) * 100) : 0, fill: area.color };
  });

  // Topic status distribution
  const statusCounts = {
    'Not Started': topics.filter((t) => t.status === 'Not Started').length,
    'Learning': topics.filter((t) => t.status === 'Learning').length,
    'Completed': topics.filter((t) => t.status === 'Completed').length,
    'Needs Revision': topics.filter((t) => t.status === 'Needs Revision').length,
    'Mastered': topics.filter((t) => t.status === 'Mastered').length,
  };
  const pieData = Object.entries(statusCounts).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  // Score trend
  const filteredMocks = mocks.filter((m) => m.date >= cutoffDate);
  const scoreTrend = getScoreTrend(filteredMocks);

  // Subject performance (radar)
  const ibpsSubjects = subjects.filter((s) => {
    const area = areas.find((a) => a.id === s.preparationAreaId);
    return area?.name.includes('IBPS');
  });
  const radarData = ibpsSubjects.slice(0, 8).map((sub) => {
    const subTopics = topics.filter((t) => t.subjectId === sub.id);
    const done = subTopics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
    const pct = subTopics.length ? Math.round((done / subTopics.length) * 100) : 0;
    return { subject: sub.name.split(' ')[0], completion: pct };
  });

  // Total study hours
  const filteredSessions = sessions.filter((s) => s.startTime && s.startTime.slice(0, 10) >= cutoffDate);
  const totalHours = filteredSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60;
  const avgDailyHours = totalHours / getDays();

  // Revision Stats (Phase 5)
  const completedRevisions = revisions.filter(r => r.status === 'Completed' && r.completedDate >= cutoffDate);
  const avgMemory = completedRevisions.length > 0 ? (completedRevisions.reduce((sum, r) => sum + (r.confidence || 0), 0) / completedRevisions.length) : 0;
  
  // Retention Trend
  // Group completed revisions by date to see average memory rating over time
  const retentionMap = {};
  completedRevisions.forEach(r => {
    if (r.confidence) {
      const date = format(new Date(r.completedDate), 'MMM d');
      if (!retentionMap[date]) retentionMap[date] = { date, sum: 0, count: 0 };
      retentionMap[date].sum += r.confidence;
      retentionMap[date].count += 1;
    }
  });
  const retentionTrendData = Object.values(retentionMap).map(d => ({
    date: d.date,
    memory: Number((d.sum / d.count).toFixed(1))
  })).sort((a, b) => new Date(a.date) - new Date(b.date)); // Simple string sort might fail across years, but ok for a small trend chart.

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  const PIE_COLORS = { 'Not Started': '#475569', 'Learning': '#3b82f6', 'Completed': '#22c55e', 'Needs Revision': '#f59e0b', 'Mastered': '#6366f1' };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Visual analytics of your study journey</p>
        </div>
        <div className="tabs">
          {['7', '30', '90', 'all'].map((f) => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All Time' : `${f} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid-4 mb-24">
        <StatCard icon="⏱️" label="Total Study Hours" value={`${totalHours.toFixed(1)}h`} sub={`${avgDailyHours.toFixed(1)}h/day avg`} color="var(--primary)" />
        <StatCard icon="📚" label="Topics Completed" value={topics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length} sub={`of ${topics.length} total`} color="var(--success)" />
        <StatCard icon="🧠" label="Avg Memory Rating" value={avgMemory.toFixed(1)} sub="out of 5.0" color="var(--info)" />
        <StatCard icon="🔄" label="Revisions Done" value={completedRevisions.length} sub={`in last ${getDays()} days`} color="var(--warning)" />
      </div>

      {/* Daily Study Hours Chart */}
      <div className="card mb-24">
        <div className="card-header">
          <div className="card-title">📊 Daily Study Hours</div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dailyHoursData.slice(-30)} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--text-2)', fontSize: 10 }} tickLine={false}
              interval={getDays() <= 7 ? 0 : Math.floor(getDays() / 6)} />
            <YAxis tick={{ fill: 'var(--text-2)', fontSize: 10 }} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="hours" name="Study Hours" fill="var(--primary)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row: Area Progress + Topic Status Pie */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        {/* Area Progress */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🎯 Preparation Area Progress</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {areas.map((area) => {
              const areaTopics = topics.filter((t) => t.preparationAreaId === area.id);
              const done = areaTopics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
              const isMapped = areaTopics.length > 0;
              const pct = isMapped ? Math.round((done / areaTopics.length) * 100) : 0;

              return (
                <div key={area.id} style={{ padding: '10px 14px', background: 'var(--surface)', borderRadius: 'var(--radius)', borderLeft: `3px solid ${area.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{area.name}</span>
                    {isMapped ? (
                      <span style={{ fontSize: 13, fontWeight: 800, color: area.color }}>{pct}%</span>
                    ) : (
                      <span className="badge badge-muted" style={{ fontSize: 10 }}>Unmapped</span>
                    )}
                  </div>
                  {isMapped ? (
                    <>
                      <div className="progress-bar" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${pct}%`, background: area.color }} />
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>
                        {done}/{areaTopics.length} topics completed
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 2 }}>
                      No syllabus mapped yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Topic Status Pie */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📋 Topic Status</div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData.length > 0 ? pieData : [{ name: 'No Data', value: 1 }]} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieData.length > 0 ? pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] || '#6366f1'} />
                )) : (
                  <Cell key="No Data" fill="var(--surface-3)" />
                )}
              </Pie>
              {pieData.length > 0 && <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />}
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pieData.length === 0 && <div style={{ fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>No topics added yet</div>}
            {pieData.map((entry) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: PIE_COLORS[entry.name] || '#6366f1', flexShrink: 0 }} />
                <span style={{ flex: 1, color: 'var(--text-2)' }}>{entry.name}</span>
                <span style={{ fontWeight: 600 }}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mock Score Trend */}
      {scoreTrend.length > 0 && (
        <div className="card mb-24">
          <div className="card-header">
            <div className="card-title">📈 Mock Test Progression</div>
          </div>
          {scoreTrend.length < 2 ? (
            <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', padding: '20px 0' }}>
              Add more mock tests to see the trend
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="percentage" name="Score %" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="var(--success)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      )}

      {/* Retention Trend */}
      {retentionTrendData.length > 0 && (
        <div className="card mb-24">
          <div className="card-header">
            <div className="card-title">🧠 Retention Trend (Memory Rating)</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={retentionTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <YAxis domain={[0, 5]} tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="memory" name="Avg Rating" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* IBPS Radar (subject completion) */}
      {radarData.length > 2 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">🕸️ IBPS Subject Completion Radar</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 10 }} />
              <Radar name="Completion" dataKey="completion" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
              <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
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
