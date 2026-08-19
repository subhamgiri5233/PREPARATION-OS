// src/pages/Settings.jsx
import { useEffect, useState } from 'react';
import { Save, Download, RotateCcw } from 'lucide-react';
import { getSettings, updateSettings, getAllAreas, updateArea,
  getAllCourses, getAllSubjects, getAllChapters, getAllTopics, getAllStudyResources,
  getAllSessions, getAllMocks, getAllMockSubjectResults, getErrorLogs,
  getAllVocab, getPendingRevisions, getAllTasks, getAllGitaShlokas
} from '../services/db';
import { useAppStore } from '../store/useAppStore';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function Settings() {
  const { setSettings } = useAppStore();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  const [areas, setAreas] = useState([]);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    const a = await getAllAreas();
    setForm(s);
    setAreas(a.sort((a1, a2) => (a2.weight || 0) - (a1.weight || 0)));
  };

  const handleSave = async () => {
    // Strip the DB id from the form before saving
    const { id, ...updates } = form;
    await updateSettings(updates);
    
    // Save area weights
    for (const a of areas) {
      await updateArea(a.id, { weight: a.weight });
    }
    
    setSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    // Re-assign weights based on new order (highest at top)
    const updatedWithWeights = newAreas.map((a, i) => ({ ...a, weight: 10 - i }));
    setAreas(updatedWithWeights);
  };

  const handleExport = async () => {
    const [areas, courses, subjects, chapters, topics, resources, sessions,
      mocks, mockResults, errorLog, vocab, revisions, tasks, gitaShlokas] = await Promise.all([
      getAllAreas(), getAllCourses(), getAllSubjects(), getAllChapters(), getAllTopics(),
      getAllStudyResources(), getAllSessions(), getAllMocks(), getAllMockSubjectResults(),
      getErrorLogs(), getAllVocab(), getPendingRevisions(), getAllTasks(), getAllGitaShlokas()
    ]);
    const data = {
      exportedAt: new Date().toISOString(),
      version: 7,
      settings: form,
      preparationAreas: areas,
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
    a.download = `prepOS-backup-v7-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!form) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  const setF = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your Preparation OS experience</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleExport}>
            <Download size={14} /> Export Data
          </button>
          <button className={`btn ${saved ? 'btn-success' : 'btn-primary'}`} onClick={handleSave}>
            {saved ? '✓ Saved!' : <><Save size={14} /> Save Settings</>}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Profile */}
        <div className="card">
          <div className="card-header"><div className="card-title">👤 Profile</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" value={form.userName || ''} onChange={(e) => setF('userName', e.target.value)} placeholder="Your name" />
            </div>
          </div>
        </div>

        {/* Study Targets */}
        <div className="card">
          <div className="card-header"><div className="card-title">🎯 Study Targets</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Daily Study Hours Target</label>
              <input type="number" className="form-input" value={form.dailyStudyHours || 8} min={1} max={16}
                onChange={(e) => setF('dailyStudyHours', parseFloat(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Vocabulary Daily Target</label>
              <input type="number" className="form-input" value={form.vocabDailyTarget || 10} min={1} max={50}
                onChange={(e) => setF('vocabDailyTarget', parseInt(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Study Start Time</label>
              <input type="time" className="form-input" value={form.preferredStartTime || '06:00'}
                onChange={(e) => setF('preferredStartTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Preferred Study End Time</label>
              <input type="time" className="form-input" value={form.preferredEndTime || '22:00'}
                onChange={(e) => setF('preferredEndTime', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Preparation Priorities */}
        <div className="card">
          <div className="card-header"><div className="card-title">🏆 Preparation Priorities</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 8 }}>
              Rank your preparation areas. Higher ranked areas will receive priority when generating daily study plans.
            </p>
            {areas.map((area, index) => (
              <div key={area.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: area.color }} />
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

        {/* Revision Settings */}
        <div className="card">
          <div className="card-header"><div className="card-title">🔄 Revision Schedule</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Spaced repetition intervals (days after topic completion)
            </p>
            {(form.revisionIntervals || [1, 3, 7, 14, 30]).map((interval, i) => (
              <div key={i} className="form-group">
                <label className="form-label">Revision {i + 1}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number" className="form-input" value={interval} min={1}
                    onChange={(e) => {
                      const updated = [...(form.revisionIntervals || [1, 3, 7, 14, 30])];
                      updated[i] = parseInt(e.target.value);
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
          <div className="card-header"><div className="card-title">🔔 Notifications</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ToggleSetting
              label="Enable Notifications"
              value={form.notificationsEnabled}
              onChange={(v) => setF('notificationsEnabled', v)}
            />
            <ToggleSetting
              label="Browser Notifications"
              value={form.browserNotifications}
              onChange={(v) => setF('browserNotifications', v)}
            />
            <ToggleSetting
              label="Daily Gita Shloka Reminder"
              value={form.gitaReminderEnabled !== false}
              onChange={(v) => setF('gitaReminderEnabled', v)}
            />
            <div className="form-group">
              <label className="form-label">Daily Summary Time</label>
              <input type="time" className="form-input" value={form.dailySummaryTime || '21:00'}
                onChange={(e) => setF('dailySummaryTime', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Revision Reminder Time</label>
              <input type="time" className="form-input" value={form.revisionReminderTime || '08:00'}
                onChange={(e) => setF('revisionReminderTime', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Smart Pre-Study Reminders */}
        <div className="card">
          <div className="card-header"><div className="card-title">⏰ Study Session Reminders</div></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
              Automatically receive pre-study alerts and missed session notifications for your scheduled tasks.
            </p>
            <ToggleSetting
              label="Enable Study Reminders"
              value={form.studyRemindersEnabled !== false}
              onChange={(v) => setF('studyRemindersEnabled', v)}
            />
            <div className="form-group">
              <label className="form-label">Reminder Before Session</label>
              <select
                className="form-input"
                value={form.studyReminderMinutes !== undefined ? form.studyReminderMinutes : 5}
                onChange={(e) => setF('studyReminderMinutes', parseInt(e.target.value, 10))}
              >
                <option value={5}>5 minutes before (Default)</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={0}>Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header"><div className="card-title">💾 Data Management</div></div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={handleExport}>
              <Download size={14} /> Export All Data (JSON)
            </button>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>
                All data is stored locally in your browser's IndexedDB. Export regularly to create a backup.
                Your data persists across browser sessions.
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
      <span style={{ fontSize: 13 }}>{label}</span>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? 'var(--primary)' : 'var(--surface-3)',
          position: 'relative', transition: 'var(--transition)', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 18, height: 18, borderRadius: 9, background: 'white',
          position: 'absolute', top: 3, left: value ? 23 : 3,
          transition: 'var(--transition)',
        }} />
      </button>
    </div>
  );
}
