import mongoose from 'mongoose';

const preparationAreaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  resource: { type: String, default: '' },
  priority: { type: Number, default: 1 },
  color: { type: String, default: '#6366f1' },
  description: { type: String, default: '' },
  targetDate: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('PreparationArea', preparationAreaSchema);
