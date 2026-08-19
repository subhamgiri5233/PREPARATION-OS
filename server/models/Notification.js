import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  scheduledAt: { type: String }, // ISO string
  read: { type: Boolean, default: false },
  idempotencyKey: { type: String, default: null },
  taskId: { type: String, default: null },
  studySessionId: { type: String, default: null },
  scheduledTime: { type: String, default: null },
  reminderTime: { type: String, default: null },
  status: { type: String, default: 'sent' }, // sent, snoozed, dismissed, completed, missed
  snoozedUntil: { type: String, default: null },
  dismissed: { type: Boolean, default: false },
  actionData: { type: mongoose.Schema.Types.Mixed, default: {} },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
