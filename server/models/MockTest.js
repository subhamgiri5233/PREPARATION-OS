import mongoose from 'mongoose';

const mockTestSchema = new mongoose.Schema({
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea' },
  date: { type: String }, // 'YYYY-MM-DD'
  mockNumber: { type: Number, default: 1 },
  title: { type: String, default: '' },
  totalMarks: { type: Number, default: 0 },
  obtainedMarks: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  attemptedQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  wrongAnswers: { type: Number, default: 0 },
  positiveMarks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  timeTakenMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  platform: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('MockTest', mockTestSchema);
