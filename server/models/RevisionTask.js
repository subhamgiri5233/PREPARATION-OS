import mongoose from 'mongoose';

const revisionTaskSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' },
  topicName: { type: String, default: '' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  dueDate: { type: String }, // 'YYYY-MM-DD'
  scheduledDate: { type: String, default: null },
  completedDate: { type: String, default: null },
  status: { type: String, default: 'Pending' }, // Pending | Completed | Skipped
  revisionNumber: { type: Number, default: 1 },
  confidence: { type: Number, default: 0 }, // 0-5
  difficulty: { type: String, default: 'Medium' },
  intervalDays: { type: Number, default: 1 },
  errorCount: { type: Number, default: 0 },
  repeatedErrorCount: { type: Number, default: 0 },
  sourceType: { type: String, default: 'Topic Completion' }, // Topic Completion | Manual | Error Log
  sourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
  isManual: { type: Boolean, default: false },
  notes: { type: String, default: '' },
}, { timestamps: true });

revisionTaskSchema.index({ dueDate: 1, status: 1 });
revisionTaskSchema.index({ topicId: 1 });
revisionTaskSchema.index({ subjectId: 1 });

export default mongoose.model('RevisionTask', revisionTaskSchema);
