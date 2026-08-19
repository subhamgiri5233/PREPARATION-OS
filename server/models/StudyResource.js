import mongoose from 'mongoose';

const studyResourceSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea', default: null },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  resourceType: { type: String, default: 'Video' }, // Video | PDF | Article | Book | Notes
  title: { type: String, required: true },
  url: { type: String, default: '' },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  watchedPercentage: { type: Number, default: 0 },
  durationMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('StudyResource', studyResourceSchema);
