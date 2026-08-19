// src/pages/Vocabulary.jsx
// Includes prominent Bengali Meaning display, Edit Word modal, and Delete confirmation

import { useEffect, useState } from 'react';
import { Plus, Search, X, BookMarked, CheckCircle2, RefreshCcw, ChevronDown, ChevronUp, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { getAllVocab, addVocabWord, updateVocabWord, deleteVocabWord, getVocabByDate } from '../services/db';
import { wordBank } from '../data/seedData';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function Vocabulary() {
  const [words, setWords] = useState([]);
  const [todayWords, setTodayWords] = useState([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showWordBank, setShowWordBank] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [newWord, setNewWord] = useState({
    word: '', meaning: '', bengaliMeaning: '', synonyms: '', antonyms: '', example: '', dateAdded: TODAY
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [all, today] = await Promise.all([getAllVocab(), getVocabByDate(TODAY)]);
      setWords(all || []);
      setTodayWords(today || []);
    } catch (err) {
      console.error('[Vocabulary] Error loading vocab:', err);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!newWord.word || !newWord.meaning) return;
    const wordData = {
      ...newWord,
      bengaliMeaning: newWord.bengaliMeaning || '',
      synonyms: newWord.synonyms ? (Array.isArray(newWord.synonyms) ? newWord.synonyms : newWord.synonyms.split(',').map((s) => s.trim())) : [],
      antonyms: newWord.antonyms ? (Array.isArray(newWord.antonyms) ? newWord.antonyms : newWord.antonyms.split(',').map((s) => s.trim())) : [],
      revisionStatus: 'Learning',
      dateAdded: TODAY,
    };
    await addVocabWord(wordData);
    setNewWord({ word: '', meaning: '', bengaliMeaning: '', synonyms: '', antonyms: '', example: '', dateAdded: TODAY });
    setShowAdd(false);
    await loadData();
  };

  const handleAddFromBank = async (bankWord) => {
    const wordData = {
      ...bankWord,
      revisionStatus: 'Learning',
      dateAdded: TODAY,
    };
    await addVocabWord(wordData);
    await loadData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vocabulary word?')) return;
    try {
      await deleteVocabWord(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete word: ' + err.message);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingWord) return;
    try {
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
    } catch (err) {
      alert('Failed to update word: ' + err.message);
    }
  };

  const handleToggleRevised = async (word) => {
    const newStatus = word.revisionStatus === 'Revised' ? 'Learning' : 'Revised';
    await updateVocabWord(word.id || word._id, { revisionStatus: newStatus });
    await loadData();
  };

  const filteredWords = words.filter((w) =>
    !search ||
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    w.meaning?.toLowerCase().includes(search.toLowerCase()) ||
    w.bengaliMeaning?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords = words.length;
  const todayCount = todayWords.length;
  const revisedCount = words.filter((w) => w.revisionStatus === 'Revised').length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Vocabulary & Bengali Meanings</h1>
          <p className="page-subtitle">Learn 10 new words every day with English and Bengali definitions</p>
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

      {/* Daily Target Progress */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark), #312e81)',
        borderRadius: 'var(--radius-xl)', padding: 20, marginBottom: 24,
        border: '1px solid var(--border-accent)',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--primary-light)', fontWeight: 600, marginBottom: 4 }}>Today's Target</div>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            {todayCount} <span style={{ fontSize: 16, fontWeight: 400, color: 'var(--text-2)' }}>/ 10 words</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-fill" style={{ width: `${Math.min(100, (todayCount / 10) * 100)}%` }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, textAlign: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '10px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{totalWords}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Total Learned</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius)', padding: '10px 16px' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{revisedCount}</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Revised</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
        <input
          className="form-input"
          placeholder="Search words or Bengali meanings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 34 }}
        />
      </div>

      {/* Word List */}
      {filteredWords.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <div className="empty-title">{search ? 'No words found' : 'No vocabulary yet'}</div>
            <div className="empty-desc">{search ? 'Try a different search' : 'Start adding words or pick from the word bank'}</div>
            {!search && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
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

      {/* Add Word Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAdd(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add New Word</h2>
              <button className="modal-close" onClick={() => setShowAdd(false)}><X size={14} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Word *</label>
                  <input className="form-input" value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })} placeholder="e.g. Abate" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Bengali Meaning (বাংলা অর্থ) *</label>
                  <input className="form-input" value={newWord.bengaliMeaning} onChange={(e) => setNewWord({ ...newWord, bengaliMeaning: e.target.value })} placeholder="যেমন: হ্রাস করা" required />
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

      {/* Edit Word Modal */}
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
                  <label className="form-label">Synonyms (comma-separated)</label>
                  <input className="form-input" value={editingWord.synonyms || ''} onChange={(e) => setEditingWord({ ...editingWord, synonyms: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Antonyms (comma-separated)</label>
                  <input className="form-input" value={editingWord.antonyms || ''} onChange={(e) => setEditingWord({ ...editingWord, antonyms: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Example Sentence</label>
                <textarea className="form-textarea" value={editingWord.example || ''} onChange={(e) => setEditingWord({ ...editingWord, example: e.target.value })} style={{ minHeight: 60 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditingWord(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Word Bank Modal */}
      {showWordBank && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowWordBank(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">Word Bank</h2>
              <button className="modal-close" onClick={() => setShowWordBank(false)}><X size={14} /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>Click a word to add it to your vocabulary list with Bengali meaning</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {wordBank.map((w) => {
                const alreadyAdded = words.some((aw) => aw.word.toLowerCase() === w.word.toLowerCase());
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
                          <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-light)', fontSize: 11 }}>
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
  // If word from MongoDB has empty bengaliMeaning, fallback to wordBank lookup
  const bankMatch = wordBank.find((w) => w.word.toLowerCase() === (word.word || '').toLowerCase());
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
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#10b981',
                  background: 'rgba(16, 185, 129, 0.12)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                বাংলা: {displayBengali}
              </span>
            )}
            {word.revisionStatus === 'Revised' && <span className="badge badge-success">Revised</span>}
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{word.dateAdded || word.createdAt?.slice(0, 10)}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 4 }}>{word.meaning}</div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            className="btn btn-sm btn-ghost btn-icon"
            onClick={(e) => { e.stopPropagation(); onRevise(); }}
            title={word.revisionStatus === 'Revised' ? 'Mark as Learning' : 'Mark as Revised'}
            style={{ color: word.revisionStatus === 'Revised' ? 'var(--warning)' : 'var(--success)', padding: '6px' }}
          >
            {word.revisionStatus === 'Revised' ? <RefreshCcw size={14} /> : <CheckCircle2 size={14} />}
          </button>
          <button
            className="btn btn-sm btn-ghost btn-icon"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            title="Edit Word"
            style={{ padding: '6px' }}
          >
            <Edit2 size={13} />
          </button>
          <button
            className="btn btn-sm btn-ghost btn-icon"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete Word"
            style={{ color: 'var(--danger)', padding: '6px' }}
          >
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
          {word.example && (
            <div style={{ marginTop: 10, background: 'var(--surface)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Example</div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', fontStyle: 'italic' }}>"{word.example}"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
