import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter', default: null },
  parentTopicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  name: { type: String, required: true },
  status: { type: String, default: 'Not Started' }, // Not Started | In Progress | Completed | Mastered
  priority: { type: String, default: 'High' },
  importance: { type: String, default: 'High' },
  difficulty: { type: String, default: 'Medium' },
  estimatedHours: { type: Number, default: 2 },
  estimatedMinutes: { type: Number, default: 120 },
  completionPercent: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 },
  masteryScore: { type: Number, default: 0 },
  retentionScore: { type: Number, default: 0 },
  studyHours: { type: Number, default: 0 },
  dateStarted: { type: String, default: null },
  dateCompleted: { type: String, default: null },
  lastStudiedDate: { type: String, default: null },
  nextRevisionDate: { type: String, default: null },
  notes: { type: String, default: '' },
  resourceReference: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for fast syllabus and topic queries
topicSchema.index({ subjectId: 1, order: 1 });
topicSchema.index({ chapterId: 1 });
topicSchema.index({ courseId: 1 });
topicSchema.index({ preparationAreaId: 1 });
topicSchema.index({ status: 1 });

export default mongoose.model('Topic', topicSchema);
