import mongoose from 'mongoose';

const gitaShlokaSchema = new mongoose.Schema({
  date:               { type: String, required: true }, // 'YYYY-MM-DD'
  chapter:            { type: String, default: '' },
  verse:              { type: String, default: '' },
  sanskritText:       { type: String, default: '' },
  transliteration:    { type: String, default: '' },    // kept for legacy data
  meaning:            { type: String, default: '' },
  realLifeApplication:{ type: String, default: '' },    // NEW: how shloka applies in real life
  personalReflection: { type: String, default: '' },
  favorite:           { type: Boolean, default: false },
  updatedAt:          { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('GitaShloka', gitaShlokaSchema);
