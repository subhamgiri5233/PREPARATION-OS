import mongoose from 'mongoose';

const dictionaryCacheSchema = new mongoose.Schema({
  word:           { type: String, required: true, unique: true, index: true },
  normalizedWord: { type: String, required: true, unique: true, index: true },
  phonetic:       { type: String, default: '' },
  audio:          { type: String, default: '' },
  bengaliMeanings:{ type: [String], default: [] },
  primaryBengali: { type: String, default: '' },
  meanings: [{
    partOfSpeech:   { type: String, default: '' },
    bengaliMeaning: { type: String, default: '' },
    definitions: [{
      definition:        { type: String, default: '' },
      bengaliDefinition: { type: String, default: '' },
      example:           { type: String, default: '' },
      bengaliExample:    { type: String, default: '' },
      synonyms:          { type: [String], default: [] },
      antonyms:          { type: [String], default: [] }
    }],
    synonyms: { type: [String], default: [] },
    antonyms: { type: [String], default: [] }
  }],
  synonyms: { type: [String], default: [] },
  antonyms: { type: [String], default: [] },
  source:   { type: String, default: 'api' }
}, { timestamps: true });

// TTL index to automatically refresh cache after 30 days if desired
dictionaryCacheSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('DictionaryCache', dictionaryCacheSchema);
