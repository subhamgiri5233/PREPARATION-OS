import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  scheduledAt: { type: String }, // ISO string
  read: { type: Boolean, default: false },
  idempotencyKey: { type: String, default: null },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
