import mongoose from 'mongoose';

const gitaShlokaSchema = new mongoose.Schema({
  date:               { type: String, required: true }, // 'YYYY-MM-DD'
  chapter:            { type: String, default: '' },
  verse:              { type: String, default: '' },
  sanskritText:       { type: String, default: '' },
  transliteration:    { type: String, default: '' },       // legacy — kept for old records
  meaning:            { type: String, default: '' },        // বাংলা ভাবার্থ
  realLifeApplication:{ type: String, default: '' },        // 🌍 বাস্তব জীবনে প্রয়োগ
  studyApplication:   { type: String, default: '' },        // 📚 পড়াশোনায় কীভাবে সাহায্য করবে
  personalReflection: { type: String, default: '' },        // 🧘 ব্যক্তিগত উপলব্ধি
  favorite:           { type: Boolean, default: false },
  updatedAt:          { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('GitaShloka', gitaShlokaSchema);
