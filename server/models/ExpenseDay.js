import mongoose from 'mongoose';

const expenseItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'Personal Use' },
  baseCategory: { type: String, default: 'Personal Use' },
  borrowerName: { type: String, default: '' },
  isLoan: { type: Boolean, default: false },
  loanStatus: { type: String, default: null }, // 'pending' | 'repaid' | null
  loanGivenDate: { type: String, default: null },
  lastCheckedDate: { type: String, default: null },
  lastCheckedResponse: { type: String, default: null },
  repaidDate: { type: String, default: null },
  timestamp: { type: String },
}, { _id: false });

const expenseDaySchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
  totalAmount: { type: Number, default: 0 },
  items: [expenseItemSchema],
  notes: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('ExpenseDay', expenseDaySchema);
