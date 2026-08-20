// src/App.jsx
// High Performance Client-Side Routing with Route-Level Code Splitting (React.lazy),
// In-Memory Cached Data Layer, Error Boundaries, and Optimized Startup.

import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import {
  initializeDatabase, getAllAreas, getAllCourses, getAllSubjects,
  getAllChapters, getAllTopics, getAllStudyResources, getSettings,
  getTeachingSchedule, getUnreadNotifications, addNotification
} from './services/db';
import { getRevisionsDueToday } from './services/revisionService';
import { useAppStore } from './store/useAppStore';

// ─── Route-Level Code Splitting (Lazy Loaded Pages) ───────────────────────────
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Preparation = lazy(() => import('./pages/Preparation'));
const StudyPlanner = lazy(() => import('./pages/StudyPlanner'));
const StudySessions = lazy(() => import('./pages/StudySessions'));
const MockTests = lazy(() => import('./pages/MockTests'));
const Revision = lazy(() => import('./pages/Revision'));
const Vocabulary = lazy(() => import('./pages/Vocabulary'));
const Progress = lazy(() => import('./pages/Progress'));
const Analytics = lazy(() => import('./pages/Analytics'));
const GitaShloka = lazy(() => import('./pages/GitaShloka'));
const Notifications = lazy(() => import('./pages/Notifications'));
const TeachingSchedule = lazy(() => import('./pages/TeachingSchedule'));
const Settings = lazy(() => import('./pages/Settings'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TestRunner = lazy(() => import('./pages/TestRunner'));

// ─── Page Loading Fallback Skeleton ───────────────────────────────────────────
function PageFallback() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      gap: 12,
      color: 'var(--text-3)'
    }}>
      <div className="spinner" style={{ width: 28, height: 28 }} />
      <div style={{ fontSize: 12 }}>Loading view…</div>
    </div>
  );
}

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

let _notificationsGenerated = false;

async function generateDailyNotifications() {
  if (_notificationsGenerated) return;
  _notificationsGenerated = true;
  const today = new Date().toISOString().slice(0, 10);

  // Check revisions due today
  try {
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
    }
  } catch (e) {
    console.warn('[App] Revision notification check failed:', e.message);
  }

  // Daily vocabulary reminder
  try {
    const { getVocabByDate } = await import('./services/db');
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
  } catch (e) {
    console.warn('[App] Vocab notification check failed:', e.message);
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
        // Load global data in parallel using cached apiFetch
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

        setPreparationAreas(areas || []);
        setCourses(courses || []);
        setSubjects(subjects || []);
        setChapters(chapters || []);
        setTopics(topics || []);
        setStudyResources(resources || []);
        setSettings(settings || {});
        setTeachingSchedule(schedule || []);
        setUnreadCount(unread?.length || 0);
        setDbReady(true);

        // Background non-blocking notification generation
        generateDailyNotifications().catch((err) => console.warn('[App] Notif error:', err));
        import('./services/reminderScheduler').then(({ startReminderScheduler }) => {
          startReminderScheduler();
        }).catch((err) => console.warn('[App] ReminderScheduler error:', err));
      } catch (e) {
        console.error('[App] Failed to load initial data:', e.message);
        // Still allow app to open with partial data
        setDbReady(true);
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
          width: 54, height: 54, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 4,
        }}>🎯</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Preparation OS</div>
        <div className="spinner" style={{ width: 28, height: 28 }} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
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
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
