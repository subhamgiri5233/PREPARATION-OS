// src/pages/Vocabulary.jsx
// English -> Bengali Mini Dictionary & Daily Vocabulary Learning System
// Supports full English word lookup, Bengali translations, audio pronunciation,
// MongoDB caching, daily 10-word target, learning status, favorites, and history.

import { useEffect, useState, useRef } from 'react';
import {
  Search, X, Volume2, Plus, Star, CheckCircle2, Bookmark,
  Calendar, History, Edit2, Trash2, ChevronDown, ChevronUp,
  Sparkles, BookOpen, AlertCircle, ArrowRight, RotateCcw,
  GraduationCap, Check, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getAllVocab, addVocab, updateVocab, deleteVocab,
  getVocabByDate, getVocabDailyHistory, lookupDictionary,
  getRecentSearches, toggleVocabFavorite, markVocabLearned
} from '../services/db';
import { requireEditPermission, canEdit } from '../services/mutationGuard.js';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const DAILY_TARGET = 10;
const BENGALI_FONT = "'Noto Sans Bengali', 'Hind Siliguri', 'Kalpurush', 'Segoe UI', sans-serif";

export default function Vocabulary() {
  // ─── Dictionary Search State ───────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [dictResult, setDictResult] = useState(null);
  const [dictLoading, setDictLoading] = useState(false);
  const [dictError, setDictError] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // ─── My Vocabulary State ───────────────────────────────────────────────────
  const [words, setWords] = useState([]);
  const [todayWords, setTodayWords] = useState([]);
  const [dailyHistory, setDailyHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'all' | 'history'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'favorites' | 'Learning' | 'Learned'
  const [listSearch, setListSearch] = useState('');
  const [expandedWordId, setExpandedWordId] = useState(null);
  const [expandedHistoryDate, setExpandedHistoryDate] = useState(null);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWord, setEditingWord] = useState(null);
  const [formData, setFormData] = useState({
    word: '', meaning: '', bengaliMeaning: '', partOfSpeech: 'Noun',
    example: '', bengaliExample: '', synonyms: '', antonyms: '', pronunciation: ''
  });
  const [formError, setFormError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const audioRef = useRef(null);

  useEffect(() => {
    loadData();
    loadHistory();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = async () => {
    try {
      const [all, today, history] = await Promise.all([
        getAllVocab(),
        getVocabByDate(TODAY),
        getVocabDailyHistory(),
      ]);
      setWords(all || []);
      setTodayWords(today || []);
      setDailyHistory(history || []);
    } catch (err) {
      console.error('[Vocabulary] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const hist = await getRecentSearches();
      if (Array.isArray(hist) && hist.length > 0) {
        setRecentSearches(hist.map((h) => h.word || h.normalizedWord).slice(0, 10));
      } else {
        setRecentSearches(['benevolent', 'abate', 'candid', 'resilient', 'meticulous', 'ubiquitous']);
      }
    } catch (_) {
      setRecentSearches(['benevolent', 'abate', 'candid', 'resilient', 'meticulous']);
    }
  };

  // ─── Dictionary Lookup Handler ───────────────────────────────────────────────
  const handleSearchDictionary = async (wordToSearch) => {
    const query = (wordToSearch || searchQuery).trim();
    if (!query) return;

    setDictLoading(true);
    setDictError('');
    setDictResult(null);

    try {
      const result = await lookupDictionary(query);
      setDictResult(result);
      // Update recent searches
      setRecentSearches((prev) => [query, ...prev.filter((w) => w.toLowerCase() !== query.toLowerCase())].slice(0, 10));
    } catch (err) {
      if (err.status === 404 || err.message?.includes('not found') || err.message?.includes('404')) {
        setDictError(`Word "${query}" not found. Please check the spelling and try again.`);
      } else {
        setDictError('Dictionary service is temporarily unavailable. Please try again.');
      }
    } finally {
      setDictLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setDictResult(null);
    setDictError('');
  };

  // ─── Pronunciation Audio Player ─────────────────────────────────────────────
  const handlePlayPronunciation = (audioUrl, wordText) => {
    if (audioUrl) {
      try {
        const sound = new Audio(audioUrl.startsWith('//') ? 'https:' + audioUrl : audioUrl);
        setIsPlayingAudio(true);
        sound.play().catch(() => playSpeechFallback(wordText));
        sound.onended = () => setIsPlayingAudio(false);
        sound.onerror = () => {
          setIsPlayingAudio(false);
          playSpeechFallback(wordText);
        };
      } catch (_) {
        playSpeechFallback(wordText);
      }
    } else {
      playSpeechFallback(wordText);
    }
  };

  const playSpeechFallback = (text) => {
    if ('speechSynthesis' in window && text) {
      setIsPlayingAudio(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  // ─── Add Word to My Vocabulary ──────────────────────────────────────────────
  const handleAddDictionaryWord = async (dictItem) => {
    if (!canEdit()) {
      requireEditPermission('add word to vocabulary');
      return;
    }
    if (!dictItem) return;

    // Check if already in words
    const norm = dictItem.normalizedWord || dictItem.word.toLowerCase();
    const existing = words.find((w) => (w.normalizedWord || w.word.toLowerCase()) === norm);

    const firstMeaning = dictItem.meanings?.[0] || {};
    const firstDef = firstMeaning.definitions?.[0] || {};

    const wordData = {
      word: dictItem.word,
      normalizedWord: norm,
      meaning: firstDef.definition || dictItem.primaryBengali || '',
      bengaliMeaning: dictItem.primaryBengali || (dictItem.bengaliMeanings || []).join(', ') || '',
      partOfSpeech: firstMeaning.partOfSpeech || 'Noun',
      pronunciation: dictItem.phonetic || '',
      audio: dictItem.audio || '',
      example: firstDef.example || '',
      bengaliExample: firstDef.bengaliExample || '',
      meanings: dictItem.meanings || [],
      synonyms: dictItem.synonyms || [],
      antonyms: dictItem.antonyms || [],
      revisionStatus: 'Learning',
      dateAdded: TODAY,
      source: 'dictionary'
    };

    try {
      await addVocab(wordData);
      showToast(`✓ "${dictItem.word}" saved to My Vocabulary!`);
      await loadData();
    } catch (err) {
      showToast('Failed to save word: ' + err.message);
    }
  };

  // ─── Toggle Favorite ────────────────────────────────────────────────────────
  const handleToggleFavorite = async (id) => {
    if (!canEdit()) { requireEditPermission('favorite word'); return; }
    try {
      await toggleVocabFavorite(id);
      await loadData();
    } catch (err) {
      showToast('Error updating favorite: ' + err.message);
    }
  };

  // ─── Mark as Learned / Study Word ───────────────────────────────────────────
  const handleToggleLearned = async (word) => {
    if (!canEdit()) { requireEditPermission('mark word as learned'); return; }
    const id = word._id || word.id;
    const newStatus = word.revisionStatus === 'Learned' ? 'Learning' : 'Learned';
    try {
      await markVocabLearned(id, newStatus, TODAY);
      showToast(newStatus === 'Learned' ? `🎉 "${word.word}" marked as Learned!` : `"${word.word}" set to Learning`);
      await loadData();
    } catch (err) {
      showToast('Error updating status: ' + err.message);
    }
  };

  // ─── Delete Word ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!canEdit()) { requireEditPermission('delete vocabulary word'); return; }
    if (!window.confirm('Are you sure you want to delete this word from your vocabulary?')) return;
    try {
      await deleteVocab(id);
      showToast('Word removed from vocabulary.');
      await loadData();
    } catch (err) {
      showToast('Error deleting: ' + err.message);
    }
  };

  // ─── Manual Form Add / Edit ─────────────────────────────────────────────────
  const handleOpenAddModal = () => {
    if (!canEdit()) { requireEditPermission('add vocabulary word'); return; }
    setEditingWord(null);
    setFormData({
      word: '', meaning: '', bengaliMeaning: '', partOfSpeech: 'Noun',
      example: '', bengaliExample: '', synonyms: '', antonyms: '', pronunciation: ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (word) => {
    if (!canEdit()) { requireEditPermission('edit vocabulary word'); return; }
    setEditingWord(word);
    setFormData({
      word: word.word || '',
      meaning: word.meaning || '',
      bengaliMeaning: word.bengaliMeaning || '',
      partOfSpeech: word.partOfSpeech || 'Noun',
      example: word.example || '',
      bengaliExample: word.bengaliExample || '',
      synonyms: Array.isArray(word.synonyms) ? word.synonyms.join(', ') : (word.synonyms || ''),
      antonyms: Array.isArray(word.antonyms) ? word.antonyms.join(', ') : (word.antonyms || ''),
      pronunciation: word.pronunciation || ''
    });
    setFormError('');
    setShowAddModal(true);
  };

  const handleAddWord = async (e) => {
    e.preventDefault();
    if (!canEdit()) { requireEditPermission('save vocabulary word'); return; }
    if (!formData.word.trim() || (!formData.meaning.trim() && !formData.bengaliMeaning.trim())) {
      setFormError('Word and at least one meaning (English or Bengali) are required.');
      return;
    }

    const payload = {
      ...formData,
      synonyms: typeof formData.synonyms === 'string'
        ? formData.synonyms.split(',').map((s) => s.trim()).filter(Boolean)
        : formData.synonyms,
      antonyms: typeof formData.antonyms === 'string'
        ? formData.antonyms.split(',').map((s) => s.trim()).filter(Boolean)
        : formData.antonyms,
    };

    try {
      if (editingWord) {
        await updateVocab(editingWord._id || editingWord.id, payload);
        showToast(`✓ "${formData.word}" updated!`);
      } else {
        payload.dateAdded = TODAY;
        payload.revisionStatus = 'Learning';
        await addVocab(payload);
        showToast(`✓ "${formData.word}" added to My Vocabulary!`);
      }
      setShowAddModal(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save');
    }
  };

  // ─── Filtered Words ─────────────────────────────────────────────────────────
  const isWordSaved = (wordName) => {
    if (!wordName) return false;
    const norm = wordName.trim().toLowerCase();
    return words.some((w) => (w.normalizedWord || w.word.toLowerCase()) === norm);
  };

  const displayedWords = (activeTab === 'today' ? todayWords : words).filter((w) => {
    if (statusFilter === 'favorites' && !w.favorite) return false;
    if (statusFilter === 'Learned' && w.revisionStatus !== 'Learned') return false;
    if (statusFilter === 'Learning' && w.revisionStatus === 'Learned') return false;

    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      const matchWord = w.word?.toLowerCase().includes(q);
      const matchMeaning = w.meaning?.toLowerCase().includes(q);
      const matchBengali = w.bengaliMeaning?.toLowerCase().includes(q);
      if (!matchWord && !matchMeaning && !matchBengali) return false;
    }
    return true;
  });

  const todayCount = todayWords.length;
  const progressPercent = Math.min(100, Math.round((todayCount / DAILY_TARGET) * 100));

  return (
    <div>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: 'var(--success)', color: '#fff',
          padding: '12px 20px', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-lg)', fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle2 size={18} /> {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">ইংরেজি ➔ বাংলা অভিধান ও শব্দকোষ (Vocabulary)</h1>
          <p className="page-subtitle">প্রতিদিন ১০টি নতুন শব্দ শিক্ষা, বাংলা অর্থ, উচ্চারণ ও অনুশীলন</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={16} /> + নিজে শব্দ যোগ করুন
          </button>
        </div>
      </div>

      {/* ─── SECTION 1: PROMINENT DICTIONARY SEARCH BAR ───────────────────────── */}
      <div className="card mb-24" style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))',
        border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px'
      }}>
        <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOpen size={18} color="var(--primary-light)" />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary-light)' }}>
            ইংরেজি ➔ বাংলা ডিকশনারি সার্চ (English ➔ Bengali Dictionary)
          </span>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSearchDictionary(); }}
          style={{ display: 'flex', gap: 8, position: 'relative' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-3)'
            }} />
            <input
              type="text"
              className="form-input"
              placeholder="যে কোনো ইংরেজি শব্দ লিখুন (যেমন: benevolent, abate, resilient, candid)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: 42,
                paddingRight: searchQuery ? 38 : 14,
                fontSize: 15,
                height: 46,
                borderRadius: 'var(--radius)',
                borderColor: dictResult ? 'var(--primary)' : undefined,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer',
                  padding: 4
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={dictLoading || !searchQuery.trim()}
            style={{ height: 46, padding: '0 20px', minWidth: 100, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}
          >
            {dictLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Search size={16} />}
            খুঁজুন
          </button>
        </form>

        {/* Recent Searches Pills */}
        {recentSearches.length > 0 && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>সাম্প্রতিক অনুসন্ধান:</span>
            {recentSearches.map((rw) => (
              <button
                key={rw}
                type="button"
                onClick={() => { setSearchQuery(rw); handleSearchDictionary(rw); }}
                className="btn btn-xs btn-ghost"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  fontSize: 11,
                  padding: '3px 10px',
                  color: 'var(--text-2)'
                }}
              >
                {rw}
              </button>
            ))}
          </div>
        )}

        {/* Error State */}
        {dictError && (
          <div style={{
            marginTop: 14,
            background: 'var(--danger-glass)',
            color: 'var(--danger)',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <AlertCircle size={16} />
            {dictError}
          </div>
        )}

        {/* ─── DICTIONARY RESULT CARD ────────────────────────────────────────── */}
        {dictResult && (
          <div style={{
            marginTop: 20,
            background: 'var(--surface-2)',
            border: '1px solid var(--border-accent)',
            borderRadius: 'var(--radius)',
            padding: 20,
            animation: 'fadeIn 0.3s ease',
          }}>
            {/* Result Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, textTransform: 'capitalize', color: 'var(--primary-light)' }}>
                    {dictResult.word}
                  </h2>
                  {dictResult.phonetic && (
                    <span style={{ fontSize: 14, color: 'var(--text-3)', fontStyle: 'italic' }}>
                      {dictResult.phonetic}
                    </span>
                  )}
                  {/* Audio button */}
                  <button
                    type="button"
                    onClick={() => handlePlayPronunciation(dictResult.audio, dictResult.word)}
                    className="btn btn-xs btn-ghost"
                    style={{
                      background: isPlayingAudio ? 'var(--primary)' : 'var(--surface-3)',
                      color: isPlayingAudio ? '#fff' : 'var(--text)',
                      borderRadius: 999,
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12
                    }}
                    title="উচ্চারণ শুনুন"
                  >
                    <Volume2 size={14} />
                    {isPlayingAudio ? 'বলছে...' : 'উচ্চারণ (Listen)'}
                  </button>
                </div>

                {/* Prominent Bengali Meanings Banner */}
                {dictResult.primaryBengali && (
                  <div style={{
                    marginTop: 10,
                    padding: '8px 14px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    borderLeft: '4px solid var(--success)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>বাংলা অর্থ:</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', fontFamily: BENGALI_FONT }}>
                      {dictResult.primaryBengali}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button: Add to My Vocabulary */}
              <div>
                {isWordSaved(dictResult.word) ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', cursor: 'default' }}
                  >
                    <Check size={14} /> ✓ শব্দকোষে যুক্ত আছে (Saved)
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={() => handleAddDictionaryWord(dictResult)}
                    style={{ display: 'flex', gap: 6, alignItems: 'center' }}
                  >
                    <Plus size={15} /> + My Vocabulary-তে যোগ করুন
                  </button>
                )}
              </div>
            </div>

            {/* Meanings grouped by Part of Speech */}
            {Array.isArray(dictResult.meanings) && dictResult.meanings.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                {dictResult.meanings.map((m, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius)',
                      padding: '14px 16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span className="badge badge-primary" style={{ fontSize: 11, textTransform: 'capitalize', fontWeight: 700 }}>
                        {m.partOfSpeech}
                      </span>
                      {m.bengaliMeaning && m.bengaliMeaning !== dictResult.primaryBengali && (
                        <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: BENGALI_FONT }}>
                          {m.bengaliMeaning}
                        </span>
                      )}
                    </div>

                    {/* Definitions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {m.definitions?.map((d, dIdx) => (
                        <div key={dIdx} style={{ fontSize: 13, lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid var(--border)' }}>
                          <div style={{ color: 'var(--text)' }}>
                            <span style={{ fontWeight: 600, color: 'var(--primary-light)', marginRight: 6 }}>
                              {dIdx + 1}.
                            </span>
                            {d.definition}
                          </div>
                          {d.bengaliDefinition && (
                            <div style={{ color: 'var(--text-2)', fontSize: 12, marginTop: 2, fontFamily: BENGALI_FONT }}>
                              বাংলা: {d.bengaliDefinition}
                            </div>
                          )}
                          {d.example && (
                            <div style={{ marginTop: 4, fontStyle: 'italic', color: 'var(--text-3)', fontSize: 12 }}>
                              "{d.example}"
                              {d.bengaliExample && (
                                <span style={{ fontStyle: 'normal', color: 'var(--text-2)', display: 'block', marginTop: 2, fontFamily: BENGALI_FONT }}>
                                  বাংলা: "{d.bengaliExample}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Synonyms & Antonyms */}
            {(dictResult.synonyms?.length > 0 || dictResult.antonyms?.length > 0) && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dictResult.synonyms?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>সমার্থক শব্দ (Synonyms):</span>
                    {dictResult.synonyms.slice(0, 8).map((syn) => (
                      <button
                        key={syn}
                        type="button"
                        onClick={() => { setSearchQuery(syn); handleSearchDictionary(syn); }}
                        className="btn btn-xs btn-ghost"
                        style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}
                      >
                        {syn}
                      </button>
                    ))}
                  </div>
                )}
                {dictResult.antonyms?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>বিপরীত শব্দ (Antonyms):</span>
                    {dictResult.antonyms.slice(0, 8).map((ant) => (
                      <button
                        key={ant}
                        type="button"
                        onClick={() => { setSearchQuery(ant); handleSearchDictionary(ant); }}
                        className="btn btn-xs btn-ghost"
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: 6, padding: '2px 8px', fontSize: 11 }}
                      >
                        {ant}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: DAILY 10-WORD GOAL BANNER ─────────────────────────────── */}
      <div className="card mb-24" style={{
        background: todayCount >= DAILY_TARGET
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(20, 184, 166, 0.06) 100%)'
          : 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.04) 100%)',
        border: todayCount >= DAILY_TARGET ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <GraduationCap size={20} color={todayCount >= DAILY_TARGET ? 'var(--success)' : 'var(--primary)'} />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, fontFamily: BENGALI_FONT }}>
                দৈনিক লক্ষ্য (Daily Vocabulary Target): ১০টি শব্দ / দিন
              </h2>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: BENGALI_FONT }}>
              আজকের তারিখ: {TODAY} • মধ্যরাতে স্বয়ংক্রিয়ভাবে নতুন দিনের কাউন্টার শুরু হয়
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: 26,
                fontWeight: 800,
                color: todayCount >= DAILY_TARGET ? 'var(--success)' : 'var(--text)'
              }}>
                {todayCount} <span style={{ fontSize: 16, color: 'var(--text-3)', fontWeight: 500 }}>/ {DAILY_TARGET}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                {todayCount >= DAILY_TARGET
                  ? '🎉 Daily target complete!'
                  : `${DAILY_TARGET - todayCount} words remaining`}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: 14 }}>
          <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: todayCount >= DAILY_TARGET
                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                : 'linear-gradient(90deg, var(--primary), var(--primary-light))',
              borderRadius: 4,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: MY VOCABULARY & TABS ─────────────────────────────────── */}
      <div className="card">
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 12,
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${activeTab === 'today' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('today')}
            >
              📅 আজকের শব্দ ({todayWords.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('all')}
            >
              📚 সকল শব্দ ({words.length})
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={14} /> Daily History ({dailyHistory.length} দিন)
            </button>
          </div>

          {/* Search within saved words */}
          {activeTab !== 'history' && (
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="সংরক্ষিত শব্দ খুঁজুন..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                style={{ paddingLeft: 28, width: '100%' }}
              />
            </div>
          )}
        </div>

        {/* Filter Pills for Status */}
        {activeTab !== 'history' && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'সকল (All)' },
              { id: 'favorites', label: '⭐ পছন্দের (Favorites)' },
              { id: 'Learning', label: '📖 Learning' },
              { id: 'Learned', label: '✅ Learned' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                className={`btn btn-xs ${statusFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStatusFilter(f.id)}
                style={{ borderRadius: 999, padding: '4px 12px' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* ─── TAB: DAILY HISTORY VIEW ─────────────────────────────────────── */}
        {activeTab === 'history' ? (
          <div>
            {dailyHistory.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📅</div>
                <div className="empty-title">কোনো ইতিহাস পাওয়া যায়নি</div>
                <div className="empty-desc">প্রতিদিন শব্দ যোগ ও অনুশীলন করলে এখানে দিন অনুযায়ী তালিকা তৈরি হবে।</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dailyHistory.map((day) => {
                  const isExpanded = expandedHistoryDate === day.date;
                  const isDone = day.count >= DAILY_TARGET;
                  return (
                    <div
                      key={day.date}
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        onClick={() => setExpandedHistoryDate(isExpanded ? null : day.date)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: isDone ? 'rgba(34,197,94,0.04)' : undefined
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Calendar size={16} color="var(--primary-light)" />
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{day.date}</span>
                          {day.date === TODAY && <span className="badge badge-primary">আজ (Today)</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className={`badge ${isDone ? 'badge-success' : 'badge-warning'}`}>
                            {day.count}/{DAILY_TARGET} শব্দ {isDone ? '✓' : ''}
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* Words list for this date */}
                      {isExpanded && (
                        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8, marginTop: 10 }}>
                            {day.words?.map((w, i) => (
                              <div
                                key={w._id || i}
                                style={{
                                  background: 'var(--surface)',
                                  padding: '8px 12px',
                                  borderRadius: 6,
                                  border: '1px solid var(--border)',
                                  fontSize: 12
                                }}
                              >
                                <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{w.word}</div>
                                <div style={{ color: 'var(--text-2)', fontFamily: BENGALI_FONT }}>
                                  {w.bengaliMeaning || w.meaning}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ─── TAB: SAVED WORDS LIST ─────────────────────────────────────────── */
          <div>
            {displayedWords.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <div className="empty-title">
                  {activeTab === 'today' ? 'আজ এখনও কোনো শব্দ যোগ করা হয়নি' : 'কোনো শব্দ পাওয়া যায়নি'}
                </div>
                <div className="empty-desc">
                  উপরের ডিকশনারি সার্চ থেকে যে কোনো শব্দ সার্চ করে <strong>"+ Add to My Vocabulary"</strong> চাপুন।
                </div>
                <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal} style={{ marginTop: 12 }}>
                  + নিজে নতুন শব্দ লিখুন
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayedWords.map((word) => {
                  const isExpanded = expandedWordId === (word._id || word.id);
                  const isLearned = word.revisionStatus === 'Learned';

                  return (
                    <div
                      key={word._id || word.id}
                      style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        padding: 16,
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>
                              {word.word}
                            </span>
                            {word.partOfSpeech && (
                              <span className="badge badge-primary" style={{ fontSize: 10, textTransform: 'capitalize' }}>
                                {word.partOfSpeech}
                              </span>
                            )}
                            <span className={`badge ${isLearned ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                              {isLearned ? '✅ Learned' : '📖 Learning'}
                            </span>
                            {word.pronunciation && (
                              <span style={{ fontSize: 12, color: 'var(--text-3)', fontStyle: 'italic' }}>
                                {word.pronunciation}
                              </span>
                            )}
                            {/* Audio pronunciation button */}
                            <button
                              type="button"
                              className="btn btn-icon btn-ghost btn-sm"
                              onClick={() => handlePlayPronunciation(word.audio, word.word)}
                              title="উচ্চারণ শুনুন"
                            >
                              <Volume2 size={13} />
                            </button>
                          </div>

                          {/* Bengali Meaning */}
                          {word.bengaliMeaning && (
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary-light)', marginTop: 4, fontFamily: BENGALI_FONT }}>
                              {word.bengaliMeaning}
                            </div>
                          )}

                          {/* English Meaning */}
                          {word.meaning && word.meaning !== word.bengaliMeaning && (
                            <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>
                              {word.meaning}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          {/* Study / Mark as Learned Button */}
                          <button
                            type="button"
                            className={`btn btn-xs ${isLearned ? 'btn-ghost' : 'btn-primary'}`}
                            onClick={() => handleToggleLearned(word)}
                            style={{
                              borderRadius: 6,
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Check size={12} />
                            {isLearned ? 'Mark Learning' : 'Mark Learned'}
                          </button>

                          {/* Favorite Button */}
                          <button
                            type="button"
                            className="btn btn-icon btn-ghost btn-sm"
                            onClick={() => handleToggleFavorite(word._id || word.id)}
                            title="পছন্দের তালিকা"
                          >
                            <Star
                              size={14}
                              fill={word.favorite ? 'var(--warning)' : 'none'}
                              color={word.favorite ? 'var(--warning)' : 'var(--text-3)'}
                            />
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            className="btn btn-icon btn-ghost btn-sm"
                            onClick={() => handleOpenEditModal(word)}
                            title="সম্পাদনা"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            className="btn btn-icon btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => handleDelete(word._id || word.id)}
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={13} />
                          </button>

                          {/* Expand details toggle */}
                          {(word.example || word.synonyms?.length > 0 || word.antonyms?.length > 0) && (
                            <button
                              type="button"
                              className="btn btn-icon btn-ghost btn-sm"
                              onClick={() => setExpandedWordId(isExpanded ? null : (word._id || word.id))}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded Section (Example, Synonyms, Antonyms) */}
                      {isExpanded && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 13 }}>
                          {word.example && (
                            <div style={{ marginBottom: 6, fontStyle: 'italic', color: 'var(--text-2)' }}>
                              📝 Example: "{word.example}"
                              {word.bengaliExample && (
                                <div style={{ fontStyle: 'normal', color: 'var(--text-3)', marginTop: 2, fontFamily: BENGALI_FONT }}>
                                  বাংলা: "{word.bengaliExample}"
                                </div>
                              )}
                            </div>
                          )}

                          {word.synonyms?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)' }}>সমার্থক:</span>
                              {word.synonyms.map((s) => (
                                <span key={s} style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '1px 6px', borderRadius: 4 }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {word.antonyms?.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)' }}>বিপরীত:</span>
                              {word.antonyms.map((a) => (
                                <span key={a} style={{ fontSize: 11, background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '1px 6px', borderRadius: 4 }}>
                                  {a}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── ADD / EDIT MANUAL MODAL ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal" style={{ maxWidth: 560, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingWord ? '✏️ শব্দ সম্পাদনা করুন' : '➕ নতুন শব্দ যোগ করুন'}
              </h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleAddWord} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {formError && (
                <div style={{ background: 'var(--danger-glass)', color: 'var(--danger)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 13 }}>
                  ⚠️ {formError}
                </div>
              )}

              <div className="grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">ইংরেজি শব্দ (English Word) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="যেমন: benevolent"
                    value={formData.word}
                    onChange={(e) => setFormData({ ...formData, word: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Part of Speech</label>
                  <select
                    className="form-select"
                    value={formData.partOfSpeech}
                    onChange={(e) => setFormData({ ...formData, partOfSpeech: e.target.value })}
                  >
                    <option value="Noun">Noun (বিশেষ্য)</option>
                    <option value="Verb">Verb (ক্রিয়া)</option>
                    <option value="Adjective">Adjective (বিশেষণ)</option>
                    <option value="Adverb">Adverb (ক্রিয়া বিশেষণ)</option>
                    <option value="Idiom">Idiom / Phrase</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: 'var(--success)', fontWeight: 700 }}>
                  বাংলা অর্থ (Bengali Meaning) *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="যেমন: দয়ালু, পরোপকারী"
                  value={formData.bengaliMeaning}
                  onChange={(e) => setFormData({ ...formData, bengaliMeaning: e.target.value })}
                  style={{ fontFamily: BENGALI_FONT }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ইংরেজি অর্থ (English Definition)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Well meaning and kindly"
                  value={formData.meaning}
                  onChange={(e) => setFormData({ ...formData, meaning: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">উদাহরণ বাক্য (Example Sentence)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. He was known for his benevolent nature."
                  value={formData.example}
                  onChange={(e) => setFormData({ ...formData, example: e.target.value })}
                />
              </div>

              <div className="grid-2">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">সমার্থক শব্দ (Synonyms)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="kind, generous (কমা দিয়ে)"
                    value={formData.synonyms}
                    onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">বিপরীত শব্দ (Antonyms)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="cruel, unkind (কমা দিয়ে)"
                    value={formData.antonyms}
                    onChange={(e) => setFormData({ ...formData, antonyms: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>
                  বাতিল
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingWord ? 'সংরক্ষণ করুন' : '+ শব্দ যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
