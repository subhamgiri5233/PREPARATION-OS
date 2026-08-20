import mongoose from 'mongoose';

const searchHistorySchema = new mongoose.Schema({
  word:           { type: String, required: true },
  normalizedWord: { type: String, required: true, index: true },
  searchedAt:     { type: Date, default: Date.now },
}, { timestamps: true });

searchHistorySchema.index({ searchedAt: -1 });

export default mongoose.model('SearchHistory', searchHistorySchema);
