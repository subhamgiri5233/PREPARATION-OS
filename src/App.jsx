// src/App.jsx
import { useEffect } from 'react';
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
    await addNotification({
      type: 'revision',
      title: `${revisionsDue.length} Revision${revisionsDue.length > 1 ? 's' : ''} Due Today`,
      message: (() => {
        const uniqueNames = [...new Set(revisionsDue.map((r) => r.topicName || `Topic #${r.topicId}`))];
        const shown = uniqueNames.slice(0, 3).join(', ');
        const extra = uniqueNames.length > 3 ? ` and ${uniqueNames.length - 3} more` : '';
        return shown + extra;
      })(),
      scheduledAt: new Date().toISOString(),
      idempotencyKey: `revisions-due-${today}`
    });
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

  useEffect(() => {
    async function init() {
      await initializeDatabase();

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
        // Refresh unread count after generating notifications
        const freshUnread = await getUnreadNotifications();
        setUnreadCount(freshUnread.length);
      } catch (e) {
        console.warn('[App] Daily notification generation failed:', e);
      }
    }
    init();
  }, []);

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
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>Loading your study data…</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}
