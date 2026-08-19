import mongoose from 'mongoose';

const teachingScheduleSchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true }, // 0=Sunday, 1=Monday...6=Saturday
  startTime: { type: String, required: true }, // 'HH:MM'
  endTime: { type: String, required: true },   // 'HH:MM'
  label: { type: String, default: '' },
  subject: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('TeachingSchedule', teachingScheduleSchema);
