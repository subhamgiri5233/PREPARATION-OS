import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea' },
  name: { type: String, required: true },
  platform: { type: String, default: '' },
  provider: { type: String, default: '' },
  description: { type: String, default: '' },
  color: { type: String, default: '#6366f1' },
  status: { type: String, default: 'Active' },
  startDate: { type: String, default: null },
  targetDate: { type: String, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
