// server/seed.js
// Seeds MongoDB with default data on first startup

import Settings from './models/Settings.js';
import PreparationArea from './models/PreparationArea.js';
import Course from './models/Course.js';
import Subject from './models/Subject.js';
import Topic from './models/Topic.js';
import TeachingSchedule from './models/TeachingSchedule.js';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const defaultSettings = {
  dailyStudyHours: 8,
  preferredStartTime: '06:00',
  preferredEndTime: '22:00',
  revisionIntervals: [1, 3, 7, 14, 30],
  notificationsEnabled: true,
  browserNotifications: true,
  dailySummaryTime: '21:00',
  revisionReminderTime: '08:00',
  sessionReminderMinutes: 15,
  theme: 'dark',
  vocabDailyTarget: 10,
  gitaReminderEnabled: true,
  userName: 'Subham',
};

const defaultTeachingSchedule = [
  { dayOfWeek: 1, startTime: '07:00', endTime: '08:00', label: 'Morning Teaching' },
  { dayOfWeek: 1, startTime: '18:00', endTime: '19:00', label: 'Evening Teaching' },
  { dayOfWeek: 3, startTime: '07:00', endTime: '08:00', label: 'Morning Teaching' },
  { dayOfWeek: 5, startTime: '07:00', endTime: '08:00', label: 'Morning Teaching' },
  { dayOfWeek: 5, startTime: '18:00', endTime: '19:00', label: 'Evening Teaching' },
];

const defaultPreparationAreas = [
  { name: 'IBPS SO IT Officer', resource: 'Adda247 Maha Pack', priority: 1, color: '#6366f1', description: 'Banking competitive exam for IT Officer post' },
  { name: 'Panchayat', resource: 'YourStudy', priority: 2, color: '#22c55e', description: 'Panchayat recruitment preparation' },
  { name: 'B.Ed', resource: '', priority: 3, color: '#f59e0b', description: 'Bachelor of Education preparation' },
];

const ibpsSubjectNames = [
  'DBMS', 'Operating System', 'Computer Networks', 'Data Structures', 'Algorithms',
  'Programming', 'Software Engineering', 'Computer Organization', 'Web Technology',
  'Cyber Security', 'Cloud Computing', 'General Awareness', 'Banking Awareness',
  'Reasoning', 'Quantitative Aptitude', 'English',
];

const subjectColors = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316',
];

// Topics indexed by subject position (0-based)
const topicsBySubjectIndex = [
  // DBMS (0)
  ['Introduction to DBMS','ER Model & ER Diagram','Relational Model','Normalization (1NF, 2NF, 3NF, BCNF)','SQL (DDL, DML, DCL, TCL)','Joins and Subqueries','Transactions & ACID','Concurrency Control','Indexing & Hashing','File Organization'],
  // OS (1)
  ['Introduction to OS','Process Management','CPU Scheduling Algorithms','Deadlocks','Memory Management','Virtual Memory & Paging','File System','I/O Management'],
  // Computer Networks (2)
  ['OSI & TCP/IP Model','IP Addressing & Subnetting','Routing Protocols','TCP vs UDP','DNS, DHCP, HTTP, FTP','Network Security Basics'],
  // Data Structures (3)
  ['Arrays & Strings','Linked Lists','Stacks & Queues','Trees & Binary Trees','Graphs','Hashing'],
  // Algorithms (4)
  ['Sorting Algorithms','Searching Algorithms','Dynamic Programming','Greedy Algorithms','Divide & Conquer'],
  // Programming (5)
  ['C Programming Basics','OOP Concepts','Java Basics'],
  // Software Engineering (6)
  ['SDLC Models','Agile & Scrum','Software Testing','Design Patterns'],
  // Computer Organization (7)
  ['Number Systems','CPU Architecture','Memory Hierarchy','Pipeline & Parallelism'],
  // Web Technology (8)
  ['HTML & CSS Basics','JavaScript Basics','Web Protocols (HTTP/HTTPS)','REST APIs'],
  // Cyber Security (9)
  ['Cryptography','Firewalls & IDS','Common Attacks (SQL Injection, XSS)','PKI & Digital Signatures'],
  // Cloud Computing (10)
  ['Cloud Service Models (IaaS, PaaS, SaaS)','Virtualization','Major Cloud Providers'],
  // General Awareness (11)
  [],
  // Banking Awareness (12)
  [],
  // Reasoning (13)
  [],
  // Quantitative Aptitude (14)
  [],
  // English (15)
  [],
];

// ─── Seed Function ────────────────────────────────────────────────────────────

export async function seedDatabase() {
  try {
    // Settings
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create(defaultSettings);
      console.log('[Seed] Settings created');
    }

    // Teaching Schedule
    const scheduleCount = await TeachingSchedule.countDocuments();
    if (scheduleCount === 0) {
      await TeachingSchedule.insertMany(defaultTeachingSchedule);
      console.log('[Seed] Teaching schedule created');
    }

    // Preparation Areas
    const areasCount = await PreparationArea.countDocuments();
    if (areasCount > 0) {
      console.log('[Seed] Data already exists, skipping full seed');
      return;
    }

    const areas = await PreparationArea.insertMany(defaultPreparationAreas);
    console.log('[Seed] Preparation areas created');

    // IBPS area is first
    const ibpsArea = areas[0];

    // Course
    const course = await Course.create({
      preparationAreaId: ibpsArea._id,
      name: 'Adda247 MahaPack',
      platform: 'Adda247',
      provider: 'Adda247',
      description: 'Comprehensive study and video package for IBPS SO IT Officer',
      color: '#6366f1',
      status: 'Active',
    });
    console.log('[Seed] Course created');

    // Subjects
    const subjectDocs = ibpsSubjectNames.map((name, i) => ({
      preparationAreaId: ibpsArea._id,
      courseId: course._id,
      name,
      color: subjectColors[i],
      order: i + 1,
    }));
    const subjects = await Subject.insertMany(subjectDocs);
    console.log('[Seed] Subjects created:', subjects.length);

    // Topics
    const topicDocs = [];
    subjects.forEach((subject, subjectIdx) => {
      const names = topicsBySubjectIndex[subjectIdx] || [];
      names.forEach((topicName, topicIdx) => {
        topicDocs.push({
          subjectId: subject._id,
          preparationAreaId: ibpsArea._id,
          courseId: course._id,
          name: topicName,
          priority: 'High',
          importance: 'High',
          difficulty: 'Medium',
          status: 'Not Started',
          estimatedHours: 2,
          estimatedMinutes: 120,
          completionPercent: 0,
          completionPercentage: 0,
          masteryScore: 0,
          retentionScore: 0,
          studyHours: 0,
          order: topicIdx + 1,
        });
      });
    });
    await Topic.insertMany(topicDocs);
    console.log('[Seed] Topics created:', topicDocs.length);

    console.log('[Seed] ✅ Database seeded successfully');
  } catch (err) {
    console.error('[Seed] Error:', err.message);
  }
}
