import mongoose from 'mongoose';

const errorLogSchema = new mongoose.Schema({
  mockTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'MockTest', default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', default: null },
  subjectName: { type: String, default: '' },
  topicName: { type: String, default: '' },
  questionText: { type: String, default: '' },
  correctAnswer: { type: String, default: '' },
  yourAnswer: { type: String, default: '' },
  explanation: { type: String, default: '' },
  errorType: { type: String, default: 'Conceptual' }, // Conceptual | Calculation | Silly | Time
  reviewed: { type: Boolean, default: false },
  revisionRequired: { type: Boolean, default: false },
  revisionTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'RevisionTask', default: null },
  dateAdded: { type: String },
}, { timestamps: true });

export default mongoose.model('ErrorLog', errorLogSchema);
