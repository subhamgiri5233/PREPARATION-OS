import { useEffect, useState } from 'react';
import { Save, Download, ArrowUp, ArrowDown, BookMarked, BookOpen, Target, Sparkles, Check } from 'lucide-react';
import {
  getSettings, updateSettings, getAllAreas, updateArea,
  getAllCourses, getAllSubjects, getAllChapters, getAllTopics, getAllStudyResources,
  getAllSessions, getAllMocks, getAllMockSubjectResults, getErrorLogs,
  getAllVocab, getPendingRevisions, getAllTasks, getAllGitaShlokas
} from '../services/db';
import { useAppStore } from '../store/useAppStore';
import {
  getVocabDailyTarget, setVocabDailyTarget,
  getGitaDailyTarget, setGitaDailyTarget
} from '../services/dailyTargetService';

export default function Settings() {
  const { setSettings } = useAppStore();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [areas, setAreas] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await getSettings();
      const a = await getAllAreas();
      const initialForm = s || {};
      // Ensure daily targets fall back to user's saved personal choices
      if (!initialForm.vocabDailyTarget) {
        initialForm.vocabDailyTarget = getVocabDailyTarget();
      }
      if (!initialForm.gitaDailyTarget) {
        initialForm.gitaDailyTarget = getGitaDailyTarget();
      }
      setForm(initialForm);
      setAreas((a || []).sort((a1, a2) => (a2.weight || 0) - (a1.weight || 0)));
    } catch (err) {
      console.error('[Settings] loadSettings error:', err);
      setForm({
        userName: 'Subham',
        dailyStudyHours: 8,
        vocabDailyTarget: getVocabDailyTarget(),
        gitaDailyTarget: getGitaDailyTarget(),
        preferredStartTime: '06:00',
        preferredEndTime: '22:00',
        notificationsEnabled: true,
        browserNotifications: true,
        gitaReminderEnabled: true
      });
    }
  };

  const handleSave = async () => {
    if (!form) return;
    const { id, _id, ...updates } = form;

    // Persist daily learning goals locally and via broadcast
    if (form.vocabDailyTarget) {
      setVocabDailyTarget(form.vocabDailyTarget);
    }
    if (form.gitaDailyTarget) {
      setGitaDailyTarget(form.gitaDailyTarget);
    }

    try {
      await updateSettings(updates);
    } catch (e) {
      console.warn('[Settings] DB update warning:', e);
    }

    // Save area weights
    for (const a of areas) {
      if (a.id || a._id) {
        try {
          await updateArea(a.id || a._id, { weight: a.weight });
        } catch (_) {}
      }
    }

    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const moveArea = (index, direction) => {
    const newAreas = [...areas];
    if (direction === -1 && index > 0) {
      const temp = newAreas[index - 1];
      newAreas[index - 1] = newAreas[index];
      newAreas[index] = temp;
    } else if (direction === 1 && index < newAreas.length - 1) {
      const temp = newAreas[index + 1];
      newAreas[index + 1] = newAreas[index];
      newAreas[index] = temp;
    }
    const updatedWithWeights = newAreas.map((a, i) => ({ ...a, weight: 10 - i }));
    setAreas(updatedWithWeights);
  };

  const handleExport = async () => {
    try {
      const [allAreas, courses, subjects, chapters, topics, resources, sessions,
        mocks, mockResults, errorLog, vocab, revisions, tasks, gitaShlokas] = await Promise.all([
        getAllAreas(), getAllCourses(), getAllSubjects(), getAllChapters(), getAllTopics(),
        getAllStudyResources(), getAllSessions(), getAllMocks(), getAllMockSubjectResults(),
        getErrorLogs(), getAllVocab(), getPendingRevisions(), getAllTasks(), getAllGitaShlokas()
      ]);
      const data = {
        exportedAt: new Date().toISOString(),
        version: 8,
        settings: form,
        preparationAreas: allAreas,
        courses,
        subjects,
        chapters,
        topics,
        studyResources: resources,
        studySessions: sessions,
        mockTests: mocks,
        mockSubjectResults: mockResults,
        errorLog,
        vocabulary: vocab,
        revisionTasks: revisions,
        studyTasks: tasks,
        gitaShlokas,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `focusos-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[Settings] Export error:', err);
    }
  };

  if (!form) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  const setF = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Personalize your routine, daily learning quotas, and system preferences</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleExport}>
            <Download size={14} /> Export Data
          </button>
          <button className={`btn ${saved ? 'btn-success' : 'btn-primary'}`} onClick={handleSave}>
            {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Settings</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">👤 User Profile</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                className="form-input"
                value={form.userName || ''}
                onChange={(e) => setF('userName', e.target.value)}
                placeholder="Your name"
              />
            </div>
          </div>
        </div>

        {/* Daily Learning Goals */}
        <div className="card" style={{ border: '1px solid var(--border-accent)' }}>
          <div className="card-header">
            <div className="card-title" style={{ color: 'var(--primary-light)' }}>
              <Target size={16} /> Daily Learning Goals
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>
            Set custom daily targets for vocabulary building and Gita study sessions.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Vocabulary Daily Quota */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookMarked size={13} color="var(--primary)" /> Vocabulary Daily Target
                </label>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>
                  {form.vocabDailyTarget ? `${form.vocabDailyTarget} words / day` : 'Untracked'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
                Set your daily new words target. Leave empty for open-ended practice.
              </p>
              <input
                type="number"
                className="form-input"
                value={form.vocabDailyTarget ?? ''}
                min={1}
                max={500}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10));
                  setF('vocabDailyTarget', val);
                }}
                placeholder="e.g. 10"
              />
            </div>

            {/* Gita Daily Quota */}
            <div className="form-group" style={{ paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={13} color="var(--primary)" /> Gita Shlokas Daily Target
                </label>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary-light)' }}>
                  {form.gitaDailyTarget ? `${form.gitaDailyTarget} shloka${form.gitaDailyTarget > 1 ? 's' : ''} / day` : 'Untracked'}
                </span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-3)', margin: 0 }}>
                Set your daily shlokas target. Leave empty for open-ended practice.
              </p>
              <input
                type="number"
                className="form-input"
                value={form.gitaDailyTarget ?? ''}
                min={1}
                max={100}
                onChange={(e) => {
                  const val = e.target.value === '' ? null : Math.max(1, parseInt(e.target.value, 10));
                  setF('gitaDailyTarget', val);
                }}
                placeholder="e.g. 2"
              />
            </div>

            {/* Daily Study Hours */}
            <div className="form-group" style={{ paddingTop: 6, borderTop: '1px solid var(--border)' }}>
              <label className="form-label">Daily Study Hours Target</label>
              <input
                type="number"
                className="form-input"
                value={form.dailyStudyHours || 8}
                min={1}
                max={18}
                step={0.5}
                onChange={(e) => setF('dailyStudyHours', parseFloat(e.target.value) || 1)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Preferred Start Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.preferredStartTime || '06:00'}
                  onChange={(e) => setF('preferredStartTime', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Preferred End Time</label>
                <input
                  type="time"
                  className="form-input"
                  value={form.preferredEndTime || '22:00'}
                  onChange={(e) => setF('preferredEndTime', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preparation Priorities */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏆 Preparation Priorities</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
              Rank your preparation areas. Higher ranked areas will receive priority when generating daily study plans.
            </p>
            {areas.map((area, index) => (
              <div key={area.id || area._id || index} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: area.color || 'var(--primary)' }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{area.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => moveArea(index, -1)} disabled={index === 0}>
                    <ArrowUp size={14} />
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => moveArea(index, 1)} disabled={index === areas.length - 1}>
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revision Schedule */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔄 Revision Schedule</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Spaced repetition intervals (days after topic completion)
            </p>
            {(form.revisionIntervals || [1, 3, 7, 14, 30]).map((interval, i) => (
              <div key={i} className="form-group">
                <label className="form-label">Revision {i + 1}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    className="form-input"
                    value={interval}
                    min={1}
                    onChange={(e) => {
                      const updated = [...(form.revisionIntervals || [1, 3, 7, 14, 30])];
                      updated[i] = parseInt(e.target.value, 10);
                      setF('revisionIntervals', updated);
                    }}
                    style={{ width: 80 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-2)' }}>days after completion</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🔔 Notifications & Reminders</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ToggleSetting
              label="Enable Notifications"
              value={form.notificationsEnabled !== false}
              onChange={(v) => setF('notificationsEnabled', v)}
            />
            <ToggleSetting
              label="Browser Notifications"
              value={form.browserNotifications !== false}
              onChange={(v) => setF('browserNotifications', v)}
            />
            <ToggleSetting
              label="Daily Gita Shloka Reminder"
              value={form.gitaReminderEnabled !== false}
              onChange={(v) => setF('gitaReminderEnabled', v)}
            />
            <div className="form-group">
              <label className="form-label">Daily Summary Time</label>
              <input
                type="time"
                className="form-input"
                value={form.dailySummaryTime || '21:00'}
                onChange={(e) => setF('dailySummaryTime', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Revision Reminder Time</label>
              <input
                type="time"
                className="form-input"
                value={form.revisionReminderTime || '08:00'}
                onChange={(e) => setF('revisionReminderTime', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <div className="card-title">💾 Data Management & Backup</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-ghost" onClick={handleExport}>
              <Download size={14} /> Export All Data (JSON)
            </button>
            <div style={{ flex: 1, minWidth: 240 }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
                All your study routines, vocabulary, Gita reflections, and progress data can be exported anytime as a complete JSON backup.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: value ? 'var(--primary)' : 'var(--surface-3)',
          position: 'relative',
          transition: 'var(--transition)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 18,
          height: 18,
          borderRadius: 9,
          background: 'white',
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          transition: 'var(--transition)',
        }} />
      </button>
    </div>
  );
}
