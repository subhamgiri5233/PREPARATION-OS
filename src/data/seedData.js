// src/data/seedData.js
// Initial data to populate the database on first run

export const defaultSettings = {
  id: 1,
  dailyStudyHours: 8,
  preferredStartTime: '06:00',
  preferredEndTime: '22:00',
  revisionIntervals: [1, 3, 7, 14, 30], // days after completion
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

export const defaultTeachingSchedule = [
  { dayOfWeek: 1, startTime: '07:00', endTime: '08:00', label: 'Morning Teaching' },
  { dayOfWeek: 1, startTime: '18:00', endTime: '19:00', label: 'Evening Teaching' },
  { dayOfWeek: 3, startTime: '07:00', endTime: '08:00', label: 'Morning Teaching' },
  { dayOfWeek: 5, startTime: '07:00', endTime: '08:00', label: 'Morning Teaching' },
  { dayOfWeek: 5, startTime: '18:00', endTime: '19:00', label: 'Evening Teaching' },
];

export const defaultPreparationAreas = [
  {
    id: 1,
    name: 'IBPS SO IT Officer',
    resource: 'Adda247 Maha Pack',
    priority: 1,
    color: '#6366f1',
    description: 'Banking competitive exam for IT Officer post',
    targetDate: null,
  },
  {
    id: 2,
    name: 'Panchayat',
    resource: 'YourStudy',
    priority: 2,
    color: '#22c55e',
    description: 'Panchayat recruitment preparation',
    targetDate: null,
  },
  {
    id: 3,
    name: 'B.Ed',
    resource: '',
    priority: 3,
    color: '#f59e0b',
    description: 'Bachelor of Education preparation',
    targetDate: null,
  },
];

export const defaultCourses = [
  {
    id: 1,
    preparationAreaId: 1,
    name: 'Adda247 MahaPack',
    platform: 'Adda247',
    description: 'Comprehensive study and video package for IBPS SO IT Officer',
    color: '#6366f1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    preparationAreaId: 2,
    name: 'YourStudy',
    platform: 'YourStudy',
    description: 'Specialized course for Panchayat preparation',
    color: '#22c55e',
    createdAt: new Date().toISOString(),
  },
];

export const ibpsSubjects = [
  { id: 1, preparationAreaId: 1, name: 'DBMS', color: '#6366f1', order: 1 },
  { id: 2, preparationAreaId: 1, name: 'Operating System', color: '#8b5cf6', order: 2 },
  { id: 3, preparationAreaId: 1, name: 'Computer Networks', color: '#ec4899', order: 3 },
  { id: 4, preparationAreaId: 1, name: 'Data Structures', color: '#f43f5e', order: 4 },
  { id: 5, preparationAreaId: 1, name: 'Algorithms', color: '#f97316', order: 5 },
  { id: 6, preparationAreaId: 1, name: 'Programming', color: '#eab308', order: 6 },
  { id: 7, preparationAreaId: 1, name: 'Software Engineering', color: '#84cc16', order: 7 },
  { id: 8, preparationAreaId: 1, name: 'Computer Organization', color: '#22c55e', order: 8 },
  { id: 9, preparationAreaId: 1, name: 'Web Technology', color: '#14b8a6', order: 9 },
  { id: 10, preparationAreaId: 1, name: 'Cyber Security', color: '#06b6d4', order: 10 },
  { id: 11, preparationAreaId: 1, name: 'Cloud Computing', color: '#3b82f6', order: 11 },
  { id: 12, preparationAreaId: 1, name: 'General Awareness', color: '#6366f1', order: 12 },
  { id: 13, preparationAreaId: 1, name: 'Banking Awareness', color: '#a855f7', order: 13 },
  { id: 14, preparationAreaId: 1, name: 'Reasoning', color: '#ec4899', order: 14 },
  { id: 15, preparationAreaId: 1, name: 'Quantitative Aptitude', color: '#f43f5e', order: 15 },
  { id: 16, preparationAreaId: 1, name: 'English', color: '#f97316', order: 16 },
];

export const ibpsTopics = [
  // DBMS (subjectId: 1)
  { subjectId: 1, preparationAreaId: 1, name: 'Introduction to DBMS', priority: 'High', estimatedHours: 2, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'ER Model & ER Diagram', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'Relational Model', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'Normalization (1NF, 2NF, 3NF, BCNF)', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'SQL (DDL, DML, DCL, TCL)', priority: 'High', estimatedHours: 5, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'Joins and Subqueries', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'Transactions & ACID', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'Concurrency Control', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'Indexing & Hashing', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 1, preparationAreaId: 1, name: 'File Organization', priority: 'Low', estimatedHours: 2, status: 'Not Started' },

  // OS (subjectId: 2)
  { subjectId: 2, preparationAreaId: 1, name: 'Introduction to OS', priority: 'High', estimatedHours: 2, status: 'Not Started' },
  { subjectId: 2, preparationAreaId: 1, name: 'Process Management', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 2, preparationAreaId: 1, name: 'CPU Scheduling Algorithms', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 2, preparationAreaId: 1, name: 'Deadlocks', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 2, preparationAreaId: 1, name: 'Memory Management', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 2, preparationAreaId: 1, name: 'Virtual Memory & Paging', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 2, preparationAreaId: 1, name: 'File System', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 2, preparationAreaId: 1, name: 'I/O Management', priority: 'Medium', estimatedHours: 2, status: 'Not Started' },

  // Computer Networks (subjectId: 3)
  { subjectId: 3, preparationAreaId: 1, name: 'OSI & TCP/IP Model', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 3, preparationAreaId: 1, name: 'IP Addressing & Subnetting', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 3, preparationAreaId: 1, name: 'Routing Protocols', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 3, preparationAreaId: 1, name: 'TCP vs UDP', priority: 'High', estimatedHours: 2, status: 'Not Started' },
  { subjectId: 3, preparationAreaId: 1, name: 'DNS, DHCP, HTTP, FTP', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 3, preparationAreaId: 1, name: 'Network Security Basics', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },

  // Data Structures (subjectId: 4)
  { subjectId: 4, preparationAreaId: 1, name: 'Arrays & Strings', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 4, preparationAreaId: 1, name: 'Linked Lists', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 4, preparationAreaId: 1, name: 'Stacks & Queues', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 4, preparationAreaId: 1, name: 'Trees & Binary Trees', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 4, preparationAreaId: 1, name: 'Graphs', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 4, preparationAreaId: 1, name: 'Hashing', priority: 'Medium', estimatedHours: 2, status: 'Not Started' },

  // Algorithms (subjectId: 5)
  { subjectId: 5, preparationAreaId: 1, name: 'Sorting Algorithms', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 5, preparationAreaId: 1, name: 'Searching Algorithms', priority: 'High', estimatedHours: 2, status: 'Not Started' },
  { subjectId: 5, preparationAreaId: 1, name: 'Dynamic Programming', priority: 'High', estimatedHours: 5, status: 'Not Started' },
  { subjectId: 5, preparationAreaId: 1, name: 'Greedy Algorithms', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 5, preparationAreaId: 1, name: 'Divide & Conquer', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },

  // Programming (subjectId: 6)
  { subjectId: 6, preparationAreaId: 1, name: 'C Programming Basics', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 6, preparationAreaId: 1, name: 'OOP Concepts', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 6, preparationAreaId: 1, name: 'Java Basics', priority: 'Medium', estimatedHours: 4, status: 'Not Started' },

  // Software Engineering (subjectId: 7)
  { subjectId: 7, preparationAreaId: 1, name: 'SDLC Models', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 7, preparationAreaId: 1, name: 'Agile & Scrum', priority: 'Medium', estimatedHours: 2, status: 'Not Started' },
  { subjectId: 7, preparationAreaId: 1, name: 'Software Testing', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 7, preparationAreaId: 1, name: 'Design Patterns', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },

  // Computer Organization (subjectId: 8)
  { subjectId: 8, preparationAreaId: 1, name: 'Number Systems', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 8, preparationAreaId: 1, name: 'CPU Architecture', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 8, preparationAreaId: 1, name: 'Memory Hierarchy', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 8, preparationAreaId: 1, name: 'Pipeline & Parallelism', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },

  // Web Technology (subjectId: 9)
  { subjectId: 9, preparationAreaId: 1, name: 'HTML & CSS Basics', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 9, preparationAreaId: 1, name: 'JavaScript Basics', priority: 'Medium', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 9, preparationAreaId: 1, name: 'Web Protocols (HTTP/HTTPS)', priority: 'High', estimatedHours: 2, status: 'Not Started' },
  { subjectId: 9, preparationAreaId: 1, name: 'REST APIs', priority: 'Medium', estimatedHours: 2, status: 'Not Started' },

  // Cyber Security (subjectId: 10)
  { subjectId: 10, preparationAreaId: 1, name: 'Cryptography', priority: 'High', estimatedHours: 4, status: 'Not Started' },
  { subjectId: 10, preparationAreaId: 1, name: 'Firewalls & IDS', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 10, preparationAreaId: 1, name: 'Common Attacks (SQL Injection, XSS)', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 10, preparationAreaId: 1, name: 'PKI & Digital Signatures', priority: 'Medium', estimatedHours: 2, status: 'Not Started' },

  // Cloud Computing (subjectId: 11)
  { subjectId: 11, preparationAreaId: 1, name: 'Cloud Service Models (IaaS, PaaS, SaaS)', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 11, preparationAreaId: 1, name: 'Virtualization', priority: 'High', estimatedHours: 3, status: 'Not Started' },
  { subjectId: 11, preparationAreaId: 1, name: 'Major Cloud Providers', priority: 'Medium', estimatedHours: 2, status: 'Not Started' },
];

export const wordBank = [
  { word: 'Abate', meaning: 'To reduce in amount, degree, or intensity', bengaliMeaning: 'হ্রাস করা', synonyms: ['diminish', 'subside', 'lessen'], antonyms: ['increase', 'intensify'], example: 'The storm finally began to abate.' },
  { word: 'Benevolent', meaning: 'Well meaning and kindly', bengaliMeaning: 'পরোপকারী', synonyms: ['kind', 'charitable', 'generous'], antonyms: ['malevolent', 'unkind'], example: 'She was a benevolent person who always helped others.' },
  { word: 'Candid', meaning: 'Truthful and straightforward', bengaliMeaning: 'খোলামেলা', synonyms: ['frank', 'honest', 'direct'], antonyms: ['dishonest', 'evasive'], example: 'Please be candid about your thoughts.' },
  { word: 'Dauntless', meaning: 'Showing fearlessness and determination', bengaliMeaning: 'নির্ভীক', synonyms: ['fearless', 'bold', 'intrepid'], antonyms: ['fearful', 'timid'], example: 'The dauntless soldier never retreated.' },
  { word: 'Ebullient', meaning: 'Cheerful and full of energy', bengaliMeaning: 'উচ্ছ্বসিত', synonyms: ['vivacious', 'enthusiastic', 'buoyant'], antonyms: ['gloomy', 'depressed'], example: 'She had an ebullient personality.' },
  { word: 'Facetious', meaning: 'Treating serious issues with inappropriate humor', bengaliMeaning: 'রসিকতাপূর্ণ', synonyms: ['flippant', 'jocular', 'frivolous'], antonyms: ['serious', 'sincere'], example: 'His facetious remarks annoyed everyone.' },
  { word: 'Garrulous', meaning: 'Excessively talkative', bengaliMeaning: 'বাচাল', synonyms: ['talkative', 'loquacious', 'verbose'], antonyms: ['taciturn', 'silent'], example: 'The garrulous old man talked for hours.' },
  { word: 'Hapless', meaning: 'Unfortunate and unlucky', bengaliMeaning: 'দুর্ভাগ্যজনক', synonyms: ['unlucky', 'unfortunate', 'wretched'], antonyms: ['fortunate', 'lucky'], example: 'The hapless victim lost everything.' },
  { word: 'Impetuous', meaning: 'Acting without thought; hasty', bengaliMeaning: 'আবেগপ্রবণ', synonyms: ['rash', 'impulsive', 'hasty'], antonyms: ['careful', 'cautious'], example: 'His impetuous decision cost him dearly.' },
  { word: 'Judicious', meaning: 'Having good judgment', bengaliMeaning: 'বিচক্ষণ', synonyms: ['wise', 'sensible', 'prudent'], antonyms: ['unwise', 'foolish'], example: 'She made a judicious choice.' },
];
