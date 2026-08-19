// src/components/MockDetailModal.jsx
import React, { useEffect, useState } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { calculateAccuracy, classifySubjectPerformance } from '../services/analyticsService';
import { getErrorLogsByMock, addRevisionTask } from '../services/db';
import { generateLossSummary } from '../services/errorAnalysisEngine';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CHART_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6', '#64748b'];

export default function MockDetailModal({ mock, results, subjects, topics, onClose }) {
  const [errorLogs, setErrorLogs] = useState([]);
  const [lossSummary, setLossSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const accuracy = calculateAccuracy(mock.correct, mock.attempted);
  const scorePercent = mock.maxScore ? Math.round((mock.score / mock.maxScore) * 100) : 0;
  
  useEffect(() => {
    loadErrors();
  }, [mock.id]);

  const loadErrors = async () => {
    setLoading(true);
    const logs = await getErrorLogsByMock(mock.id);
    setErrorLogs(logs);
    
    const summary = generateLossSummary(mock.id, logs, mock.negativeMarks, mock.positiveMarks);
    setLossSummary(summary);
    setLoading(false);
  };

  const handleCreateRevision = async (err) => {
    const topic = topics.find(t => t.id === err.topicId);
    if (!topic) return;
    
    await addRevisionTask({
      topicId: topic.id,
      revisionNumber: 1,
      dueDate: new Date().toISOString().slice(0, 10),
      status: 'Pending',
      type: 'revision'
    });
    alert(`Revision created for ${topic.name}`);
  };

  const errorTypeData = lossSummary ? lossSummary.map(ls => ({ name: ls.type, value: ls.marksLost })) : [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 800, width: '90%' }}>
        <div className="modal-header">
          <h2 className="modal-title">{mock.examName} — Mock #{mock.mockNumber}</h2>
          <button className="modal-close" onClick={onClose}><X size={14} /></button>
        </div>
        
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Top Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 24, textAlign: 'center' }}>
            <div style={{ background: 'var(--success-glass)', border: '1px solid var(--success)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{mock.correct}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Correct</div>
            </div>
            <div style={{ background: 'var(--danger-glass)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>{mock.wrong}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Wrong</div>
            </div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-2)' }}>{mock.unattempted}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Unattempted</div>
            </div>
            <div style={{ background: 'var(--info-glass)', border: '1px solid var(--info)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--info)' }}>{accuracy}%</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Accuracy</div>
            </div>
            <div style={{ background: 'var(--primary-glass)', border: '1px solid var(--primary)', borderRadius: 'var(--radius)', padding: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary-light)' }}>{mock.score}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Score</div>
            </div>
          </div>

          <div className="grid-2" style={{ gap: 24 }}>
            {/* Subject Performance */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Subject Performance</div>
              {results.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {results.map((r) => {
                    const sub = subjects.find((s) => s.id === r.subjectId);
                    const acc = calculateAccuracy(r.correct, r.correct + r.wrong);
                    const perf = classifySubjectPerformance(acc);
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 13, flex: 1, fontWeight: 500 }}>{r.name || sub?.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--success)' }}>✓{r.correct}</span>
                        <span style={{ fontSize: 12, color: 'var(--danger)' }}>✗{r.wrong}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: perf.color }}>{acc}% {perf.icon}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>No subject results entered.</div>
              )}
            </div>

            {/* Why Did I Lose Marks? */}
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Why Did I Lose Marks?</div>
              {!loading && lossSummary && lossSummary.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {lossSummary.map((ls, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                        <span style={{ color: 'var(--text)' }}>{ls.type}</span>
                        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>-{ls.marksLost} marks</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={errorTypeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                          {errorTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--surface-2)', border: 'none', borderRadius: 8, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                  {!loading && "Detailed question-level error data is not available for this mock."}
                </div>
              )}
            </div>
          </div>

          {/* Question Error Log */}
          {!loading && errorLogs.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>Question Error Log</div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Topic</th>
                      <th>Error Type</th>
                      <th>Notes</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorLogs.map(err => {
                      const topic = topics.find(t => t.id === err.topicId);
                      return (
                        <tr key={err.id}>
                          <td style={{ fontSize: 12, fontWeight: 600 }}>{topic?.name || 'Unknown Topic'}</td>
                          <td style={{ fontSize: 12, color: 'var(--danger)' }}>{err.errorType}</td>
                          <td style={{ fontSize: 12, color: 'var(--text-2)' }}>{err.notes || '—'}</td>
                          <td>
                            <button className="btn btn-sm btn-ghost" onClick={() => handleCreateRevision(err)} title="Create Revision Task">
                              <ExternalLink size={12} style={{ marginRight: 4 }} /> Revise
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
