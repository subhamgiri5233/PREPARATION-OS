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
import authRouter from './routes/auth.js';
import { seedDatabase } from './seed.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://preparation-os.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ─── Health Check & Root Handlers ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Preparation OS API',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Preparation OS REST API is running',
    version: '1.0.0'
  });
});

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
app.use('/api/error-logs', errorLogRouter);
app.use('/api/mocks/errors', errorLogRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/gita-shlokas', gitaShlokaRouter);
app.use('/api/auth', authRouter);

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
