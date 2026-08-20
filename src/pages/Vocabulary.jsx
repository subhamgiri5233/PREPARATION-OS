// src/pages/Vocabulary.jsx
// Daily Vocabulary Goal: 10 new words per day.
// Counter uses ONLY today's words (dateAdded === TODAY).
// Previous days' words remain in history, never counted toward today's goal.

import { useEffect, useState } from 'react';
import {
  Plus, Search, X, BookMarked, CheckCircle2, RefreshCcw,
  ChevronDown, ChevronUp, Trash2, Edit2, History, Calendar, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getAllVocab, addVocabWord, updateVocabWord, deleteVocabWord,
  getVocabByDate, getVocabDailyHistory
} from '../services/db';
import { wordBank } from '../data/seedData';
import { requireEditPermission, canEdit } from '../services/mutationGuard.js';

// TODAY as a stable constant — will be 'YYYY-MM-DD' in user's local timezone
const TODAY = format(new Date(), 'yyyy-MM-dd');
const DAILY_TARGET = 10;

export default function Vocabulary() {
  const [words, setWords] = useState([]);          // All words (for full list)
  const [todayWords, setTodayWords] = useState([]); // ONLY today's words
  const [dailyHistory, setDailyHistory] = useState([]); // per-day history
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'all' | 'history'
  const [showAdd, setShowAdd] = useState(false);
  const [showWordBank, setShowWordBank] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [expandedHistoryDate, setExpandedHistoryDate] = useState(null);
  const [newWord, setNewWord] = useState({
    word: '', meaning: '', bengaliMeaning: '', synonyms: '',
    antonyms: '', example: '', dateAdded: TODAY
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [all, today, history] = await Promise.all([
        getAllVocab(),
        getVocabByDate(TODAY),      // ONLY today's words — correct daily count
        getVocabDailyHistory(),     // per-day summary
      ]);
      setWords(all || []);
      setTodayWords(today || []);
      setDailyHistory(history || []);
    } catch (err) {
      console.error('[Vocabulary] Error loading vocab:', err);
    }
  };

  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!canEdit()) { requireEditPermission('add vocabulary word'); return; }
    if (!newWord.word || !newWord.meaning) return;
    const wordData = {
      ...newWord,
      bengaliMeaning: newWord.bengaliMeaning || '',
      synonyms: newWord.synonyms
        ? (Array.isArray(newWord.synonyms) ? newWord.synonyms : newWord.synonyms.split(',').map((s) => s.trim()).filter(Boolean))
        : [],
      antonyms: newWord.antonyms
        ? (Array.isArray(newWord.antonyms) ? newWord.antonyms : newWord.antonyms.split(',').map((s) => s.trim()).filter(Boolean))
        : [],
      revisionStatus: 'Learning',
      dateAdded: TODAY,   // Always today — NEVER changeable to keep daily count accurate
    };
    await addVocabWord(wordData);
    setNewWord({ word: '', meaning: '', bengaliMeaning: '', synonyms: '', antonyms: '', example: '', dateAdded: TODAY });
    setShowAdd(false);
    await loadData();
  };

  const handleAddFromBank = async (bankWord) => {
    if (!canEdit()) { requireEditPermission('add word from bank'); return; }
    const wordData = { ...bankWord, revisionStatus: 'Learning', dateAdded: TODAY };
    await addVocabWord(wordData);
    await loadData();
  };

  const handleDelete = async (id) => {
    if (!canEdit()) { requireEditPermission('delete vocabulary word'); return; }
    if (!window.confirm('Are you sure you want to delete this vocabulary word?')) return;
    try {
      await deleteVocabWord(id);
      await loadData();
    } catch (err) { alert('Failed to delete word: ' + err.message); }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!canEdit()) { requireEditPermission('edit vocabulary word'); return; }
    if (!editingWord) return;
    try {
      // NOTE: dateAdded is intentionally NOT sent — server blocks it from being changed.
      // This ensures editing never inflates today's or any day's count.
      await updateVocabWord(editingWord.id || editingWord._id, {
        word: editingWord.word,
        meaning: editingWord.meaning,
        bengaliMeaning: editingWord.bengaliMeaning || '',
        synonyms: typeof editingWord.synonyms === 'string'
          ? editingWord.synonyms.split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.synonyms,
        antonyms: typeof editingWord.antonyms === 'string'
          ? editingWord.antonyms.split(',').map((s) => s.trim()).filter(Boolean)
          : editingWord.antonyms,
        example: editingWord.example || '',
      });
      setEditingWord(null);
      await loadData();
    } catch (err) { alert('Failed to update word: ' + err.message); }
  };

  const handleToggleRevised = async (word) => {
    if (!canEdit()) { requireEditPermission('change revision status'); return; }
    const newStatus = word.revisionStatus === 'Revised' ? 'Learning' : 'Revised';
    await updateVocabWord(word.id || word._id, { revisionStatus: newStatus });
    await loadData();
  };

  // Display list depends on active tab
  const displayWords = activeTab === 'today' ? todayWords : words;
  const filteredWords = displayWords.filter((w) =>
    !search ||
    w.word?.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning?.toLowerCase().includes(search.toLowerCase()) ||
    w.bengaliMeaning?.toLowerCase().includes(search.toLowerCase())
  );

  const todayCount = todayWords.length;
  const goalMet = todayCount >= DAILY_TARGET;
  const progressPct = Math.min(100, (todayCount / DAILY_TARGET) * 100);
  const remaining = Math.max(0, DAILY_TARGET - todayCount);
  const totalWords = words.length;
  const revisedCount = words.filter((w) => w.revisionStatus === 'Revised').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Vocabulary & Bengali Meanings</h1>
          <p className="page-subtitle">Learn {DAILY_TARGET} new words every day — counter resets automatically at midnight</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowWordBank(true)}>
            <BookMarked size={14} /> Word Bank
          </button>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Word
          </button>
        </div>
      </div>

      {/* ── DAILY TARGET PROGRESS CARD ─────────────────────────────── */}
      <div style={{
        background: goalMet
          ? 'linear-gradient(135deg, #052e16, #14532d)'
          : 'linear-gradient(135deg, var(--primary-dark), #312e81)',
        borderRadius: 'var(--radius-xl)', padding: 20, marginBottom: 24,
        border: `1px solid ${goalMet ? 'rgba(34,197,94,0.4)' : 'var(--border-accent)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 12, color: goalMet ? '#4ade80' : 'var(--primary-light)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={13} />
              Today's Target — {format(new Date(), 'EEEE, MMM d')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{todayCount}</span>
              <span style={{ fontSize: 16, color: 'var(--text-2)', fontWeight: 400 }}>/ {DAILY_TARGET} words</span>
              {goalMet && (
                <span style={{
                  fontSize: 12, fontWeight: 700, color: '#4ade80',
                  background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)',
                  padding: '2px 8px', borderRadius: 999
                }}>
                  ✅ Daily goal completed{todayCount > DAILY_TARGET ? ` (+${todayCount - DAILY_TARGET} extra)` : ''}
                </span>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct}%`,
                background: goalMet
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : 'linear-gradient(90deg, var(--primary), var(--primary-light))',
                borderRadius: 4,
                transition: 'width 0.5s ease'
              }} />
            </div>
            {!goalMet && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>
                {remaining} word{remaining !== 1 ? 's' : ''} remaining to complete today's goal
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'center', flexShrink: 0 }}>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius)', padding: '10px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{totalWords}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Total Learned</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius)', padding: '10px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{revisedCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Revised</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { id: 'today', label: `Today (${todayCount})` },
          { id: 'all', label: `All Words (${totalWords})` },
          { id: 'history', label: 'Daily History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 14px', fontSize: 12, fontWeight: 600, border: 'none',
              background: 'none', cursor: 'pointer', borderBottom: '2px solid',
              borderBottomColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
              color: activeTab === tab.id ? 'var(--primary-light)' : 'var(--text-2)',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dailyHistory.length === 0 ? (
            <div className="card"><div className="empty-state">
              <div className="empty-icon">📖</div>
              <div className="empty-title">No vocabulary history yet</div>
              <div className="empty-desc">Start adding words daily to build your history</div>
            </div></div>
          ) : (
            dailyHistory.map((day) => {
              const isExpanded = expandedHistoryDate === day.date;
              const pct = Math.min(100, (day.count / DAILY_TARGET) * 100);
              const met = day.count >= DAILY_TARGET;
              return (
                <div key={day.date} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                  borderLeft: `3px solid ${met ? 'var(--success)' : 'var(--warning)'}`,
                }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }}
                    onClick={() => setExpandedHistoryDate(isExpanded ? null : day.date)}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>
                          {day.date === TODAY ? 'Today' : format(new Date(day.date + 'T12:00:00'), 'EEE, MMM d, yyyy')}
                        </span>
                        <span className={`badge ${met ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                          {day.count}/{DAILY_TARGET} {met ? '✅' : ''}
                        </span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, borderRadius: 2,
                          background: met ? 'var(--success)' : 'var(--warning)',
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronRight size={14} />}
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {day.words.map((w, i) => (
                          <div key={w._id || i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '6px 10px', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', fontSize: 12
                          }}>
                            <strong style={{ color: 'var(--primary-light)' }}>{i + 1}. {w.word}</strong>
                            <span style={{ color: 'var(--text-2)' }}>{w.bengaliMeaning || w.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── TODAY / ALL WORDS TABS ────────────────────────────────────── */}
      {activeTab !== 'history' && (
        <>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="form-input"
              placeholder={activeTab === 'today' ? "Search today's words..." : "Search all words or Bengali meanings..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>

          {filteredWords.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <div className="empty-title">
                  {search ? 'No words found' : activeTab === 'today' ? "No words added today yet" : 'No vocabulary yet'}
                </div>
                <div className="empty-desc">
                  {search ? 'Try a different search' :
                    activeTab === 'today'
                      ? `Add ${DAILY_TARGET} words today to reach your daily goal!`
                      : 'Start adding words or pick from the word bank'}
                </div>
                {!search && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                    <button className="btn btn-ghost" onClick={() => setShowWordBank(true)}><BookMarked size={14} /> Word Bank</button>
                    <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Word</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredWords.map((word) => (
                <WordCard
                  key={word.id || word._id}
                  word={word}
                  expanded={expanded === (word.id || word._id)}
                  onExpand={() => setExpanded(expanded === (word.id || word._id) ? null : (word.id || word._id))}
                  onRevise={() => handleToggleRevised(word)}
                  onEdit={() => setEditingWord({
                    ...word,
                    synonyms: Array.isArray(word.synonyms) ? word.synonyms.join(', ') : word.synonyms || '',
                    antonyms: Array.isArray(word.antonyms) ? word.antonyms.join(', ') : word.antonyms || '',
                  })}
                  onDelete={() => handleDelete(word.id || word._id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ADD WORD MODAL ────────────────────────────────────────────── */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add New Word — Today ({todayCount + 1}/{DAILY_TARGET})</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleAddWord} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Word *</label>
                  <input className="form-input" value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })} placeholder="e.g. Abate" required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Bengali Meaning (বাংলা অর্থ)</label>
                  <input className="form-input" value={newWord.bengaliMeaning} onChange={(e) => setNewWord({ ...newWord, bengaliMeaning: e.target.value })} placeholder="যেমন: হ্রাস করা" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">English Meaning *</label>
                <input className="form-input" value={newWord.meaning} onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })} placeholder="English meaning" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Synonyms (comma-separated)</label>
                  <input className="form-input" value={newWord.synonyms} onChange={(e) => setNewWord({ ...newWord, synonyms: e.target.value })} placeholder="e.g. diminish, subside" />
                </div>
                <div className="form-group">
                  <label className="form-label">Antonyms (comma-separated)</label>
                  <input className="form-input" value={newWord.antonyms} onChange={(e) => setNewWord({ ...newWord, antonyms: e.target.value })} placeholder="e.g. increase, grow" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Example Sentence</label>
                <textarea className="form-textarea" value={newWord.example} onChange={(e) => setNewWord({ ...newWord, example: e.target.value })} placeholder="Use the word in a sentence..." style={{ minHeight: 60 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Word</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT WORD MODAL ───────────────────────────────────────────── */}
      {editingWord && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditingWord(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Edit Vocabulary Word</h2>
              <button className="modal-close" onClick={() => setEditingWord(null)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Word *</label>
                  <input className="form-input" value={editingWord.word || ''} onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bengali Meaning (বাংলা অর্থ)</label>
                  <input className="form-input" value={editingWord.bengaliMeaning || ''} onChange={(e) => setEditingWord({ ...editingWord, bengaliMeaning: e.target.value })} placeholder="বাংলা অর্থ" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">English Meaning *</label>
                <input className="form-input" value={editingWord.meaning || ''} onChange={(e) => setEditingWord({ ...editingWord, meaning: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Synonyms</label>
                  <input className="form-input" value={editingWord.synonyms || ''} onChange={(e) => setEditingWord({ ...editingWord, synonyms: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Antonyms</label>
                  <input className="form-input" value={editingWord.antonyms || ''} onChange={(e) => setEditingWord({ ...editingWord, antonyms: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Example Sentence</label>
                <textarea className="form-textarea" value={editingWord.example || ''} onChange={(e) => setEditingWord({ ...editingWord, example: e.target.value })} style={{ minHeight: 60 }} />
              </div>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius)', padding: '8px 12px', fontSize: 11, color: 'var(--warning)' }}>
                ℹ️ Editing this word will NOT change the date it was added or affect today's word count.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingWord(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── WORD BANK MODAL ───────────────────────────────────────────── */}
      {showWordBank && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowWordBank(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">Word Bank</h2>
              <button className="modal-close" onClick={() => setShowWordBank(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>
              Click a word to add it to today's vocabulary list. Each word added counts toward today's {DAILY_TARGET}-word goal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {wordBank.map((w) => {
                const alreadyAdded = words.some((aw) => aw.word?.toLowerCase() === w.word?.toLowerCase());
                return (
                  <div key={w.word} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 'var(--radius)',
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{w.word}</span>
                        {w.bengaliMeaning && (
                          <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', fontSize: 11 }}>
                            বাংলা: {w.bengaliMeaning}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{w.meaning}</div>
                    </div>
                    {alreadyAdded ? (
                      <span className="badge badge-success" style={{ fontSize: 10 }}>Added</span>
                    ) : (
                      <button className="btn btn-sm btn-primary" onClick={() => handleAddFromBank(w)}>
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WordCard({ word, expanded, onExpand, onRevise, onEdit, onDelete }) {
  const bankMatch = wordBank.find((w) => w.word?.toLowerCase() === (word.word || '').toLowerCase());
  const displayBengali = word.bengaliMeaning || bankMatch?.bengaliMeaning;

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', transition: 'var(--transition)',
      borderLeft: word.revisionStatus === 'Revised' ? '3px solid var(--success)' : '3px solid var(--primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }} onClick={onExpand}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: word.revisionStatus === 'Revised' ? 'var(--success)' : 'var(--primary-light)' }}>
              {word.word}
            </span>
            {displayBengali && (
              <span style={{
                fontSize: 12, fontWeight: 700, color: '#10b981',
                background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 6,
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
                বাংলা: {displayBengali}
              </span>
            )}
            {word.revisionStatus === 'Revised' && <span className="badge badge-success">Revised</span>}
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{word.dateAdded || word.createdAt?.slice(0, 10)}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4 }}>{word.meaning}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); onRevise(); }}
            title={word.revisionStatus === 'Revised' ? 'Mark as Learning' : 'Mark as Revised'}
            style={{ color: word.revisionStatus === 'Revised' ? 'var(--warning)' : 'var(--success)', padding: '6px' }}>
            {word.revisionStatus === 'Revised' ? <RefreshCcw size={14} /> : <CheckCircle2 size={14} />}
          </button>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Edit Word" style={{ padding: '6px' }}>
            <Edit2 size={13} />
          </button>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Delete Word" style={{ color: 'var(--danger)', padding: '6px' }}>
            <Trash2 size={13} />
          </button>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {word.synonyms?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Synonyms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(Array.isArray(word.synonyms) ? word.synonyms : [word.synonyms]).map((s) => (
                    <span key={s} className="chip" style={{ fontSize: 11 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {word.antonyms?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Antonyms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(Array.isArray(word.antonyms) ? word.antonyms : [word.antonyms]).map((a) => (
                    <span key={a} className="chip" style={{ fontSize: 11 }}>{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {(word.example || word.exampleSentence) && (
            <div style={{ marginTop: 10, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Example</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic' }}>"{word.example || word.exampleSentence}"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
