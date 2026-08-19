import mongoose from 'mongoose';

const studyTaskSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea', default: null },
  title: { type: String, required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  status: { type: String, default: 'Pending' }, // Pending | Completed | Skipped
  estimatedMinutes: { type: Number, default: 60 },
  actualMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  taskType: { type: String, default: 'Study' },
  completedAt: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('StudyTask', studyTaskSchema);
