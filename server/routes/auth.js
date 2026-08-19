import express from 'express';
import crypto from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import Auth from '../models/Auth.js';
import PasskeyCredential from '../models/PasskeyCredential.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'prepos-master-secure-key-2026';

// Helper to determine RP_ID and expected origin dynamically
function getRpConfig(req) {
  const host = req.hostname || 'localhost';
  // If running on local network / localhost:
  let rpID = 'localhost';
  if (host !== 'localhost' && host !== '127.0.0.1') {
    // strip port if present
    rpID = host.split(':')[0];
  }

  const originHeader = req.get('Origin') || req.get('Referer');
  let expectedOrigin = [`http://localhost:5173`, `http://localhost:3000`, `https://preparation-os.vercel.app`];
  if (originHeader) {
    try {
      const parsed = new URL(originHeader);
      expectedOrigin.push(parsed.origin);
    } catch {
      // ignore
    }
  }

  return {
    rpID,
    rpName: 'Preparation OS',
    expectedOrigin: Array.from(new Set(expectedOrigin)),
  };
}

function generateToken(ownerName) {
  const payload = {
    user: ownerName,
    time: Date.now(),
    expires: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
  };
  const str = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(str).digest('hex');
  return `${str}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [str, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(str).digest('hex');
  if (sig !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(str, 'base64').toString('utf8'));
    if (payload.expires && payload.expires < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── GET /api/auth/status ──────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    let auth = await Auth.findOne();
    const passkeyCount = await PasskeyCredential.countDocuments();
    res.json({
      isConfigured: !!auth,
      privacyMode: auth ? auth.privacyMode : 'privacy',
      ownerName: auth ? auth.ownerName : 'Subham',
      hasPasskeys: passkeyCount > 0,
      passkeyCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/setup ───────────────────────────────────────────────────
router.post('/setup', async (req, res) => {
  try {
    const { pin, ownerName, privacyMode } = req.body;
    if (!pin || String(pin).trim().length < 4) {
      return res.status(400).json({ error: 'PIN must be at least 4 digits/characters.' });
    }
    const existing = await Auth.findOne();
    if (existing) {
      return res.status(400).json({ error: 'Auth is already configured. Use update-pin instead.' });
    }

    const { hash, salt } = Auth.hashPin(pin);
    const auth = await Auth.create({
      pinHash: hash,
      salt,
      ownerName: ownerName || 'Subham',
      privacyMode: privacyMode || 'privacy',
      lastLogin: new Date()
    });

    const token = generateToken(auth.ownerName);
    res.status(201).json({
      success: true,
      token,
      ownerName: auth.ownerName,
      privacyMode: auth.privacyMode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/login (PIN FALLBACK) ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN/Password is required.' });
    }

    let auth = await Auth.findOne();
    if (!auth) {
      const defaultPin = '1234';
      if (String(pin) === defaultPin) {
        const { hash, salt } = Auth.hashPin(defaultPin);
        auth = await Auth.create({
          pinHash: hash,
          salt,
          ownerName: 'Subham',
          privacyMode: 'privacy',
          lastLogin: new Date()
        });
        const token = generateToken(auth.ownerName);
        return res.json({
          success: true,
          token,
          ownerName: auth.ownerName,
          privacyMode: auth.privacyMode,
          isDefault: true
        });
      }
      return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
    }

    if (!auth.verifyPin(pin)) {
      return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
    }

    auth.lastLogin = new Date();
    await auth.save();

    const token = generateToken(auth.ownerName);
    res.json({
      success: true,
      token,
      ownerName: auth.ownerName,
      privacyMode: auth.privacyMode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/verify ──────────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const verified = verifyToken(token);
    if (!verified) {
      return res.status(401).json({ valid: false });
    }
    const auth = await Auth.findOne();
    res.json({
      valid: true,
      user: verified.user,
      privacyMode: auth ? auth.privacyMode : 'privacy'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// ─── WEBAUTHN / PASSKEY REGISTRATION FLOW ──────────────────────────────────
// 1. Generate Registration Options
router.post('/webauthn/register-options', async (req, res) => {
  try {
    const auth = (await Auth.findOne()) || { ownerName: 'Subham' };
    const { rpID, rpName } = getRpConfig(req);

    // Fetch existing credentials to exclude re-registering the same authenticator
    const userCredentials = await PasskeyCredential.find();
    const excludeCredentials = userCredentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports || [],
    }));

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(auth.ownerName || 'subham-user-1')),
      userName: auth.ownerName || 'Subham',
      userDisplayName: auth.ownerName || 'Subham Giri',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    });

    // Save challenge with timestamp for expiration check (valid 5 min)
    let authDoc = await Auth.findOne();
    if (!authDoc) {
      const { hash, salt } = Auth.hashPin('1234');
      authDoc = await Auth.create({ pinHash: hash, salt, ownerName: 'Subham' });
    }
    authDoc.currentChallenge = options.challenge;
    authDoc.challengeTimestamp = new Date();
    await authDoc.save();

    res.json(options);
  } catch (err) {
    console.error('[WebAuthn] Register Options Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Verify Registration Response
router.post('/webauthn/register-verify', async (req, res) => {
  try {
    const { response, deviceName } = req.body;
    if (!response) {
      return res.status(400).json({ error: 'WebAuthn response payload required.' });
    }

    const authDoc = await Auth.findOne();
    if (!authDoc || !authDoc.currentChallenge) {
      return res.status(400).json({ error: 'No active registration challenge found.' });
    }

    // Check challenge age (max 5 minutes)
    if (authDoc.challengeTimestamp && (Date.now() - new Date(authDoc.challengeTimestamp).getTime() > 5 * 60 * 1000)) {
      authDoc.currentChallenge = null;
      await authDoc.save();
      return res.status(400).json({ error: 'Registration challenge expired. Please try again.' });
    }

    const { rpID, expectedOrigin } = getRpConfig(req);
    const expectedChallenge = authDoc.currentChallenge;

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Save credential public key in MongoDB Atlas (NO raw biometrics!)
      const pubKeyBase64 = Buffer.from(credential.publicKey).toString('base64');
      await PasskeyCredential.create({
        credentialId: credential.id,
        publicKey: pubKeyBase64,
        counter: credential.counter,
        transports: credential.transports || response.response?.transports || ['internal', 'hybrid'],
        deviceType: credentialDeviceType || 'singleDevice',
        backedUp: credentialBackedUp || false,
        userId: 'subham-user-1',
        userName: authDoc.ownerName || 'Subham',
        deviceName: deviceName || 'Biometric / Device Passkey',
      });

      // Clear consumed challenge (Replay Protection)
      authDoc.currentChallenge = null;
      await authDoc.save();

      const token = generateToken(authDoc.ownerName || 'Subham');
      return res.json({
        verified: true,
        success: true,
        token,
        message: 'Passkey registered successfully.',
      });
    }

    res.status(400).json({ verified: false, error: 'WebAuthn registration verification failed.' });
  } catch (err) {
    console.error('[WebAuthn] Register Verify Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── WEBAUTHN / PASSKEY AUTHENTICATION FLOW ────────────────────────────────
// 1. Generate Authentication Options
router.post('/webauthn/login-options', async (req, res) => {
  try {
    const { rpID } = getRpConfig(req);
    const credentials = await PasskeyCredential.find();

    const allowCredentials = credentials.map((cred) => ({
      id: cred.credentialId,
      transports: cred.transports || [],
    }));

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
      userVerification: 'preferred',
    });

    let authDoc = await Auth.findOne();
    if (!authDoc) {
      const { hash, salt } = Auth.hashPin('1234');
      authDoc = await Auth.create({ pinHash: hash, salt, ownerName: 'Subham' });
    }
    authDoc.currentChallenge = options.challenge;
    authDoc.challengeTimestamp = new Date();
    await authDoc.save();

    res.json(options);
  } catch (err) {
    console.error('[WebAuthn] Login Options Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Verify Authentication Response
router.post('/webauthn/login-verify', async (req, res) => {
  try {
    const { response } = req.body;
    if (!response || !response.id) {
      return res.status(400).json({ error: 'Invalid WebAuthn response payload.' });
    }

    const authDoc = await Auth.findOne();
    if (!authDoc || !authDoc.currentChallenge) {
      return res.status(400).json({ error: 'No active authentication challenge found.' });
    }

    // Expiration check (5 min)
    if (authDoc.challengeTimestamp && (Date.now() - new Date(authDoc.challengeTimestamp).getTime() > 5 * 60 * 1000)) {
      authDoc.currentChallenge = null;
      await authDoc.save();
      return res.status(400).json({ error: 'Authentication challenge expired. Please try again.' });
    }

    // Lookup passkey credential
    const dbCredential = await PasskeyCredential.findOne({ credentialId: response.id });
    if (!dbCredential) {
      return res.status(404).json({ error: 'Passkey credential not found. Please register or use PIN.' });
    }

    const { rpID, expectedOrigin } = getRpConfig(req);
    const expectedChallenge = authDoc.currentChallenge;
    const publicKeyBytes = Buffer.from(dbCredential.publicKey, 'base64');

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: dbCredential.credentialId,
        publicKey: new Uint8Array(publicKeyBytes),
        counter: dbCredential.counter,
        transports: dbCredential.transports,
      },
      requireUserVerification: false,
    });

    if (verification.verified && verification.authenticationInfo) {
      // Counter validation / Replay attack prevention:
      // If authenticators update counter, it should be >= previous counter
      const newCounter = verification.authenticationInfo.newCounter;
      dbCredential.counter = newCounter;
      dbCredential.lastUsedAt = new Date();
      await dbCredential.save();

      // Invalidate consumed challenge
      authDoc.currentChallenge = null;
      authDoc.lastLogin = new Date();
      await authDoc.save();

      const token = generateToken(authDoc.ownerName || 'Subham');
      return res.json({
        verified: true,
        success: true,
        token,
        ownerName: authDoc.ownerName || 'Subham',
        privacyMode: authDoc.privacyMode || 'privacy',
      });
    }

    res.status(400).json({ verified: false, error: 'WebAuthn authentication verification failed.' });
  } catch (err) {
    console.error('[WebAuthn] Login Verify Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── LIST & DELETE PASSKEYS ────────────────────────────────────────────────
router.get('/webauthn/credentials', async (req, res) => {
  try {
    const credentials = await PasskeyCredential.find().select('-publicKey').sort({ createdAt: -1 });
    res.json(credentials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/webauthn/credentials/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await PasskeyCredential.findOneAndDelete({ $or: [{ _id: id }, { credentialId: id }] });
    res.json({ success: true, message: 'Passkey removed.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── UPDATE PIN / SETTINGS ─────────────────────────────────────────────────
router.post('/update-pin', async (req, res) => {
  try {
    const { currentPin, newPin } = req.body;
    if (!newPin || String(newPin).trim().length < 4) {
      return res.status(400).json({ error: 'New PIN must be at least 4 digits/characters.' });
    }

    let auth = await Auth.findOne();
    if (!auth) {
      const { hash, salt } = Auth.hashPin(newPin);
      auth = await Auth.create({
        pinHash: hash,
        salt,
        ownerName: 'Subham',
        privacyMode: 'privacy'
      });
      const token = generateToken(auth.ownerName);
      return res.json({ success: true, token });
    }

    if (currentPin && !auth.verifyPin(currentPin)) {
      return res.status(401).json({ error: 'Current PIN is incorrect.' });
    }

    const { hash, salt } = Auth.hashPin(newPin);
    auth.pinHash = hash;
    auth.salt = salt;
    await auth.save();

    const token = generateToken(auth.ownerName);
    res.json({ success: true, token, message: 'PIN updated successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/update-settings', async (req, res) => {
  try {
    const { privacyMode, ownerName } = req.body;
    let auth = await Auth.findOne();
    if (!auth) {
      const { hash, salt } = Auth.hashPin('1234');
      auth = await Auth.create({
        pinHash: hash,
        salt,
        ownerName: ownerName || 'Subham',
        privacyMode: privacyMode || 'privacy'
      });
    } else {
      if (privacyMode) auth.privacyMode = privacyMode;
      if (ownerName) auth.ownerName = ownerName;
      await auth.save();
    }
    res.json({ success: true, privacyMode: auth.privacyMode, ownerName: auth.ownerName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
