import mongoose from 'mongoose';

const vocabularySchema = new mongoose.Schema({
  word:           { type: String, required: true },
  normalizedWord: { type: String, index: true },
  meaning:        { type: String, default: '' },
  bengaliMeaning: { type: String, default: '' },
  partOfSpeech:   { type: String, default: '' },
  pronunciation:  { type: String, default: '' },
  audio:          { type: String, default: '' },
  example:        { type: String, default: '' },        // used by UI
  exampleSentence:{ type: String, default: '' },        // legacy alias
  bengaliExample: { type: String, default: '' },
  meanings:       { type: Array, default: [] },         // rich senses array from dictionary
  synonyms:       { type: [String], default: [] },
  antonyms:       { type: [String], default: [] },
  dateAdded:      { type: String },                     // 'YYYY-MM-DD' — daily key
  learnedDate:    { type: String, default: null },      // 'YYYY-MM-DD' — date marked as learned
  revisionStatus: { type: String, default: 'Learning' }, // 'Not Learned' | 'Learning' | 'Learned' | 'Revised'
  favorite:       { type: Boolean, default: false },
  difficulty:     { type: String, default: 'Medium' },
  masteryLevel:   { type: Number, default: 0 },         // 0-5
  lastReviewed:   { type: String, default: null },
  notes:          { type: String, default: '' },
  source:         { type: String, default: 'manual' },  // 'manual' | 'dictionary' | 'wordbank'
}, { timestamps: true });

// Pre-save to ensure normalizedWord is always present
vocabularySchema.pre('save', function (next) {
  if (this.word && !this.normalizedWord) {
    this.normalizedWord = this.word.trim().toLowerCase();
  }
  next();
});

// Indexes for fast queries
vocabularySchema.index({ dateAdded: 1 });
vocabularySchema.index({ learnedDate: 1 });
vocabularySchema.index({ normalizedWord: 1 });
vocabularySchema.index({ favorite: 1 });
vocabularySchema.index({ revisionStatus: 1 });

export default mongoose.model('Vocabulary', vocabularySchema);
