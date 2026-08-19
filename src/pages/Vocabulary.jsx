// src/pages/Vocabulary.jsx
import { useEffect, useState } from 'react';
import { Plus, Search, X, BookMarked, CheckCircle2, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expanded, setExpanded] = useState(null);
  const [newWord, setNewWord] = useState({ word: '', meaning: '', bengaliMeaning: '', synonyms: '', antonyms: '', example: '', dateAdded: TODAY });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [all, today] = await Promise.all([getAllVocab(), getVocabByDate(TODAY)]);
    setWords(all);
    setTodayWords(today);
  };

  const handleSave = async () => {
    if (!newWord.word || !newWord.meaning) return;
    const wordData = {
      ...newWord,
      synonyms: newWord.synonyms ? newWord.synonyms.split(',').map((s) => s.trim()) : [],
      antonyms: newWord.antonyms ? newWord.antonyms.split(',').map((s) => s.trim()) : [],
      revisionStatus: 'Learning',
      dateAdded: TODAY,
    };
    await addVocabWord(wordData);
    setNewWord({ word: '', meaning: '', bengaliMeaning: '', synonyms: '', antonyms: '', example: '', dateAdded: TODAY });
    setShowAdd(false);
    loadData();
  };

  const handleAddFromBank = async (bankWord) => {
    const wordData = {
      ...bankWord,
      revisionStatus: 'Learning',
      dateAdded: TODAY,
    };
    await addVocabWord(wordData);
    loadData();
  };

  const handleDelete = async (id) => {
    await deleteVocabWord(id);
    loadData();
  };

  const handleToggleRevised = async (word) => {
    const newStatus = word.revisionStatus === 'Revised' ? 'Learning' : 'Revised';
    await updateVocabWord(word.id, { revisionStatus: newStatus });
    loadData();
  };

  const filteredWords = words.filter((w) =>
    !search || w.word.toLowerCase().includes(search.toLowerCase()) || w.meaning?.toLowerCase().includes(search.toLowerCase())
  );

  const totalWords = words.length;
  const todayCount = todayWords.length;
  const revisedCount = words.filter((w) => w.revisionStatus === 'Revised').length;
  const streakDays = 1; // Simplified — would calculate from daily records

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Vocabulary</h1>
          <p className="page-subtitle">Learn 10 new words every day — build your vocabulary streak</p>
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
          placeholder="Search words..."
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
              key={word.id}
              word={word}
              expanded={expanded === word.id}
              onExpand={() => setExpanded(expanded === word.id ? null : word.id)}
              onRevise={() => handleToggleRevised(word)}
              onDelete={() => handleDelete(word.id)}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Word *</label>
                  <input className="form-input" value={newWord.word} onChange={(e) => setNewWord({ ...newWord, word: e.target.value })} placeholder="e.g. Abate" />
                </div>
                <div className="form-group">
                  <label className="form-label">Bengali Meaning</label>
                  <input className="form-input" value={newWord.bengaliMeaning} onChange={(e) => setNewWord({ ...newWord, bengaliMeaning: e.target.value })} placeholder="বাংলা অর্থ" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Meaning *</label>
                <input className="form-input" value={newWord.meaning} onChange={(e) => setNewWord({ ...newWord, meaning: e.target.value })} placeholder="English meaning" />
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
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>Save Word</button>
              </div>
            </div>
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
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 14 }}>Click a word to add it to your vocabulary list</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
              {wordBank.map((w) => {
                const alreadyAdded = words.some((aw) => aw.word.toLowerCase() === w.word.toLowerCase());
                return (
                  <div key={w.word} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 'var(--radius)',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    opacity: alreadyAdded ? 0.5 : 1,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>{w.word}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{w.meaning}</div>
                    </div>
                    {alreadyAdded ? (
                      <span className="badge badge-success">Added</span>
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

function WordCard({ word, expanded, onExpand, onRevise, onDelete }) {
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      overflow: 'hidden', transition: 'var(--transition)',
      borderLeft: word.revisionStatus === 'Revised' ? '3px solid var(--success)' : '3px solid var(--primary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }} onClick={onExpand}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: word.revisionStatus === 'Revised' ? 'var(--success)' : 'var(--primary-light)' }}>
              {word.word}
            </span>
            {word.revisionStatus === 'Revised' && <span className="badge badge-success">Revised</span>}
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{word.dateAdded}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }} className="truncate">{word.meaning}</div>
          {word.bengaliMeaning && <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{word.bengaliMeaning}</div>}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onRevise(); }}
            style={{ color: word.revisionStatus === 'Revised' ? 'var(--warning)' : 'var(--success)' }}>
            {word.revisionStatus === 'Revised' ? <RefreshCcw size={12} /> : <CheckCircle2 size={12} />}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ color: 'var(--danger)' }}>
            <X size={12} />
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
                  {(word.synonyms || []).map((s) => <span key={s} className="chip" style={{ fontSize: 11 }}>{s}</span>)}
                </div>
              </div>
            )}
            {word.antonyms?.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Antonyms</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(word.antonyms || []).map((a) => <span key={a} className="chip" style={{ fontSize: 11 }}>{a}</span>)}
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
