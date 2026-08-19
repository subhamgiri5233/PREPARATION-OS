# 🎯 Preparation OS (PrepOS)

A modern, full-stack **Personal Study Management & Preparation Operating System** built for competitive exam aspirants.

---

## ✨ Features

- **📱 Progressive Web App (PWA)**: Install directly to your Mobile Phone or Desktop Chrome with home screen shortcuts and offline caching.
- **🔔 Real Native Device Alerts**: Real-time push notifications for revisions due, vocabulary targets, and study session completions.
- **🌐 Real-Time Cloud Sync**: MongoDB Atlas database backend ensuring your data entered on a laptop instantly syncs to mobile and tablet.
- **📚 5-Tier Syllabus Command Center**: Preparation Area → Course → Subject → Chapter → Topic → Study Resources.
- **🧠 Adaptive Spaced Repetition**: Automatic SM-2 / Leitner-based revision scheduling with interval calculation.
- **⏱️ Study Session Timer**: Live study sessions with pause/resume, notes, and topic tracking.
- **📝 Mock Test Analytics**: Multi-subject score breakdowns, accuracy trends, and error categorization (Silly, Conceptual, Time, Guess).
- **📖 Daily Vocabulary & Gita Shlokas**: Daily word targets with Bengali/Hindi meanings, flashcards, and motivational Gita wisdom.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Date-fns, Recharts, Zustand, Vanilla CSS Design System
- **Backend**: Express.js, Mongoose, Node.js
- **Database**: MongoDB Atlas
- **PWA**: Service Worker, Web App Manifest, Native Notification API
- **Deployment**: Render (Backend Web Service) + Vercel (Frontend SPA)

---

## 🚀 Local Development

1. **Install dependencies**:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Configure environment**:
   Create `server/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.gp5ayhl.mongodb.net/PreparationOS?retryWrites=true&w=majority
   PORT=3001
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001/api`

---

## ☁️ Deployment Guide

### 1. Backend (Render)
- Connect GitHub repository `subhamgiri5233/PREPARATION-OS`
- Root Directory: `server`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables:
  - `MONGODB_URI`: `<Your MongoDB Connection String>`
  - `PORT`: `3001`
  - `NODE_VERSION`: `20`

### 2. Frontend (Vercel)
- Import `subhamgiri5233/PREPARATION-OS`
- Framework: `Vite`
- Environment Variables:
  - `VITE_API_URL`: `https://<YOUR-RENDER-APP>.onrender.com/api`

---

## 📄 License

MIT
