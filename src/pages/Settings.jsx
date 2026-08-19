import { useEffect, useState } from 'react';
import { Save, Download, RotateCcw, ArrowUp, ArrowDown, Lock, Unlock, ShieldCheck, KeyRound } from 'lucide-react';
import { getSettings, updateSettings, getAllAreas, updateArea,
  getAllCourses, getAllSubjects, getAllChapters, getAllTopics, getAllStudyResources,
  getAllSessions, getAllMocks, getAllMockSubjectResults, getErrorLogs,
  getAllVocab, getPendingRevisions, getAllTasks, getAllGitaShlokas
} from '../services/db';
import { useAppStore } from '../store/useAppStore';
import { useAuthStore } from '../store/useAuthStore';
import { updateMasterPin, updateAuthSettings } from '../services/authService';
import { requireEditPermission, canEdit } from '../services/mutationGuard.js';

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
    if (!canEdit()) {
      requireEditPermission('save settings');
      return;
    }
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

        {/* Security & Authentication */}
        <SecuritySettingsCard />

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

function SecuritySettingsCard() {
  const { isAuthenticated, lock, openLoginModal, privacyMode, ownerName } = useAuthStore();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(privacyMode || 'privacy');

  const handleUpdatePin = async (e) => {
    e.preventDefault();
    if (!canEdit()) {
      requireEditPermission('update master PIN');
      return;
    }
    if (newPin.length < 4) {
      setError('New PIN must be at least 4 digits/characters.');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setMsg('');
    try {
      await updateMasterPin(currentPin, newPin);
      setMsg('✅ Master PIN updated successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setError(err.message || 'Failed to update PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (newMode) => {
    if (!canEdit()) {
      requireEditPermission('change privacy mode');
      return;
    }
    setMode(newMode);
    try {
      await updateAuthSettings({ privacyMode: newMode });
      setMsg(`Mode updated to ${newMode === 'lockdown' ? 'Full Lockdown' : 'Privacy Protection'}`);
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="card" style={{ gridColumn: '1 / -1' }}>
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="var(--primary-light)" /> 🔐 Security, Authentication & Privacy Protection
        </div>
        {isAuthenticated ? (
          <button className="btn btn-xs btn-ghost" onClick={lock} style={{ color: 'var(--warning)' }}>
            <Lock size={12} /> Lock Workspace Now
          </button>
        ) : (
          <button className="btn btn-xs btn-primary" onClick={openLoginModal}>
            <Unlock size={12} /> Unlock Workspace
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {/* Left Column: Privacy Mode Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            Public Visitor Protection Mode
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-2)', margin: 0 }}>
            Control what visitors who open your website link can see when you are not logged in.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
              borderRadius: 'var(--radius)', background: 'var(--surface-2)',
              border: `1px solid ${mode === 'privacy' ? 'var(--primary)' : 'var(--border)'}`,
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="privacyMode"
                checked={mode === 'privacy'}
                onChange={() => handleModeChange('privacy')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  🛡️ Privacy Mode (Recommended)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  Visitors can see general study routine hours & streak, but all specific study topic names, notes, and reflections are locked and masked.
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px',
              borderRadius: 'var(--radius)', background: 'var(--surface-2)',
              border: `1px solid ${mode === 'lockdown' ? 'var(--primary)' : 'var(--border)'}`,
              cursor: 'pointer'
            }}>
              <input
                type="radio"
                name="privacyMode"
                checked={mode === 'lockdown'}
                onChange={() => handleModeChange('lockdown')}
                style={{ marginTop: 2 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  🔒 Full Lockdown
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                  Entire application is restricted. Anyone visiting must enter Master PIN to access anything.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Right Column: Change Master PIN */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Change Master PIN / Password
          </div>

          {msg && (
            <div style={{ background: 'var(--success-glass)', color: 'var(--success)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 10 }}>
              {msg}
            </div>
          )}
          {error && (
            <div style={{ background: 'var(--danger-glass)', color: 'var(--danger)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, marginBottom: 10 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleUpdatePin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: 11 }}>Current PIN (if already set)</label>
              <input
                type="password"
                className="form-input form-input-sm"
                placeholder="Current PIN (Default is 1234)"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>New Master PIN *</label>
                <input
                  type="password"
                  className="form-input form-input-sm"
                  placeholder="New PIN (min 4 digits)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 11 }}>Confirm New PIN *</label>
                <input
                  type="password"
                  className="form-input form-input-sm"
                  placeholder="Confirm New PIN"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={loading}
              style={{ alignSelf: 'flex-start', marginTop: 4 }}
            >
              {loading ? 'Updating...' : 'Update Master PIN'}
            </button>
          </form>
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
