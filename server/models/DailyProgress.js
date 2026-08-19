import mongoose from 'mongoose';

const dailyProgressSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  tasksCompleted: { type: Number, default: 0 },
  tasksTotal: { type: Number, default: 0 },
  studyMinutes: { type: Number, default: 0 },
  revisionsCompleted: { type: Number, default: 0 },
  revisionsTotal: { type: Number, default: 0 },
  vocabLearned: { type: Number, default: 0 },
  mocksAttempted: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('DailyProgress', dailyProgressSchema);
