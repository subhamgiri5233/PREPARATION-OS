import mongoose from 'mongoose';

const studySessionSchema = new mongoose.Schema({
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea', default: null },
  startTime: { type: String }, // ISO string
  endTime: { type: String, default: null },
  durationMinutes: { type: Number, default: 0 },
  notes: { type: String, default: '' },
  sessionType: { type: String, default: 'Study' },
  topicName: { type: String, default: '' },
  subjectName: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('StudySession', studySessionSchema);
