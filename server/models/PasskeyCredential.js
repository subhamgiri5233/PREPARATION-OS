import mongoose from 'mongoose';

const passkeyCredentialSchema = new mongoose.Schema({
  credentialId: { type: String, required: true, unique: true, index: true },
  publicKey: { type: String, required: true }, // Base64 encoded or string representation
  counter: { type: Number, required: true, default: 0 },
  transports: [{ type: String }],
  deviceType: { type: String, default: 'singleDevice' }, // 'singleDevice' | 'multiDevice'
  backedUp: { type: Boolean, default: false },
  userId: { type: String, required: true, default: 'subham-user-1' },
  userName: { type: String, default: 'Subham' },
  userDisplayName: { type: String, default: 'Subham' },
  deviceName: { type: String, default: 'Biometric / Passkey Device' },
  lastUsedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('PasskeyCredential', passkeyCredentialSchema);
