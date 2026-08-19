// server/index.js
// Express API server for StudyWeb — bridges React frontend to MongoDB Atlas

import 'dotenv/config';
import dns from 'dns';

// Force Node.js to use Google Public DNS for SRV resolution
// This fixes "querySrv ECONNREFUSED" errors with MongoDB Atlas on some systems
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Routes
import settingsRouter from './routes/settings.js';
import areasRouter from './routes/areas.js';
import coursesRouter from './routes/courses.js';
import subjectsRouter from './routes/subjects.js';
import topicsRouter from './routes/topics.js';
import chaptersRouter from './routes/chapters.js';
import tasksRouter from './routes/tasks.js';
import sessionsRouter from './routes/sessions.js';
import revisionsRouter from './routes/revisions.js';
import mocksRouter from './routes/mocks.js';
import vocabularyRouter from './routes/vocabulary.js';
import scheduleRouter from './routes/schedule.js';
import notificationsRouter from './routes/notifications.js';
import progressRouter from './routes/progress.js';
import errorLogRouter from './routes/errorLog.js';
import resourcesRouter from './routes/resources.js';
import gitaShlokaRouter from './routes/gitaShlokas.js';
import { seedDatabase } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' })); // Allow all origins (frontend on 5173, mobile on LAN)
app.use(express.json({ limit: '10mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/settings', settingsRouter);
app.use('/api/areas', areasRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/revisions', revisionsRouter);
app.use('/api/mocks', mocksRouter);
app.use('/api/vocabulary', vocabularyRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/progress', progressRouter);
app.use('/api/error-log', errorLogRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/gita-shlokas', gitaShlokaRouter);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ─── Connect to MongoDB & Start ───────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    family: 4, // Force IPv4
  })
  .then(async () => {
    console.log('✅ MongoDB connected to Atlas');
    await seedDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API server running on http://localhost:${PORT}`);
      console.log(`📱 Mobile access: http://<your-local-ip>:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
