// src/pages/MockTests.jsx
import { useEffect, useState } from 'react';
import { Plus, X, BarChart3, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import {
  getAllMocks, addMock, getMockSubjectResults, addMockSubjectResults,
  getAllAreas, getAllSubjects, getAllTopics, addNotification
} from '../services/db';
import { calculateAccuracy, getScoreTrend, classifySubjectPerformance } from '../services/analyticsService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import AddMockWizard from '../components/AddMockWizard';
import MockDetailModal from '../components/MockDetailModal';

export default function MockTests() {
  const [mocks, setMocks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedMock, setSelectedMock] = useState(null);
  const [selectedMockResults, setSelectedMockResults] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [m, a, s, t] = await Promise.all([getAllMocks(), getAllAreas(), getAllSubjects(), getAllTopics()]);
    setMocks(m);
    setAreas(a);
    setSubjects(s);
    setTopics(t);
  };

  const handleViewMock = async (mock) => {
    setSelectedMock(mock);
    const results = await getMockSubjectResults(mock.id);
    setSelectedMockResults(results);
  };

  const filteredMocks = filter === 'all' ? mocks : mocks.filter((m) => m.preparationAreaId === parseInt(filter));
  const scoreTrend = getScoreTrend(filteredMocks);

  const avgAccuracy = filteredMocks.length
    ? Math.round(filteredMocks.reduce((sum, m) => sum + calculateAccuracy(m.correct, m.attempted), 0) / filteredMocks.length)
    : 0;

  const latestMock = filteredMocks[0];
  const latestScore = latestMock && latestMock.maxScore
    ? Math.round((latestMock.score / latestMock.maxScore) * 100)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Mock Tests</h1>
          <p className="page-subtitle">Record and analyze your mock test performance</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Mock Result
        </button>
      </div>

      {/* Filter tabs */}
      <div className="tabs mb-24" style={{ alignSelf: 'flex-start' }}>
        <button className={`tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        {areas.map((a) => (
          <button key={a.id} className={`tab ${filter === a.id ? 'active' : ''}`} onClick={() => setFilter(a.id)}>
            {a.name}
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid-4 mb-24">
        <StatCard icon="📝" label="Total Mocks" value={filteredMocks.length} color="var(--primary)" />
        <StatCard icon="🎯" label="Avg Accuracy" value={`${avgAccuracy}%`} color="var(--info)" />
        <StatCard icon="⭐" label="Latest Score" value={`${latestScore}%`} color={latestScore >= 70 ? 'var(--success)' : latestScore >= 45 ? 'var(--warning)' : 'var(--danger)'} />
        <StatCard icon="📈" label="Best Score" value={`${filteredMocks.length ? Math.max(...filteredMocks.map((m) => m.maxScore ? Math.round((m.score / m.maxScore) * 100) : 0)) : 0}%`} color="var(--success)" />
      </div>

      {/* Score Trend Chart */}
      {scoreTrend.length > 1 && (
        <div className="card mb-24">
          <div className="card-header">
            <div className="card-title"><TrendingUp size={16} /> Score Trend</div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--text)' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }} />
              <Line type="monotone" dataKey="percentage" name="Score %" stroke="var(--primary)" strokeWidth={2} dot={{ fill: 'var(--primary)', r: 4 }} />
              <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="var(--success)" strokeWidth={2} dot={{ fill: 'var(--success)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mock List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><BarChart3 size={16} /> Mock History</div>
        </div>
        {filteredMocks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No mock tests recorded</div>
            <div className="empty-desc">Add your first mock test result to start tracking performance</div>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              <Plus size={14} /> Add Mock Result
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Exam</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Correct</th>
                  <th>Wrong</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMocks.map((m) => {
                  const acc = calculateAccuracy(m.correct, m.attempted);
                  const scorePercent = m.maxScore ? Math.round((m.score / m.maxScore) * 100) : 0;
                  const perf = classifySubjectPerformance(acc);
                  return (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>#{m.mockNumber}</td>
                      <td style={{ fontWeight: 500 }}>{m.examName || '—'}</td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                        {m.date ? format(new Date(m.date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: scorePercent >= 70 ? 'var(--success)' : scorePercent >= 45 ? 'var(--warning)' : 'var(--danger)' }}>
                          {m.score != null && m.maxScore ? `${m.score}/${m.maxScore} (${scorePercent}%)` : '—'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{m.correct ?? '—'}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{m.wrong ?? '—'}</td>
                      <td>
                        <span style={{ color: perf.color, fontWeight: 600 }}>{acc}% {perf.icon}</span>
                      </td>
                      <td style={{ color: 'var(--text-2)', fontSize: 12 }}>
                        {m.timeTaken != null ? `${m.timeTaken}m` : '—'}
                      </td>
                      <td>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleViewMock(m)}>
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Mock Wizard */}
      {showAdd && (
        <AddMockWizard
          areas={areas}
          subjects={subjects}
          topics={topics}
          onClose={() => setShowAdd(false)}
          onSuccess={() => {
            setShowAdd(false);
            loadData();
          }}
        />
      )}

      {/* View Details Modal */}
      {selectedMock && (
        <MockDetailModal
          mock={selectedMock}
          results={selectedMockResults}
          subjects={subjects}
          topics={topics}
          onClose={() => { setSelectedMock(null); setSelectedMockResults([]); }}
        />
      )}
    </div>
  );
}

// Removed legacy AddMockModal and MockDetailModal components

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card" style={{ '--accent-color': color }}>
      <div className="stat-icon" style={{ background: `${color}20`, fontSize: 20 }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
