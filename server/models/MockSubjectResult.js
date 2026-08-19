import mongoose from 'mongoose';

const mockSubjectResultSchema = new mongoose.Schema({
  mockTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest' },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  subjectName: { type: String, default: '' },
  totalQuestions: { type: Number, default: 0 },
  attempted: { type: Number, default: 0 },
  correct: { type: Number, default: 0 },
  wrong: { type: Number, default: 0 },
  marks: { type: Number, default: 0 },
  maxMarks: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('MockSubjectResult', mockSubjectResultSchema);
