import mongoose from 'mongoose';

const gitaShlokaSchema = new mongoose.Schema({
  date: { type: String, required: true }, // 'YYYY-MM-DD'
  chapter: { type: String, default: '' },
  verse: { type: String, default: '' },
  sanskritText: { type: String, default: '' },
  transliteration: { type: String, default: '' },
  meaning: { type: String, default: '' },
  personalReflection: { type: String, default: '' },
  favorite: { type: Boolean, default: false },
  updatedAt: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('GitaShloka', gitaShlokaSchema);
