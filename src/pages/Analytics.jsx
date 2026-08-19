// src/pages/Analytics.jsx
// Detailed Mock & Weakness Analytics driven 100% by genuine user database entries

import { useEffect, useState } from 'react';
import { getAllMocks, getMockSubjectResults, getAllSubjects, getAllAreas, getAllTopics, getErrorLogs } from '../services/db';
import { analyzeSubjectWiseMocks, calculateAccuracy, getWeakSubjects } from '../services/analyticsService';
import { getErrorTypeDistribution, detectRepeatedErrors } from '../services/errorAnalysisEngine';
import { classifyTopicPerformance } from '../services/performanceEngine';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { BarChart2, AlertTriangle, RotateCcw, Target, Award } from 'lucide-react';

const CHART_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

export default function Analytics() {
  const [mocks, setMocks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [areas, setAreas] = useState([]);
  const [topics, setTopics] = useState([]);
  const [errorLogs, setErrorLogs] = useState([]);
  
  const [subjectAnalysis, setSubjectAnalysis] = useState([]);
  const [errorDistribution, setErrorDistribution] = useState([]);
  const [repeatedErrors, setRepeatedErrors] = useState([]);
  const [weakTopics, setWeakTopics] = useState([]);
  
  const [selectedArea, setSelectedArea] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [m, a, s, t, errs] = await Promise.all([
        getAllMocks(), getAllAreas(), getAllSubjects(), getAllTopics(), getErrorLogs()
      ]);
      
      setMocks(m || []); setAreas(a || []); setSubjects(s || []); setTopics(t || []); setErrorLogs(errs || []);

      // Load all subject results
      const resultPromises = (m || []).map((mock) => getMockSubjectResults(mock.id || mock._id));
      const resultsArrays = await Promise.all(resultPromises);
      const allR = resultsArrays.flat();
      
      const analysis = analyzeSubjectWiseMocks(allR, s || []);
      setSubjectAnalysis(analysis);
      
      // Topic-level Error Analysis
      const errDist = getErrorTypeDistribution(errs || []);
      setErrorDistribution(errDist);
      
      const repeated = detectRepeatedErrors(errs || [], t || []);
      setRepeatedErrors(repeated);
      
      const wTopics = [];
      (t || []).forEach((topic) => {
        const areaMocks = (m || []).filter((mock) => String(mock.preparationAreaId) === String(topic.preparationAreaId)).length;
        if (areaMocks > 0) {
          const perf = classifyTopicPerformance(topic.id || topic._id, errs || [], areaMocks);
          if (perf.label === 'Critical' || perf.label === 'Weak') {
            wTopics.push({ ...topic, perf, areaMocks });
          }
        }
      });
      setWeakTopics(wTopics.sort((a, b) => (b.perf?.errorFrequency || 0) - (a.perf?.errorFrequency || 0)));
    } catch (err) {
      console.error('[Analytics] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMocks = selectedArea === 'all' 
    ? mocks 
    : mocks.filter((m) => String(m.preparationAreaId) === String(selectedArea));

  const filteredSubjects = selectedArea === 'all'
    ? subjectAnalysis
    : subjectAnalysis.filter((s) => String(s.preparationAreaId) === String(selectedArea));

  const filteredWeakTopics = selectedArea === 'all'
    ? weakTopics
    : weakTopics.filter((t) => String(t.preparationAreaId) === String(selectedArea));

  const withData = filteredSubjects.filter((s) => s.mockCount > 0);
  
  // Real Trend Chart Data
  const trendData = filteredMocks
    .filter((m) => m.date)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .map((m) => {
      const maxSc = Number(m.maxScore || m.totalMarks || 100);
      const userSc = Number(m.score || m.totalScore || 0);
      const scorePct = maxSc > 0 ? Math.round((userSc / maxSc) * 100) : 0;
      const accuracy = calculateAccuracy(m.correct, m.attempted);

      return {
        name: m.name?.length > 14 ? m.name.slice(0, 14) + '…' : (m.name || 'Mock'),
        score: scorePct,
        accuracy: accuracy || 0,
        date: m.date,
      };
    });

  const pieData = errorDistribution.map((e) => ({ name: e.type, value: e.count }));

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
          <h1 className="page-title">Mock & Weakness Analytics</h1>
          <p className="page-subtitle">Real performance metrics and weakness diagnosis</p>
        </div>
        <div className="tabs">
          <button className={`tab ${selectedArea === 'all' ? 'active' : ''}`} onClick={() => setSelectedArea('all')}>
            All Areas
          </button>
          {areas.map((a) => {
            const areaId = String(a.id || a._id);
            return (
              <button
                key={areaId}
                className={`tab ${String(selectedArea) === areaId ? 'active' : ''}`}
                onClick={() => setSelectedArea(areaId)}
              >
                {a.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {mocks.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>No Mock Test Data Logged Yet</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 420, margin: '6px auto 16px' }}>
              Add completed mock test scores and question error logs in the Mock Tests page to unlock score trends and weakness analytics.
            </div>
            <a href="/mock-tests" className="btn btn-primary btn-sm">Go to Mock Tests</a>
          </div>
        </div>
      ) : (
        <>
          <div className="grid-2 mb-24">
            {/* Score & Accuracy Trend */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: 12 }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Award size={16} /> Score & Accuracy Progression ({trendData.length})
                </div>
              </div>
              {trendData.length === 0 ? (
                <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No mocks logged for this preparation area.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={trendData} margin={{ top: 10, right: 15, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-2)', fontSize: 11 }} unit="%" />
                    <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="score" name="Score %" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="var(--success)" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Error Type Distribution */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: 12 }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={16} /> Mistake Type Breakdown ({errorLogs.length})
                </div>
              </div>
              {pieData.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', minHeight: 240, alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: '1 1 180px', minWidth: 160, height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, paddingRight: 8 }}>
                    {errorDistribution.slice(0, 5).map((e, i) => (
                      <div key={e.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length] }} />
                          {e.type}
                        </span>
                        <span style={{ fontWeight: 700 }}>{e.percentage}% ({e.count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No mistake error logs recorded yet. Log questions you got wrong in Mock Tests to see breakdown.
                </div>
              )}
            </div>
          </div>

          <div className="grid-2 mb-24">
            {/* Weak Topic List */}
            <div className="card" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <div className="card-header" style={{ marginBottom: 12 }}>
                <div className="card-title">🔴 Focus & Weak Topics ({filteredWeakTopics.length})</div>
              </div>
              {filteredWeakTopics.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredWeakTopics.map((t) => (
                    <div
                      key={t.id || t._id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        borderRadius: 'var(--radius)', background: 'var(--danger-glass)', border: '1px solid var(--danger)',
                      }}
                    >
                      <div style={{ fontSize: 20 }}>{t.perf?.icon || '⚠️'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                          {t.perf?.analysis?.errorCount || 0} mistakes across {t.perf?.analysis?.mocksWithErrors || 0} mock tests
                        </div>
                      </div>
                      <span className="badge badge-danger" style={{ fontSize: 10 }}>{t.perf?.label || 'Focus'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No weak topics identified yet in this category.
                </div>
              )}
            </div>

            {/* Repeated Errors */}
            <div className="card" style={{ maxHeight: 400, overflowY: 'auto' }}>
              <div className="card-header" style={{ marginBottom: 12 }}>
                <div className="card-title">⚠️ Repeated Mistakes ({repeatedErrors.length})</div>
              </div>
              {repeatedErrors.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {repeatedErrors.map((re, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                        borderRadius: 'var(--radius)', background: 'var(--warning-glass)', border: '1px solid var(--warning)',
                      }}
                    >
                      <div style={{ fontSize: 20 }}>🔄</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{re.topic?.name || 'Topic'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-2)' }}>
                          Mistakes repeated across {re.mockCount} different mock tests.
                        </div>
                      </div>
                      <a href="/revision" className="btn btn-xs btn-ghost" style={{ fontWeight: 700 }}>
                        Revise
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  No repeated mistakes detected across multiple tests. Great consistency!
                </div>
              )}
            </div>
          </div>

          {/* Full Subject Table with Trend */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 12 }}>
              <div className="card-title">📋 Subject Performance Summary</div>
            </div>
            {withData.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                No subject-wise mock test results logged yet.
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Mocks Taken</th>
                      <th>Avg Accuracy</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withData
                      .sort((a, b) => a.accuracy - b.accuracy)
                      .map((s) => (
                        <tr key={s.id || s._id}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td style={{ color: 'var(--text-2)' }}>{s.mockCount}</td>
                          <td style={{ fontWeight: 800, color: s.performance?.color || 'var(--text)' }}>
                            {s.accuracy}%
                          </td>
                          <td>
                            <span style={{ color: s.performance?.color || 'var(--text)', fontWeight: 700 }}>
                              {s.performance?.icon} {s.performance?.label}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
