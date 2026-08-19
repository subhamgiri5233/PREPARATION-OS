import mongoose from 'mongoose';

const studyTaskSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea', default: null },
  title: { type: String, required: true },
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  startTime: { type: String, default: null }, // 'HH:MM'
  endTime: { type: String, default: null }, // 'HH:MM'
  durationMinutes: { type: Number, default: 60 },
  status: { type: String, default: 'Pending' }, // Pending | Completed | Skipped | Missed | In Progress | Not Started
  priority: { type: String, default: 'Medium' }, // High | Medium | Low
  source: { type: String, default: 'manual' }, // 'auto' | 'manual'
  isUserEdited: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  estimatedMinutes: { type: Number, default: 60 },
  actualMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  taskType: { type: String, default: 'Study' },
  type: { type: String, default: 'Study' },
  reason: { type: String, default: '' },
  topicName: { type: String, default: '' },
  subjectName: { type: String, default: '' },
  completedAt: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('StudyTask', studyTaskSchema);
