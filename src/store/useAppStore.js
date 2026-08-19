// src/store/useAppStore.js
// Zustand global state store

import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // ─── Settings ───────────────────────────────────────────────────────────
  settings: null,
  setSettings: (settings) => set({ settings: settings && typeof settings === 'object' ? settings : null }),

  // ─── Preparation Data (Guaranteed Arrays) ──────────────────────────────────
  preparationAreas: [],
  setPreparationAreas: (areas) => set({ preparationAreas: Array.isArray(areas) ? areas : [] }),

  courses: [],
  setCourses: (courses) => set({ courses: Array.isArray(courses) ? courses : [] }),

  subjects: [],
  setSubjects: (subjects) => set({ subjects: Array.isArray(subjects) ? subjects : [] }),

  chapters: [],
  setChapters: (chapters) => set({ chapters: Array.isArray(chapters) ? chapters : [] }),

  topics: [],
  setTopics: (topics) => set({ topics: Array.isArray(topics) ? topics : [] }),

  studyResources: [],
  setStudyResources: (studyResources) => set({ studyResources: Array.isArray(studyResources) ? studyResources : [] }),

  // ─── Today's Data ────────────────────────────────────────────────────────
  todayTasks: [],
  setTodayTasks: (tasks) => set({ todayTasks: Array.isArray(tasks) ? tasks : [] }),

  todayRevisions: [],
  setTodayRevisions: (revisions) => set({ todayRevisions: Array.isArray(revisions) ? revisions : [] }),

  // ─── Active Session ──────────────────────────────────────────────────────
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  // ─── Notifications ───────────────────────────────────────────────────────
  notifications: [],
  setNotifications: (notifications) => set({ notifications: Array.isArray(notifications) ? notifications : [] }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Number(count) || 0 }),

  // ─── UI State ────────────────────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: Boolean(open) }),

  // ─── Teaching Schedule ───────────────────────────────────────────────────
  teachingSchedule: [],
  setTeachingSchedule: (schedule) => set({ teachingSchedule: Array.isArray(schedule) ? schedule : [] }),

  // ─── Loading ─────────────────────────────────────────────────────────────
  isDbReady: false,
  setDbReady: (ready) => set({ isDbReady: Boolean(ready) }),
}));
