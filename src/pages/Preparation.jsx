// src/pages/Preparation.jsx
// Phase 7 Real Course & Syllabus Data Command Center — 5-Tier Hierarchy, Resource Tracking & CSV/JSON Import

import { useEffect, useState, useMemo } from 'react';
import {
  Plus, ChevronRight, ChevronDown, BookOpen, Layers, Edit2, Trash2, CheckCircle2,
  Circle, AlertTriangle, Search, Filter, Upload, Download, Sparkles, Clock, Target,
  FileText, ExternalLink, X, RotateCcw, BarChart3, Tag, HelpCircle, Video, Book,
  CheckSquare, Square, Link as LinkIcon, Play
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getAllAreas, getAllCourses, getAllSubjects, getAllChapters, getAllTopics, getAllStudyResources,
  addArea, updateArea, deleteArea,
  addCourse, updateCourse, deleteCourse,
  addSubject, updateSubject, deleteSubject,
  addChapter, updateChapter, deleteChapter,
  addTopic, updateTopic, deleteTopic,
  addStudyResource, updateStudyResource, deleteStudyResource,
  getSettings, addNotification,
  getAllMocks, getMockSubjectResults, getErrorLogs, getPendingRevisions
} from '../services/db';
import { useAppStore } from '../store/useAppStore';
import { createInitialRevision } from '../services/revisionService';
import { classifyTopicPerformance } from '../services/performanceEngine';
import { calculatePriorityScore } from '../services/priorityEngine';
import {
  calculateSyllabusProgress, calculateAreaProgress, calculateCourseProgress,
  calculateSubjectProgress, calculateChapterProgress, calculateTopicResourceProgress,
  validateSyllabusJSON, executeSyllabusImport, generateSyllabusTemplateJSON, generateSyllabusTemplateCSV
} from '../services/syllabusService';

const STATUS_CONFIG = {
  'Not Started': { label: 'Not Started', badge: 'badge-muted', icon: Circle, color: '#64748b' },
  'Learning': { label: 'Learning', badge: 'badge-info', icon: Clock, color: '#0ea5e9' },
  'In Progress': { label: 'In Progress', badge: 'badge-info', icon: Clock, color: '#0ea5e9' },
  'Completed': { label: 'Completed', badge: 'badge-success', icon: CheckCircle2, color: '#22c55e' },
  'Revision Due': { label: 'Revision Due', badge: 'badge-warning', icon: RotateCcw, color: '#f59e0b' },
  'Weak': { label: 'Weak', badge: 'badge-danger', icon: AlertTriangle, color: '#ef4444' },
  'Mastered': { label: 'Mastered', badge: 'badge-primary', icon: Sparkles, color: '#a855f7' },
  'On Hold': { label: 'On Hold', badge: 'badge-warning', icon: AlertTriangle, color: '#f59e0b' },
};

const IMPORTANCE_CONFIG = {
  'Critical': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: '#ef4444' },
  'High': { color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: '#f97316' },
  'Medium': { color: '#eab308', bg: 'rgba(234,179,8,0.15)', border: '#eab308' },
  'Low': { color: '#64748b', bg: 'rgba(100,116,139,0.15)', border: '#64748b' },
};

const DIFFICULTY_CONFIG = {
  'Very Hard': { label: 'Very Hard', color: '#ef4444' },
  'Hard': { label: 'Hard', color: '#f97316' },
  'Medium': { label: 'Medium', color: '#eab308' },
  'Easy': { label: 'Easy', color: '#22c55e' },
};

const RESOURCE_ICONS = {
  'Video Lecture': Video,
  'PDF': FileText,
  'Notes': BookOpen,
  'Book': Book,
  'Practice Set': Target,
  'MCQ': CheckSquare,
  'External Link': LinkIcon,
  'Other': Tag,
};

