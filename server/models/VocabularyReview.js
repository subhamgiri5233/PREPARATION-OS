import mongoose from 'mongoose';

const vocabularyReviewSchema = new mongoose.Schema({
  vocabularyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vocabulary' },
  reviewDate: { type: String }, // 'YYYY-MM-DD'
  status: { type: String, default: 'Reviewed' }, // Reviewed | Skipped
  confidence: { type: Number, default: 3 }, // 1-5
}, { timestamps: true });

export default mongoose.model('VocabularyReview', vocabularyReviewSchema);
