import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  preparationAreaId: { type: mongoose.Schema.Types.ObjectId, ref: 'PreparationArea' },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Chapter', chapterSchema);