export default function Preparation() {
  const {
    preparationAreas, setPreparationAreas,
    courses, setCourses,
    subjects, setSubjects,
    chapters, setChapters,
    topics, setTopics,
    studyResources, setStudyResources,
    settings
  } = useAppStore();

  // Local navigation & filter state
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState('all'); // 'all' or course ID
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterImportance, setFilterImportance] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [collapsedSubjects, setCollapsedSubjects] = useState({});
  const [collapsedChapters, setCollapsedChapters] = useState({});

  // Intelligence state
  const [allMocks, setAllMocks] = useState([]);
  const [allErrors, setAllErrors] = useState([]);
  const [allRevisions, setAllRevisions] = useState([]);

  // Modals state
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showAddChapter, setShowAddChapter] = useState(null); // subjectId to add chapter to
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTopicDetail, setSelectedTopicDetail] = useState(null);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicContextForNewTopic, setTopicContextForNewTopic] = useState({});
  const [loading, setLoading] = useState(true);

  // Load all foundational data
  const loadData = async () => {
    try {
      const [areasList, coursesList, subjectsList, chaptersList, topicsList, resourcesList, mocksList, errorsList, revsList] = await Promise.all([
        getAllAreas(),
        getAllCourses(),
        getAllSubjects(),
        getAllChapters(),
        getAllTopics(),
        getAllStudyResources(),
        getAllMocks(),
        getErrorLogs(),
        getPendingRevisions(),
      ]);

      setPreparationAreas(areasList);
      setCourses(coursesList);
      setSubjects(subjectsList);
      setChapters(chaptersList);
      setTopics(topicsList);
      setStudyResources(resourcesList);
      setAllMocks(mocksList);
      setAllErrors(errorsList);
      setAllRevisions(revsList);

      if (areasList.length > 0 && !selectedAreaId) {
        setSelectedAreaId(areasList[0].id);
      }
    } catch (err) {
      console.error('[Preparation] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentArea = useMemo(() => {
    return preparationAreas.find((a) => a.id === selectedAreaId) || preparationAreas[0] || null;
  }, [preparationAreas, selectedAreaId]);

  const currentCourses = useMemo(() => {
    if (!currentArea) return [];
    return courses.filter((c) => c.preparationAreaId === currentArea.id);
  }, [courses, currentArea]);

  const currentSubjects = useMemo(() => {
    if (!currentArea) return [];
    return subjects.filter((s) => s.preparationAreaId === currentArea.id);
  }, [subjects, currentArea]);

  const currentChapters = useMemo(() => {
    if (!currentArea) return [];
    return chapters.filter((c) => c.preparationAreaId === currentArea.id);
  }, [chapters, currentArea]);

  const currentTopics = useMemo(() => {
    if (!currentArea) return [];
    return topics.filter((t) => t.preparationAreaId === currentArea.id);
  }, [topics, currentArea]);

  // Filtered topics based on search and filters
  const filteredTopics = useMemo(() => {
    return currentTopics.filter((t) => {
      // Course filter
      if (selectedCourseId !== 'all') {
        const cId = Number(selectedCourseId);
        if (t.courseId !== cId) return false;
      }

      // Subject filter
      if (filterSubject !== 'all') {
        const sId = Number(filterSubject);
        if (t.subjectId !== sId) return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'Completed') {
          if (t.status !== 'Completed' && t.status !== 'Mastered') return false;
        } else if (filterStatus === 'Learning' || filterStatus === 'In Progress') {
          if (t.status !== 'Learning' && t.status !== 'In Progress') return false;
        } else if (t.status !== filterStatus) {
          return false;
        }
      }

      // Importance filter
      if (filterImportance !== 'all') {
        const imp = t.importance || t.priority || 'Medium';
        if (imp !== filterImportance) return false;
      }

      // Difficulty filter
      if (filterDifficulty !== 'all') {
        const diff = t.difficulty || 'Medium';
        if (diff !== filterDifficulty) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const subject = subjects.find((s) => s.id === t.subjectId);
        const chapter = chapters.find((c) => c.id === t.chapterId);
        const course = courses.find((c) => c.id === t.courseId);
        const matchName = t.name.toLowerCase().includes(q);
        const matchDesc = (t.description || '').toLowerCase().includes(q);
        const matchRef = (t.resourceReference || '').toLowerCase().includes(q);
        const matchSubj = subject ? subject.name.toLowerCase().includes(q) : false;
        const matchChap = chapter ? chapter.name.toLowerCase().includes(q) : false;
        const matchCourse = course ? course.name.toLowerCase().includes(q) : false;
        if (!matchName && !matchDesc && !matchRef && !matchSubj && !matchChap && !matchCourse) return false;
      }

      return true;
    });
  }, [currentTopics, selectedCourseId, filterSubject, filterStatus, filterImportance, filterDifficulty, searchQuery, subjects, chapters, courses]);

  // Overall syllabus progress for current area
  const areaProgress = useMemo(() => {
    return calculateSyllabusProgress(currentTopics);
  }, [currentTopics]);

  // Toggle subject & chapter collapses
  const toggleSubjectCollapse = (subjectId) => {
    setCollapsedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const toggleChapterCollapse = (chapterId) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const expandAll = () => {
    setCollapsedSubjects({});
    setCollapsedChapters({});
  };

  const collapseAll = () => {
    const allSubs = {};
    currentSubjects.forEach((s) => (allSubs[s.id] = true));
    setCollapsedSubjects(allSubs);
    const allChaps = {};
    currentChapters.forEach((c) => (allChaps[c.id] = true));
    setCollapsedChapters(allChaps);
  };

  // Status Change Handler with Phase 5 adaptive revision integration
  const handleStatusChange = async (topic, newStatus) => {
    const updates = { status: newStatus };
    const today = format(new Date(), 'yyyy-MM-dd');

    if (newStatus === 'Completed' || newStatus === 'Mastered') {
      updates.status = newStatus;
      updates.completionPercentage = 100;
      updates.completionPercent = 100;
      if (!topic.dateCompleted) updates.dateCompleted = today;
      updates.lastStudiedDate = today;

      // Phase 5 integration: Auto-create initial adaptive revision
      try {
        await createInitialRevision(topic.id, topic.name, today);
        await addNotification({
          type: 'revision',
          title: 'Revision Scheduled',
          message: `"${topic.name}" completed! Adaptive spaced repetition scheduled.`,
          scheduledAt: new Date().toISOString(),
          idempotencyKey: `topic-completed-${topic.id}-${today}`,
        });
      } catch (err) {
        console.warn('[Preparation] Revision schedule warning:', err);
      }
    } else if (newStatus === 'Learning' || newStatus === 'In Progress') {
      updates.status = 'Learning';
      if (!topic.dateStarted) updates.dateStarted = today;
      updates.lastStudiedDate = today;
      if (topic.completionPercentage === 100) updates.completionPercentage = 50;
    } else if (newStatus === 'Not Started') {
      updates.status = 'Not Started';
      updates.completionPercentage = 0;
      updates.completionPercent = 0;
    } else if (newStatus === 'On Hold') {
      updates.status = 'On Hold';
    } else if (newStatus === 'Weak') {
      updates.status = 'Weak';
    }

    await updateTopic(topic.id, updates);
    setTopics((prev) => prev.map((t) => (t.id === topic.id ? { ...t, ...updates } : t)));

    if (selectedTopicDetail && selectedTopicDetail.id === topic.id) {
      setSelectedTopicDetail((prev) => ({ ...prev, ...updates }));
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  return (
    <div>
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1 className="page-title">Real Syllabus Command Center</h1>
          <p className="page-subtitle">5-Tier preparation management: Area → Course → Subject → Chapter → Topic → Resources</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setShowImportModal(true)}>
            <Upload size={14} /> Import Syllabus
          </button>
          <button className="btn btn-ghost" onClick={() => setShowAddSubject(true)}>
            <Plus size={14} /> Add Subject
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTopic(null);
              setTopicContextForNewTopic({});
              setShowAddTopic(true);
            }}
          >
            <Plus size={14} /> Add Topic
          </button>
        </div>
      </div>

      {/* ── Preparation Area Tabs ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, marginBottom: 16 }}>
        {preparationAreas.map((area) => {
          const stats = calculateAreaProgress(area.id, topics);
          const isSelected = selectedAreaId === area.id;
          return (
            <button
              key={area.id}
              onClick={() => {
                setSelectedAreaId(area.id);
                setSelectedCourseId('all');
                setFilterSubject('all');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 'var(--radius)',
                background: isSelected ? 'var(--card)' : 'var(--surface)',
                border: `1px solid ${isSelected ? area.color : 'var(--border)'}`,
                boxShadow: isSelected ? `0 0 12px ${area.color}25` : 'none',
                cursor: 'pointer', transition: 'var(--transition)', flexShrink: 0
              }}
            >
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: area.color, flexShrink: 0 }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{area.name}</div>
                <div style={{ fontSize: 11, color: isSelected ? area.color : 'var(--text-2)' }}>
                  {stats.isMapped ? `${stats.completed}/${stats.total} (${stats.percentage}%)` : 'No syllabus'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Area & Course Overview Bar ─────────────────────────── */}
      {currentArea && (
        <div className="card mb-20" style={{ padding: '16px 20px', background: 'var(--card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>{currentArea.name}</h2>
                <span className="badge" style={{ background: `${currentArea.color}20`, color: currentArea.color, borderColor: currentArea.color }}>
                  {currentSubjects.length} Subjects · {currentChapters.length} Chapters · {currentTopics.length} Topics
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>{currentArea.description || 'Comprehensive preparation structure'}</p>
            </div>

            {/* Course Selector Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text-2)', marginRight: 4 }}>Course:</span>
              <button
                className={`btn btn-sm ${selectedCourseId === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedCourseId('all')}
              >
                All Courses
              </button>
              {currentCourses.map((c) => {
                const cStats = calculateCourseProgress(c.id, currentTopics);
                const isSelected = selectedCourseId === c.id;
                return (
                  <button
                    key={c.id}
                    className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSelectedCourseId(c.id)}
                    style={{ position: 'relative' }}
                  >
                    {c.name}
                    {cStats.isMapped && (
                      <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.85 }}>({cStats.percentage}%)</span>
                    )}
                  </button>
                );
              })}
              <button className="btn btn-sm btn-ghost" onClick={() => setShowAddCourse(true)} title="Add Course Resource">
                <Plus size={12} /> Course
              </button>
            </div>
          </div>

          {/* Area Progress Breakdown */}
          {areaProgress.isMapped ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-2)' }}>
                  Overall Completion: <strong>{areaProgress.completed}</strong> of <strong>{areaProgress.total}</strong> topics
                  {areaProgress.learning > 0 && ` · ${areaProgress.learning} learning`}
                  {areaProgress.revisionDue > 0 && ` · ${areaProgress.revisionDue} revision due`}
                  {areaProgress.weak > 0 && ` · ${areaProgress.weak} weak`}
                </span>
                <span style={{ fontWeight: 700, color: currentArea.color }}>{areaProgress.percentage}%</span>
              </div>
              <div className="progress-bar" style={{ height: 8, background: 'var(--surface-3)' }}>
                <div className="progress-fill" style={{ width: `${areaProgress.percentage}%`, background: currentArea.color }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', color: 'var(--text-2)', fontSize: 12 }}>
              <HelpCircle size={15} style={{ color: 'var(--warning)' }} />
              <span>No syllabus mapped yet for {currentArea.name}. Add subjects, chapters, and topics manually or import via JSON/CSV.</span>
            </div>
          )}
        </div>
      )}

      {/* ── EMPTY STATE IF NO SYLLABUS MAPPED ──────────────────── */}
      {!areaProgress.isMapped ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>No syllabus mapped yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 480, margin: '0 auto 20px auto' }}>
            {currentArea?.name} currently has no subjects or topics. Start building your structured preparation map by adding subjects or importing structured syllabus data.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => setShowAddSubject(true)}>
              <Plus size={14} /> Add Subject
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAddCourse(true)}>
              <Plus size={14} /> Add Course
            </button>
            <button className="btn btn-ghost" onClick={() => setShowImportModal(true)}>
              <Upload size={14} /> Import Syllabus (JSON / CSV)
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ── Search & Filter Controls ────────────────────────── */}
          <div className="card mb-20" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              {/* Search input */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input
                  type="text"
                  placeholder="Search topic, chapter, subject, course, or resource reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--radius)',
                    background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Collapse/Expand toggles */}
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-sm btn-ghost" onClick={expandAll} title="Expand all">
                  Expand All
                </button>
                <button className="btn btn-sm btn-ghost" onClick={collapseAll} title="Collapse all">
                  Collapse All
                </button>
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Filters:</span>

              {/* Subject Filter */}
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{ padding: '5px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                <option value="all">All Subjects ({currentSubjects.length})</option>
                {currentSubjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '5px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                <option value="all">All Statuses</option>
                <option value="Not Started">Not Started</option>
                <option value="Learning">Learning / In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Revision Due">Revision Due</option>
                <option value="Weak">Weak</option>
                <option value="Mastered">Mastered</option>
                <option value="On Hold">On Hold</option>
              </select>

              {/* Importance Filter */}
              <select
                value={filterImportance}
                onChange={(e) => setFilterImportance(e.target.value)}
                style={{ padding: '5px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                <option value="all">All Importance</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                style={{ padding: '5px 10px', fontSize: 12, borderRadius: 'var(--radius-sm)', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                <option value="all">All Difficulty</option>
                <option value="Very Hard">Very Hard</option>
                <option value="Hard">Hard</option>
                <option value="Medium">Medium</option>
                <option value="Easy">Easy</option>
              </select>

              {/* Reset Filters button */}
              {(filterSubject !== 'all' || filterStatus !== 'all' || filterImportance !== 'all' || filterDifficulty !== 'all' || searchQuery) && (
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => {
                    setFilterSubject('all');
                    setFilterStatus('all');
                    setFilterImportance('all');
                    setFilterDifficulty('all');
                    setSearchQuery('');
                  }}
                  style={{ color: 'var(--danger)', fontSize: 11 }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* ── 5-Tier Hierarchical Syllabus Tree View ───────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {currentSubjects.map((subject) => {
              const allSubTopics = currentTopics.filter((t) => t.subjectId === subject.id);
              const subjectChapters = currentChapters.filter((c) => c.subjectId === subject.id);
              const isSubCollapsed = collapsedSubjects[subject.id];

              // Topics matching filter under this subject
              const matchingTopicsInSubj = filteredTopics.filter((t) => t.subjectId === subject.id);

              if (matchingTopicsInSubj.length === 0 && (searchQuery || filterStatus !== 'all' || filterImportance !== 'all' || filterDifficulty !== 'all' || filterSubject !== 'all' || selectedCourseId !== 'all')) {
                return null;
              }

              const subStats = calculateSubjectProgress(subject.id, allSubTopics);

              return (
                <div key={subject.id} className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {/* Subject Header */}
                  <div
                    onClick={() => toggleSubjectCollapse(subject.id)}
                    style={{
                      padding: '14px 18px',
                      background: 'var(--surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', borderBottom: isSubCollapsed ? 'none' : '1px solid var(--border)',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ color: 'var(--text-3)' }}>
                        {isSubCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </div>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: subject.color || 'var(--primary)' }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{subject.name}</span>
                      <span className="badge badge-muted" style={{ fontSize: 11 }}>
                        {allSubTopics.length} topics {subjectChapters.length > 0 && `· ${subjectChapters.length} chapters`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Subject Progress Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
                        <div className="progress-bar" style={{ flex: 1, height: 6 }}>
                          <div className="progress-fill" style={{ width: `${subStats.percentage}%`, background: subject.color || 'var(--primary)' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{subStats.percentage}%</span>
                      </div>

                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddChapter(subject.id);
                        }}
                        title="Add chapter/module to subject"
                      >
                        <Layers size={13} /> +Chapter
                      </button>

                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTopic(null);
                          setTopicContextForNewTopic({ subjectId: subject.id });
                          setShowAddTopic(true);
                        }}
                        title="Add topic to subject"
                      >
                        <Plus size={13} /> +Topic
                      </button>
                    </div>
                  </div>

                  {/* Subject Body */}
                  {!isSubCollapsed && (
                    <div style={{ padding: '4px 0' }}>
                      {/* Chapters Grouping */}
                      {subjectChapters.map((chapter) => {
                        const chapterTopics = filteredTopics.filter((t) => t.chapterId === chapter.id);
                        const allChapTopics = allSubTopics.filter((t) => t.chapterId === chapter.id);
                        const isChapCollapsed = collapsedChapters[chapter.id];
                        const chapStats = calculateChapterProgress(chapter.id, allChapTopics);

                        return (
                          <div key={chapter.id} style={{ margin: '6px 12px', border: '1px solid var(--border-light, rgba(255,255,255,0.06))', borderRadius: 'var(--radius)' }}>
                            {/* Chapter Header */}
                            <div
                              onClick={() => toggleChapterCollapse(chapter.id)}
                              style={{
                                padding: '10px 14px', background: 'var(--surface-2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                cursor: 'pointer', borderBottom: isChapCollapsed ? 'none' : '1px solid var(--border-light, rgba(255,255,255,0.05))',
                                userSelect: 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ color: 'var(--text-3)' }}>
                                  {isChapCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </div>
                                <Layers size={14} style={{ color: 'var(--primary-light)' }} />
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{chapter.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>({allChapTopics.length} topics)</span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{chapStats.percentage}%</span>
                                <button
                                  className="btn btn-xs btn-ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTopic(null);
                                    setTopicContextForNewTopic({ subjectId: subject.id, chapterId: chapter.id });
                                    setShowAddTopic(true);
                                  }}
                                  title="Add topic to chapter"
                                >
                                  <Plus size={11} /> Topic
                                </button>
                              </div>
                            </div>

                            {/* Chapter Topics */}
                            {!isChapCollapsed && (
                              <div style={{ padding: '2px 0' }}>
                                {chapterTopics.length === 0 ? (
                                  <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>
                                    No topics in this chapter.
                                  </div>
                                ) : (
                                  chapterTopics.map((topic) => renderTopicRow(topic))
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Direct Topics (no chapter assigned) */}
                      {(() => {
                        const directTopics = filteredTopics.filter((t) => t.subjectId === subject.id && !t.chapterId);
                        if (directTopics.length === 0 && subjectChapters.length === 0) {
                          return (
                            <div style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
                              No topics found matching your filters in {subject.name}.
                            </div>
                          );
                        }
                        return directTopics.map((topic) => renderTopicRow(topic));
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── TOPIC DETAILS MODAL / DRAWER ──────────────────────── */}
      {selectedTopicDetail && (
        <TopicDetailModal
          topic={selectedTopicDetail}
          subjects={subjects}
          chapters={chapters}
          courses={courses}
          preparationAreas={preparationAreas}
          allErrors={allErrors}
          allMocks={allMocks}
          allRevisions={allRevisions}
          allStudyResources={studyResources}
          onClose={() => setSelectedTopicDetail(null)}
          onStatusChange={handleStatusChange}
          onAddResource={async (resData) => {
            const id = await addStudyResource(resData);
            setStudyResources((prev) => [...prev, { ...resData, id }]);
          }}
          onToggleResource={async (resId, completed, watchedPercentage) => {
            await updateStudyResource(resId, { completed, watchedPercentage });
            setStudyResources((prev) => prev.map((r) => r.id === resId ? { ...r, completed, watchedPercentage } : r));
          }}
          onDeleteResource={async (resId) => {
            await deleteStudyResource(resId);
            setStudyResources((prev) => prev.filter((r) => r.id !== resId));
          }}
          onEdit={(t) => {
            setSelectedTopicDetail(null);
            setEditingTopic(t);
            setShowAddTopic(true);
          }}
          onDelete={async (id) => {
            await deleteTopic(id);
            setTopics((prev) => prev.filter((t) => t.id !== id));
            setSelectedTopicDetail(null);
          }}
        />
      )}

      {/* ── ADD / EDIT TOPIC MODAL ────────────────────────────── */}
      {showAddTopic && (
        <AddEditTopicModal
          initialTopic={editingTopic}
          defaultContext={topicContextForNewTopic}
          currentAreaId={selectedAreaId}
          subjects={currentSubjects}
          chapters={currentChapters}
          courses={currentCourses}
          allTopics={currentTopics}
          onClose={() => { setShowAddTopic(false); setEditingTopic(null); }}
          onSave={async (topicData) => {
            if (editingTopic) {
              await updateTopic(editingTopic.id, topicData);
              setTopics((prev) => prev.map((t) => (t.id === editingTopic.id ? { ...t, ...topicData } : t)));
            } else {
              const newId = await addTopic(topicData);
              setTopics((prev) => [...prev, { ...topicData, id: newId }]);
            }
            setShowAddTopic(false);
            setEditingTopic(null);
          }}
        />
      )}

      {/* ── ADD CHAPTER MODAL ─────────────────────────────────── */}
      {showAddChapter && (
        <AddChapterModal
          currentAreaId={selectedAreaId}
          subjectId={showAddChapter}
          courses={currentCourses}
          onClose={() => setShowAddChapter(null)}
          onSave={async (chapData) => {
            const newId = await addChapter(chapData);
            setChapters((prev) => [...prev, { ...chapData, id: newId }]);
            setShowAddChapter(null);
          }}
        />
      )}

      {/* ── ADD SUBJECT MODAL ─────────────────────────────────── */}
      {showAddSubject && (
        <AddSubjectModal
          currentAreaId={selectedAreaId}
          courses={currentCourses}
          onClose={() => setShowAddSubject(false)}
          onSave={async (subjData) => {
            const newId = await addSubject(subjData);
            setSubjects((prev) => [...prev, { ...subjData, id: newId }]);
            setShowAddSubject(false);
          }}
        />
      )}

      {/* ── ADD COURSE MODAL ──────────────────────────────────── */}
      {showAddCourse && (
        <AddCourseModal
          currentAreaId={selectedAreaId}
          onClose={() => setShowAddCourse(false)}
          onSave={async (courseData) => {
            const newId = await addCourse(courseData);
            setCourses((prev) => [...prev, { ...courseData, id: newId }]);
            setShowAddCourse(false);
          }}
        />
      )}

      {/* ── BULK SYLLABUS IMPORT MODAL ────────────────────────── */}
      {showImportModal && (
        <BulkImportModal
          prepAreas={preparationAreas}
          courses={courses}
          subjects={subjects}
          chapters={chapters}
          topics={topics}
          defaultAreaId={selectedAreaId}
          onClose={() => setShowImportModal(false)}
          onImportSuccess={async () => {
            await loadData();
            setShowImportModal(false);
          }}
        />
      )}
    </div>
  );

  // Helper renderer for topic row
  function renderTopicRow(topic) {
    const impConf = IMPORTANCE_CONFIG[topic.importance || topic.priority || 'Medium'];
    const isDone = topic.status === 'Completed' || topic.status === 'Mastered';
    const topicErrors = allErrors.filter((e) => e.topicId === topic.id);
    const isWeak = topicErrors.length >= 2 || topic.status === 'Weak';
    const topicRes = studyResources.filter((r) => r.topicId === topic.id);

    return (
      <div
        key={topic.id}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 18px', borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.03))',
          background: isDone ? 'rgba(34,197,94,0.02)' : 'transparent',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = isDone ? 'rgba(34,197,94,0.02)' : 'transparent')}
      >
        {/* Left: Status icon + Name + Subtopic info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <button
            onClick={() => handleStatusChange(topic, isDone ? 'In Progress' : 'Completed')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: isDone ? 'var(--success)' : 'var(--text-3)',
              display: 'flex', alignItems: 'center', padding: 0
            }}
            title={isDone ? 'Mark as In Progress' : 'Mark as Completed'}
          >
            {isDone ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>

          <div
            onClick={() => setSelectedTopicDetail(topic)}
            style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isDone ? 'var(--text-2)' : 'var(--text)',
                  textDecoration: isDone ? 'line-through' : 'none'
                }}
                className="truncate"
              >
                {topic.name}
              </span>

              {/* Importance Chip */}
              <span
                style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                  color: impConf.color, background: impConf.bg, border: `1px solid ${impConf.border}`
                }}
              >
                {topic.importance || topic.priority || 'Medium'}
              </span>

              {/* Weakness badge */}
              {isWeak && (
                <span className="badge badge-danger" style={{ fontSize: 9 }}>
                  ⚠️ Weak ({topicErrors.length} errors)
                </span>
              )}

              {/* Attached resources indicator */}
              {topicRes.length > 0 && (
                <span className="badge badge-info" style={{ fontSize: 9 }}>
                  📁 {topicRes.length} resource{topicRes.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Description or Resource ref */}
            {(topic.resourceReference || topic.description) && (
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }} className="truncate">
                {topic.resourceReference ? `📖 ${topic.resourceReference}` : topic.description}
              </div>
            )}
          </div>
        </div>

        {/* Right: Metadata chips + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Estimated Hours */}
          <span style={{ fontSize: 11, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Clock size={12} /> {topic.estimatedHours || (topic.estimatedMinutes ? topic.estimatedMinutes / 60 : 2)}h
          </span>

          {/* Difficulty */}
          <span
            style={{
              fontSize: 11,
              color: (DIFFICULTY_CONFIG[topic.difficulty] || DIFFICULTY_CONFIG['Medium']).color
            }}
          >
            {topic.difficulty || 'Medium'}
          </span>

          {/* Status dropdown */}
          <select
            value={topic.status || 'Not Started'}
            onChange={(e) => handleStatusChange(topic, e.target.value)}
            style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 4,
              background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)'
            }}
          >
            <option value="Not Started">Not Started</option>
            <option value="Learning">Learning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Revision Due">Revision Due</option>
            <option value="Weak">Weak</option>
            <option value="Mastered">Mastered</option>
            <option value="On Hold">On Hold</option>
          </select>

          {/* Details Button */}
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => setSelectedTopicDetail(topic)}
            style={{ padding: '4px 8px', fontSize: 11 }}
          >
            Details
          </button>
        </div>
      </div>
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS & MODALS
// ─────────────────────────────────────────────────────────────────────────────

function TopicDetailModal({
  topic, subjects, chapters, courses, preparationAreas,
  allErrors, allMocks, allRevisions, allStudyResources,
  onClose, onStatusChange, onAddResource, onToggleResource, onDeleteResource, onEdit, onDelete
}) {
  const [showAddRes, setShowAddRes] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState('Video Lecture');
  const [resUrl, setResUrl] = useState('');
  const [resDuration, setResDuration] = useState(30);

  const subject = subjects.find((s) => s.id === topic.subjectId);
  const chapter = chapters.find((c) => c.id === topic.chapterId);
  const course = courses.find((c) => c.id === topic.courseId);
  const prepArea = preparationAreas.find((a) => a.id === topic.preparationAreaId);

  const topicErrors = allErrors.filter((e) => e.topicId === topic.id);
  const topicRevisions = allRevisions.filter((r) => r.topicId === topic.id);
  const topicResources = allStudyResources.filter((r) => r.topicId === topic.id);

  const isCompleted = topic.status === 'Completed' || topic.status === 'Mastered';

  const handleSaveNewResource = (e) => {
    e.preventDefault();
    if (!resTitle.trim()) return;
    onAddResource({
      topicId: topic.id,
      preparationAreaId: topic.preparationAreaId,
      courseId: topic.courseId,
      subjectId: topic.subjectId,
      title: resTitle.trim(),
      resourceType: resType,
      url: resUrl.trim(),
      durationMinutes: Number(resDuration) || 0,
      completed: false,
      watchedPercentage: 0,
      notes: '',
    });
    setResTitle('');
    setResUrl('');
    setShowAddRes(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>
              {prepArea?.name || 'Area'} &gt; {course?.name || 'Course'} &gt; {subject?.name || 'Subject'} {chapter && `> ${chapter.name}`}
            </div>
            <h2 className="modal-title" style={{ fontSize: 18 }}>{topic.name}</h2>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
          {/* Status & Priority Badge Strip */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge ${topic.status === 'Completed' ? 'badge-success' : topic.status === 'Learning' || topic.status === 'In Progress' ? 'badge-info' : 'badge-muted'}`}>
              {topic.status || 'Not Started'}
            </span>
            <span className="badge badge-primary">
              Importance: {topic.importance || topic.priority || 'Medium'}
            </span>
            <span className="badge badge-warning">
              Difficulty: {topic.difficulty || 'Medium'}
            </span>
            <span className="badge badge-info">
              ⏱️ {topic.estimatedHours || 2}h ({(topic.estimatedHours || 2) * 60}m)
            </span>
          </div>

          {/* Details Grid */}
          <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 'var(--radius)', fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Resource / Chapter Ref:</span>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{topic.resourceReference || '—'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Completion:</span>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{topic.completionPercentage || topic.completionPercent || 0}%</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Date Started:</span>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{topic.dateStarted || '—'}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-3)', fontSize: 11 }}>Date Completed:</span>
              <div style={{ fontWeight: 600, marginTop: 2 }}>{topic.dateCompleted || '—'}</div>
            </div>
          </div>

          {/* Attached Study Resources Section */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={15} style={{ color: 'var(--primary)' }} />
                Study Resources ({topicResources.length})
              </div>
              <button className="btn btn-xs btn-ghost" onClick={() => setShowAddRes(!showAddRes)}>
                <Plus size={12} /> Add Resource
              </button>
            </div>

            {/* Add Resource Form */}
            {showAddRes && (
              <form onSubmit={handleSaveNewResource} style={{ background: 'var(--surface-3)', padding: 12, borderRadius: 'var(--radius)', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Resource title (e.g. Video Lecture 1, Class PDF)..."
                    className="form-input"
                    value={resTitle}
                    onChange={(e) => setResTitle(e.target.value)}
                    required
                  />
                  <select className="form-input" value={resType} onChange={(e) => setResType(e.target.value)}>
                    <option value="Video Lecture">Video Lecture</option>
                    <option value="PDF">PDF</option>
                    <option value="Notes">Notes</option>
                    <option value="Book">Book</option>
                    <option value="Practice Set">Practice Set</option>
                    <option value="MCQ">MCQ</option>
                    <option value="External Link">External Link</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="URL / link (optional)..."
                    className="form-input"
                    value={resUrl}
                    onChange={(e) => setResUrl(e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Min"
                    className="form-input"
                    value={resDuration}
                    onChange={(e) => setResDuration(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <button type="button" className="btn btn-xs btn-ghost" onClick={() => setShowAddRes(false)}>Cancel</button>
                  <button type="submit" className="btn btn-xs btn-primary">Save Resource</button>
                </div>
              </form>
            )}

            {/* Resources List */}
            {topicResources.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '10px 0' }}>
                No study resources attached yet. Click "+ Add Resource" to track lectures, notes, or PDFs.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topicResources.map((res) => {
                  const Icon = RESOURCE_ICONS[res.resourceType] || FileText;
                  return (
                    <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <button
                          onClick={() => onToggleResource(res.id, !res.completed, res.watchedPercentage)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: res.completed ? 'var(--success)' : 'var(--text-3)', padding: 0 }}
                        >
                          {res.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                        </button>
                        <Icon size={15} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, color: res.completed ? 'var(--text-2)' : 'var(--text)', textDecoration: res.completed ? 'line-through' : 'none' }} className="truncate">
                            {res.title}
                          </span>
                          <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                            {res.resourceType} {res.durationMinutes > 0 && `· ${res.durationMinutes}m`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {res.url && (
                          <a href={res.url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-light)', display: 'flex', alignItems: 'center' }} title="Open resource link">
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <button className="btn btn-xs btn-ghost" onClick={() => onDeleteResource(res.id)} style={{ color: 'var(--danger)', padding: 4 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mock Error Analysis Linked */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BarChart3 size={15} style={{ color: 'var(--danger)' }} />
              Mock Test Error History ({topicErrors.length})
            </div>
            {topicErrors.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--success)', background: 'var(--surface)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                ✅ No errors recorded on this topic in mock tests.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topicErrors.map((err) => {
                  const mock = allMocks.find((m) => m.id === err.mockTestId);
                  return (
                    <div key={err.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--danger-glass)', border: '1px solid var(--danger)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                      <span>Mock #{mock?.mockNumber || err.mockTestId} ({mock?.examName || 'Mock'})</span>
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{err.errorType}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revision Intelligence Linked */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RotateCcw size={15} style={{ color: 'var(--primary)' }} />
              Revision Tasks &amp; Spaced Repetition ({topicRevisions.length})
            </div>
            {topicRevisions.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-3)', background: 'var(--surface)', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
                No revision tasks currently scheduled for this topic.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {topicRevisions.map((rev) => (
                  <div key={rev.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
                    <span>Revision #{rev.revisionNumber || 1} · Due {rev.dueDate}</span>
                    <span className={`badge ${rev.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>{rev.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <button
              className={`btn ${isCompleted ? 'btn-ghost' : 'btn-primary'}`}
              onClick={() => onStatusChange(topic, isCompleted ? 'In Progress' : 'Completed')}
              style={{ flex: 1 }}
            >
              {isCompleted ? 'Mark In Progress' : 'Mark Completed'}
            </button>
            <button className="btn btn-ghost" onClick={() => onEdit(topic)}>
              <Edit2 size={14} /> Edit
            </button>
            <button
              className="btn btn-ghost"
              style={{ color: 'var(--danger)' }}
              onClick={() => {
                if (confirm(`Delete topic "${topic.name}"?`)) onDelete(topic.id);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddEditTopicModal({ initialTopic, defaultContext = {}, currentAreaId, subjects, chapters, courses, allTopics, onClose, onSave }) {
  const [name, setName] = useState(initialTopic?.name || '');
  const [subjectId, setSubjectId] = useState(initialTopic?.subjectId || defaultContext.subjectId || subjects[0]?.id || '');
  const [chapterId, setChapterId] = useState(initialTopic?.chapterId || defaultContext.chapterId || '');
  const [courseId, setCourseId] = useState(initialTopic?.courseId || defaultContext.courseId || courses[0]?.id || '');
  const [estimatedHours, setEstimatedHours] = useState(initialTopic?.estimatedHours || (initialTopic?.estimatedMinutes ? initialTopic.estimatedMinutes / 60 : 2));
  const [difficulty, setDifficulty] = useState(initialTopic?.difficulty || 'Medium');
  const [importance, setImportance] = useState(initialTopic?.importance || initialTopic?.priority || 'High');
  const [status, setStatus] = useState(initialTopic?.status || 'Not Started');
  const [resourceReference, setResourceReference] = useState(initialTopic?.resourceReference || '');
  const [notes, setNotes] = useState(initialTopic?.notes || '');

  // Filter chapters by selected subject
  const availableChapters = chapters.filter((c) => c.subjectId === Number(subjectId));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a topic name.');
    if (!subjectId) return alert('Please select a subject.');

    onSave({
      name: name.trim(),
      preparationAreaId: currentAreaId,
      subjectId: Number(subjectId),
      chapterId: chapterId ? Number(chapterId) : null,
      courseId: courseId ? Number(courseId) : null,
      estimatedHours: Number(estimatedHours) || 2,
      estimatedMinutes: (Number(estimatedHours) || 2) * 60,
      difficulty,
      importance,
      priority: importance,
      status,
      resourceReference: resourceReference.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialTopic ? 'Edit Topic' : 'Add New Topic'}</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label className="form-label">Topic Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Normalization (1NF to BCNF)"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Subject *</label>
              <select
                className="form-input"
                value={subjectId}
                onChange={(e) => { setSubjectId(e.target.value); setChapterId(''); }}
                required
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Chapter / Module (Optional)</label>
              <select
                className="form-input"
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
              >
                <option value="">No Chapter (Direct)</option>
                {availableChapters.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Est. Hours</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                className="form-input"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Difficulty</label>
              <select className="form-input" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Very Hard">Very Hard</option>
              </select>
            </div>

            <div>
              <label className="form-label">Importance</label>
              <select className="form-input" value={importance} onChange={(e) => setImportance(e.target.value)}>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Course Source</label>
              <select className="form-input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">No Course Mapped</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Initial Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Not Started">Not Started</option>
                <option value="Learning">Learning</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Resource / Lesson Reference</label>
            <input
              type="text"
              className="form-input"
              value={resourceReference}
              onChange={(e) => setResourceReference(e.target.value)}
              placeholder="e.g. Adda247 MahaPack Chapter 3 / Video 12"
            />
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key concepts, formulas, or reminders..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">{initialTopic ? 'Update Topic' : 'Add Topic'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddChapterModal({ currentAreaId, subjectId, courses, onClose, onSave }) {
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a chapter name.');
    onSave({
      preparationAreaId: currentAreaId,
      subjectId,
      courseId: courseId ? Number(courseId) : null,
      name: name.trim(),
      description: description.trim(),
      order: 0,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Chapter / Module</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label className="form-label">Chapter / Module Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Relational Database Design, Process Management"
              required
            />
          </div>

          {courses.length > 0 && (
            <div>
              <label className="form-label">Course (Optional)</label>
              <select className="form-input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">No Course Specific</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional module description..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Chapter</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddSubjectModal({ currentAreaId, courses, onClose, onSave }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [courseId, setCourseId] = useState('');

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a subject name.');

    onSave({
      name: name.trim(),
      preparationAreaId: currentAreaId,
      courseId: courseId ? Number(courseId) : null,
      color,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Subject</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label className="form-label">Subject Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operating System, Reasoning"
              required
            />
          </div>

          {courses.length > 0 && (
            <div>
              <label className="form-label">Course (Optional)</label>
              <select className="form-input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">No Course / Generic</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="form-label">Color Theme</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: 24, height: 24, borderRadius: '50%', background: c,
                    border: color === c ? '2px solid white' : 'none', cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Subject</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCourseModal({ currentAreaId, onClose, onSave }) {
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [status, setStatus] = useState('Active');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter a course name.');

    onSave({
      name: name.trim(),
      provider: provider.trim() || name.trim(),
      platform: provider.trim() || name.trim(),
      status,
      description: description.trim(),
      preparationAreaId: currentAreaId,
      color: '#6366f1',
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Course / Resource</h2>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label className="form-label">Course Name *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adda247 MahaPack, YourStudy Course"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Provider</label>
              <input
                type="text"
                className="form-input"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. Adda247, Testbook"
              />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Not Started">Not Started</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional course notes..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Course</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkImportModal({ prepAreas, courses, subjects, chapters, topics, defaultAreaId, onClose, onImportSuccess }) {
  const [importText, setImportText] = useState('');
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip'); // 'skip', 'update', 'create'
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);

  const defaultArea = prepAreas.find((a) => a.id === defaultAreaId) || prepAreas[0];

  const handleDownloadJSONTemplate = () => {
    const jsonStr = generateSyllabusTemplateJSON(defaultArea?.name || 'Panchayat', 'YourStudy');
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllabus-template-${defaultArea?.name || 'import'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSVTemplate = () => {
    const csvStr = generateSyllabusTemplateCSV(defaultArea?.name || 'Panchayat', 'YourStudy');
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `syllabus-template-${defaultArea?.name || 'import'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleValidate = () => {
    const result = validateSyllabusJSON(importText, prepAreas, courses, subjects, topics, chapters);
    setPreview(result);
  };

  const handleConfirmImport = async () => {
    if (!preview || !preview.valid) return;
    setImporting(true);
    try {
      const res = await executeSyllabusImport(preview, duplicateStrategy);
      alert(`✅ Successfully imported ${res.addedSubjects} subjects, ${res.addedChapters} chapters, and ${res.addedTopics} topics!`);
      onImportSuccess();
    } catch (err) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Bulk Syllabus Import (JSON &amp; CSV)</h2>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>Import 5-tier structured syllabus with validation, duplicate detection, and safe merge</p>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
          {/* Template Download Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>Download Sample Templates:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-xs btn-ghost" onClick={handleDownloadJSONTemplate}>
                <Download size={11} /> JSON Template
              </button>
              <button className="btn btn-xs btn-ghost" onClick={handleDownloadCSVTemplate}>
                <Download size={11} /> CSV Template
              </button>
            </div>
          </div>

          {/* Textarea */}
          <div>
            <label className="form-label">Paste JSON or CSV Syllabus Data:</label>
            <textarea
              className="form-input"
              rows={8}
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setPreview(null); }}
              placeholder={`Paste valid JSON or CSV content here...\n\nExample JSON:\n{\n  "preparationArea": "Panchayat",\n  "course": "YourStudy",\n  "subjects": [\n    {\n      "name": "General Studies",\n      "chapters": [\n        { "name": "Polity", "topics": [{ "name": "73rd Amendment", "estimatedHours": 3 }] }\n      ]\n    }\n  ]\n}`}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
          </div>

          {/* Duplicate Strategy Option */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '10px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Duplicate Topic Handling:</span>
            <select
              value={duplicateStrategy}
              onChange={(e) => setDuplicateStrategy(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', borderRadius: 4, background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)' }}
            >
              <option value="skip">Skip duplicates (Safe default)</option>
              <option value="update">Update existing topics</option>
              <option value="create">Create as new</option>
            </select>
          </div>

          <button className="btn btn-ghost" onClick={handleValidate} disabled={!importText.trim()}>
            🔍 Validate &amp; Preview Import
          </button>

          {/* Validation & Preview Panel */}
          {preview && (
            <div style={{ border: `1px solid ${preview.valid ? 'var(--success)' : 'var(--danger)'}`, borderRadius: 'var(--radius)', padding: '14px 16px', background: preview.valid ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)' }}>
              {!preview.valid ? (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>❌ Validation Error:</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{preview.error}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>
                    ✅ Valid Syllabus Data Structure
                  </div>
                  <div style={{ fontSize: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                    <div>Target Area: <strong>{preview.targetArea.name}</strong></div>
                    <div>Course: <strong>{preview.courseName || 'None'}</strong> {preview.isNewCourse && '(New)'}</div>
                    <div>New Subjects to Add: <strong>{preview.summary.newSubjectsCount}</strong></div>
                    <div>New Chapters to Add: <strong>{preview.summary.newChaptersCount}</strong></div>
                    <div>New Topics to Add: <strong>{preview.summary.newTopicsCount}</strong></div>
                    <div>Duplicates Detected: <strong>{preview.duplicatesDetected.length}</strong> ({duplicateStrategy})</div>
                  </div>

                  {preview.duplicatesDetected.length > 0 && (
                    <div style={{ background: 'var(--warning-glass)', border: '1px solid var(--warning)', borderRadius: 6, padding: '8px 12px', fontSize: 11, marginBottom: 12 }}>
                      <div style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 2 }}>
                        ⚠️ {preview.duplicatesDetected.length} Duplicates ({duplicateStrategy === 'skip' ? 'will be skipped' : duplicateStrategy === 'update' ? 'will be updated' : 'will be duplicated'}):
                      </div>
                      {preview.duplicatesDetected.slice(0, 5).map((d, i) => (
                        <div key={i} style={{ color: 'var(--text-2)' }}>
                          • [{d.subjectName}] {d.topicName}
                        </div>
                      ))}
                      {preview.duplicatesDetected.length > 5 && (
                        <div style={{ color: 'var(--text-3)', marginTop: 2 }}>
                          +{preview.duplicatesDetected.length - 5} more duplicates...
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmImport}
                    disabled={importing || (preview.summary.newTopicsCount === 0 && duplicateStrategy === 'skip')}
                    style={{ width: '100%' }}
                  >
                    {importing ? '⏳ Merging Syllabus...' : `Confirm & Merge ${preview.summary.newTopicsCount} Topics`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
