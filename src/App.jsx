// src/App.jsx
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Preparation from './pages/Preparation';
import StudyPlanner from './pages/StudyPlanner';
import StudySessions from './pages/StudySessions';
import MockTests from './pages/MockTests';
import Revision from './pages/Revision';
import Vocabulary from './pages/Vocabulary';
import Progress from './pages/Progress';
import Analytics from './pages/Analytics';
import GitaShloka from './pages/GitaShloka';
import Notifications from './pages/Notifications';
import TeachingSchedule from './pages/TeachingSchedule';
import Settings from './pages/Settings';
import TestRunner from './pages/TestRunner';
import {
  initializeDatabase, getAllAreas, getAllCourses, getAllSubjects, getAllChapters, getAllTopics, getAllStudyResources,
  getSettings, getTeachingSchedule, getUnreadNotifications, addNotification
} from './services/db';
import { getRevisionsDueToday } from './services/revisionService';
import { useAppStore } from './store/useAppStore';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '60vh', gap: 16, padding: 32, textAlign: 'center', color: 'var(--text)'
        }}>
          <div style={{ fontSize: 44 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong loading this view</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 460 }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            className="btn btn-primary"
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Module-level guard: prevents generateDailyNotifications() from running
 * more than once per session (guards against React StrictMode double-invoke).
 */
let _notificationsGenerated = false;

/**
 * Generates daily contextual notifications based on the current app state.
 * Called once on startup. Uses deduplication in addNotification to avoid repeats.
 */
async function generateDailyNotifications() {
  if (_notificationsGenerated) return;
  _notificationsGenerated = true;
  const today = new Date().toISOString().slice(0, 10);

  // Check revisions due today
  const revisionsDue = await getRevisionsDueToday();
  if (revisionsDue.length > 0) {
    const notifMsg = (() => {
      const uniqueNames = [...new Set(revisionsDue.map((r) => r.topicName || `Topic #${r.topicId}`))];
      const shown = uniqueNames.slice(0, 3).join(', ');
      const extra = uniqueNames.length > 3 ? ` and ${uniqueNames.length - 3} more` : '';
      return shown + extra;
    })();

    await addNotification({
      type: 'revision',
      title: `${revisionsDue.length} Revision${revisionsDue.length > 1 ? 's' : ''} Due Today`,
      message: notifMsg,
      scheduledAt: new Date().toISOString(),
      idempotencyKey: `revisions-due-${today}`
    });

    // Real Native Device Notification
    const { sendNativeNotification } = await import('./services/nativeNotificationService');
    sendNativeNotification({
      title: `🎯 ${revisionsDue.length} Revision${revisionsDue.length > 1 ? 's' : ''} Due Today`,
      body: notifMsg,
      url: '/revision',
      tag: `revisions-${today}`
    }).catch(() => {});
  }

  // Daily vocabulary reminder
  const { getVocabByDate, getTodayGitaShloka } = await import('./services/db');
  const todayVocab = await getVocabByDate(today);
  const settings = await getSettings();
  const vocabTarget = settings?.vocabDailyTarget || 10;
  if (todayVocab.length < vocabTarget) {
    await addNotification({
      type: 'vocabulary',
      title: 'Daily Vocabulary Target Pending',
      message: `${todayVocab.length}/${vocabTarget} words learned today. Keep going!`,
      scheduledAt: new Date().toISOString(),
      idempotencyKey: `vocabulary-target-${today}`
    });
  }

  // Daily Gita Shloka reminder
  const todayGita = await getTodayGitaShloka();
  if (!todayGita && settings?.gitaReminderEnabled !== false) {
    await addNotification({
      type: 'gita',
      title: 'Daily Gita Shloka Reminder',
      message: "Today's Gita Shloka is waiting for you.",
      scheduledAt: new Date().toISOString(),
      idempotencyKey: `gita-reminder-${today}`
    });
  }
}

export default function App() {
  const {
    setPreparationAreas, setCourses, setSubjects, setChapters, setTopics, setStudyResources, setSettings,
    setTeachingSchedule, setUnreadCount, setDbReady, isDbReady
  } = useAppStore();

  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initializeDatabase();
      } catch (e) {
        console.error('[App] API server unreachable:', e.message);
        setApiError(true);
        return;
      }

      try {
        // Load global data into store
        const [areas, courses, subjects, chapters, topics, resources, settings, schedule, unread] = await Promise.all([
          getAllAreas(),
          getAllCourses(),
          getAllSubjects(),
          getAllChapters(),
          getAllTopics(),
          getAllStudyResources(),
          getSettings(),
          getTeachingSchedule(),
          getUnreadNotifications(),
        ]);

        setPreparationAreas(areas);
        setCourses(courses);
        setSubjects(subjects);
        setChapters(chapters);
        setTopics(topics);
        setStudyResources(resources);
        setSettings(settings);
        setTeachingSchedule(schedule);
        setUnreadCount(unread.length);
        setDbReady(true);

        // Generate daily notifications after data is loaded
        try {
          await generateDailyNotifications();
          const freshUnread = await getUnreadNotifications();
          setUnreadCount(freshUnread.length);
        } catch (e) {
          console.warn('[App] Daily notification generation failed:', e);
        }
      } catch (e) {
        console.error('[App] Failed to load data:', e.message);
        setApiError(true);
      }
    }
    init();
  }, []);

  if (apiError) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 12, background: '#0f0f1a', color: '#fff', textAlign: 'center', padding: 24,
      }}>
        <div style={{ fontSize: 48 }}>⚡</div>
        <div style={{ fontSize: 22, fontWeight: 700 }}>API Server Offline</div>
        <div style={{ fontSize: 14, color: '#94a3b8', maxWidth: 380 }}>
          The backend server is not running. Please start it with:<br />
          <code style={{ background: '#1e1e3a', padding: '6px 12px', borderRadius: 6, display: 'inline-block', marginTop: 10, fontSize: 13 }}>
            npm run dev
          </code>
        </div>
        <button
          onClick={() => { setApiError(false); window.location.reload(); }}
          style={{ marginTop: 8, padding: '10px 24px', borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isDbReady) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', gap: 16, background: 'var(--bg)',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 8,
        }}>🎯</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Preparation OS</div>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Connecting to MongoDB…</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/preparation" element={<Preparation />} />
            <Route path="/planner" element={<StudyPlanner />} />
            <Route path="/sessions" element={<StudySessions />} />
            <Route path="/mock-tests" element={<MockTests />} />
            <Route path="/revision" element={<Revision />} />
            <Route path="/vocabulary" element={<Vocabulary />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/gita-shloka" element={<GitaShloka />} />
            <Route path="/gita" element={<GitaShloka />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/teaching" element={<TeachingSchedule />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/test-runner" element={<TestRunner />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
