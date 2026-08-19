import React, { useEffect, useState } from 'react';
import { format, parseISO, isToday, isPast } from 'date-fns';
import { RotateCcw, CheckCircle2, Clock, AlertTriangle, X, Target } from 'lucide-react';
import { getAllSubjects } from '../services/db';
import { getAllPendingRevisionsEnriched, completeRevision, skipRevision } from '../services/revisionService';

export default function Revision() {
  const [revisions, setRevisions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('due');
  
  const [sessionModal, setSessionModal] = useState(null);
  const [memoryRating, setMemoryRating] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [revs, subs] = await Promise.all([
      getAllPendingRevisionsEnriched(),
      getAllSubjects()
    ]);
    // Sort all by priority score descending
    revs.sort((a, b) => b.priorityData.score - a.priorityData.score);
    setRevisions(revs);
    setSubjects(subs);
  };

  const getSubjectName = (subjectId) => subjects.find(s => s.id === subjectId)?.name || 'Unknown Subject';

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const overdueRevisions = revisions.filter(r => r.dueDate < todayStr);
  const todayRevisions = revisions.filter(r => r.dueDate === todayStr);
  const upcomingRevisions = revisions.filter(r => r.dueDate > todayStr);

  const dueNow = [...overdueRevisions, ...todayRevisions].sort((a, b) => b.priorityData.score - a.priorityData.score);
  
  const displayList = activeTab === 'due' ? dueNow : upcomingRevisions;
  const topRevision = dueNow.length > 0 ? dueNow[0] : null;

  const handleStartSession = (rev) => {
    setSessionModal(rev);
    setMemoryRating(0);
    setNotes('');
  };

  const handleComplete = async () => {
    if (memoryRating === 0) return alert("Please rate your memory first.");
    await completeRevision(sessionModal.id, memoryRating, notes);
    setSessionModal(null);
    loadData();
  };

  const handleSkip = async (id) => {
    await skipRevision(id);
    loadData();
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Revision Engine</h1>
          <p className="page-subtitle">Adaptive Spaced Repetition</p>
        </div>
      </div>

      {/* Revision Status Widget */}
      <div className="grid-4 mb-24">
        <div className="stat-card" style={{ borderLeft: '4px solid var(--danger)' }}>
          <div className="stat-icon">⚠️</div>
          <div className="stat-value">{overdueRevisions.length}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div className="stat-icon">📅</div>
          <div className="stat-value">{todayRevisions.length}</div>
          <div className="stat-label">Due Today</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--info)' }}>
          <div className="stat-icon">📆</div>
          <div className="stat-value">{upcomingRevisions.length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-icon">🔴</div>
          <div className="stat-value">{dueNow.filter(r => r.priorityData.isCritical).length}</div>
          <div className="stat-label">Critical Revisions</div>
        </div>
      </div>

      {/* What Should I Revise Now? */}
      {topRevision && activeTab === 'due' && (
        <div className="card mb-24" style={{ border: '2px solid var(--primary)', background: 'linear-gradient(to right, var(--bg), rgba(99, 102, 241, 0.05))' }}>
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="var(--primary)" /> Top Revision Priority
            </h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>
                {topRevision.topicName}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-2)', marginTop: '4px' }}>
                {getSubjectName(topRevision.topic?.subjectId)}
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge" style={{ background: topRevision.priorityData.isCritical ? 'var(--danger-light)' : 'var(--bg-2)', color: topRevision.priorityData.isCritical ? 'var(--danger)' : 'var(--text)' }}>
                  {topRevision.priorityData.status}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                  Reason: {topRevision.priorityData.reason}
                </span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => handleStartSession(topRevision)}>
              START REVISION
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs mb-24">
        <button className={`tab ${activeTab === 'due' ? 'active' : ''}`} onClick={() => setActiveTab('due')}>
          Due Now ({dueNow.length})
        </button>
        <button className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>
          Upcoming ({upcomingRevisions.length})
        </button>
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">All caught up!</div>
            <div className="empty-desc">No revisions scheduled for this view.</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displayList.map(rev => (
            <div key={rev.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>{rev.topicName}</div>
                  <span className="badge" style={{ fontSize: '0.75rem', background: 'var(--bg-2)' }}>Rev #{rev.revisionNumber}</span>
                  {rev.priorityData.isCritical && <span className="badge danger">Critical</span>}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-2)', marginTop: '4px' }}>
                  {getSubjectName(rev.topic?.subjectId)} &bull; Due: {rev.dueDate} {rev.dueDate < todayStr && <span style={{color: 'var(--danger)'}}>(Overdue)</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginTop: '8px' }}>
                  Status: {rev.priorityData.status} | Reason: {rev.priorityData.reason}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-icon" onClick={() => handleSkip(rev.id)} title="Skip/Delay to tomorrow">
                  <RotateCcw size={18} />
                </button>
                <button className="btn btn-primary" onClick={() => handleStartSession(rev)}>
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revision Session Modal */}
      {sessionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Revision Session</h2>
              <button className="btn-icon" onClick={() => setSessionModal(null)}><X size={20} /></button>
            </div>
            
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.5rem', margin: '0 0 8px 0', color: 'var(--text)' }}>{sessionModal.topicName}</h3>
                <p style={{ color: 'var(--text-2)', margin: 0 }}>{getSubjectName(sessionModal.topic?.subjectId)}</p>
                <div style={{ display: 'inline-block', marginTop: '12px', padding: '4px 12px', background: 'var(--bg-2)', borderRadius: '16px', fontSize: '0.85rem' }}>
                  Revision #{sessionModal.revisionNumber}
                </div>
              </div>

              {sessionModal.notes && (
                <div className="mb-24" style={{ padding: '16px', background: 'var(--warning-light)', borderRadius: '8px', borderLeft: '4px solid var(--warning)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--warning)' }}>Previous Notes</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text)' }}>{sessionModal.notes}</p>
                </div>
              )}

              <div className="mb-24">
                <h4 style={{ margin: '0 0 16px 0', color: 'var(--text)' }}>How well did you remember this topic?</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                  {[
                    { val: 1, label: 'Forgot completely', color: '#ef4444' },
                    { val: 2, label: 'Difficulty', color: '#f97316' },
                    { val: 3, label: 'Reasonable', color: '#eab308' },
                    { val: 4, label: 'Remembered well', color: '#84cc16' },
                    { val: 5, label: 'Mastered', color: '#22c55e' }
                  ].map(rating => (
                    <button 
                      key={rating.val}
                      onClick={() => setMemoryRating(rating.val)}
                      style={{ 
                        padding: '12px 4px', 
                        borderRadius: '8px',
                        border: memoryRating === rating.val ? `2px solid ${rating.color}` : '1px solid var(--border)',
                        background: memoryRating === rating.val ? `${rating.color}15` : 'var(--bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: rating.color }}>{rating.val}</div>
                      <div style={{ fontSize: '0.7rem', textAlign: 'center', color: 'var(--text-2)' }}>{rating.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group mb-24">
                <label>Add Notes / Mistakes (Optional)</label>
                <textarea 
                  className="input" 
                  rows="3" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Forgot the 3NF definition again..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn" onClick={() => setSessionModal(null)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleComplete} disabled={memoryRating === 0}>
                  Complete Revision
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
