// src/store/useAppStore.js
// Zustand global state store

import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // ─── Settings ───────────────────────────────────────────────────────────
  settings: null,
  setSettings: (settings) => set({ settings }),

  // ─── Preparation Data ────────────────────────────────────────────────────
  preparationAreas: [],
  setPreparationAreas: (areas) => set({ preparationAreas: areas }),

  courses: [],
  setCourses: (courses) => set({ courses }),

  subjects: [],
  setSubjects: (subjects) => set({ subjects }),

  chapters: [],
  setChapters: (chapters) => set({ chapters }),

  topics: [],
  setTopics: (topics) => set({ topics }),

  studyResources: [],
  setStudyResources: (studyResources) => set({ studyResources }),

  // ─── Today's Data ────────────────────────────────────────────────────────
  todayTasks: [],
  setTodayTasks: (tasks) => set({ todayTasks: tasks }),

  todayRevisions: [],
  setTodayRevisions: (revisions) => set({ todayRevisions: revisions }),

  // ─── Active Session ──────────────────────────────────────────────────────
  activeSession: null,
  setActiveSession: (session) => set({ activeSession: session }),

  // ─── Notifications ───────────────────────────────────────────────────────
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // ─── UI State ────────────────────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ─── Teaching Schedule ───────────────────────────────────────────────────
  teachingSchedule: [],
  setTeachingSchedule: (schedule) => set({ teachingSchedule: schedule }),

  // ─── Loading ─────────────────────────────────────────────────────────────
  isDbReady: false,
  setDbReady: (ready) => set({ isDbReady: ready }),
}));
