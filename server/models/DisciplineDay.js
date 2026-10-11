import mongoose from 'mongoose';

const disciplineDaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  rules: { type: mongoose.Schema.Types.Mixed, default: {} },
  withdrawalStatus: { type: String, default: null }, // null | 'WR' | 'WD' | 'BOTH'
  withdrawalAmount: { type: Number, default: 0 },
  withdrawals: {
    WR: { type: Boolean, default: false },
    WD: { type: Boolean, default: false },
  },
  notes: { type: String, default: '' },
  tasks: { type: Array, default: [] },
}, { timestamps: true });

export default mongoose.model('DisciplineDay', disciplineDaySchema);
