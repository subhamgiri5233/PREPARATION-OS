import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
  word:           { type: String, required: true },
  meaning:        { type: String, default: '' },
  bengaliMeaning: { type: String, default: '' },
  partOfSpeech:   { type: String, default: '' },
  example:        { type: String, default: '' },        // used by UI
  exampleSentence:{ type: String, default: '' },        // legacy alias
  synonyms:       { type: [String], default: [] },
  antonyms:       { type: [String], default: [] },
  dateAdded:      { type: String },                     // 'YYYY-MM-DD' — daily key
  revisionStatus: { type: String, default: 'Learning' }, // 'Learning' | 'Revised'
  difficulty:     { type: String, default: 'Medium' },
  masteryLevel:   { type: Number, default: 0 },         // 0-5
  lastReviewed:   { type: String, default: null },
  notes:          { type: String, default: '' },
}, { timestamps: true });

// Index for fast daily queries: GET /vocabulary?date=YYYY-MM-DD
vocabularySchema.index({ dateAdded: 1 });

export default mongoose.model('Vocabulary', vocabularySchema);
