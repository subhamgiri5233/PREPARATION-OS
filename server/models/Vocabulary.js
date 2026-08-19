import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
  word: { type: String, required: true },
  meaning: { type: String, default: '' },
  partOfSpeech: { type: String, default: '' },
  exampleSentence: { type: String, default: '' },
  synonyms: { type: [String], default: [] },
  antonyms: { type: [String], default: [] },
  dateAdded: { type: String }, // 'YYYY-MM-DD'
  difficulty: { type: String, default: 'Medium' },
  masteryLevel: { type: Number, default: 0 }, // 0-5
  lastReviewed: { type: String, default: null },
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Vocabulary', vocabularySchema);
