import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  dailyStudyHours: { type: Number, default: 8 },
  preferredStartTime: { type: String, default: '06:00' },
  preferredEndTime: { type: String, default: '22:00' },
  revisionIntervals: { type: [Number], default: [1, 3, 7, 14, 30] },
  notificationsEnabled: { type: Boolean, default: true },
  browserNotifications: { type: Boolean, default: true },
  dailySummaryTime: { type: String, default: '21:00' },
  revisionReminderTime: { type: String, default: '08:00' },
  sessionReminderMinutes: { type: Number, default: 15 },
  theme: { type: String, default: 'dark' },
  vocabDailyTarget: { type: Number, default: 10 },
  gitaReminderEnabled: { type: Boolean, default: true },
  userName: { type: String, default: 'Subham' },
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
