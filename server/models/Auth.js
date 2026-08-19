import mongoose from 'mongoose';
import crypto from 'crypto';

const authSchema = new mongoose.Schema({
  pinHash: { type: String, required: true },
  salt: { type: String, required: true },
  privacyMode: { type: String, enum: ['privacy', 'lockdown'], default: 'privacy' },
  ownerName: { type: String, default: 'Subham' },
  lastLogin: { type: Date },
  currentChallenge: { type: String },
  challengeTimestamp: { type: Date },
}, { timestamps: true });

authSchema.methods.verifyPin = function(pin) {
  const hash = crypto.pbkdf2Sync(String(pin), this.salt, 1000, 64, 'sha512').toString('hex');
  return this.pinHash === hash;
};

authSchema.statics.hashPin = function(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(pin), salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
};

export default mongoose.model('Auth', authSchema);
