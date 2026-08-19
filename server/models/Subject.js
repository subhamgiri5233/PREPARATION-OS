import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Subject', subjectSchema);
