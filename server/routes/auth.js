import express from 'express';
import crypto from 'crypto';
import Auth from '../models/Auth.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'prepos-master-secure-key-2026';

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

function verifyToken(token) {
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

// GET /api/auth/status
router.get('/status', async (req, res) => {
  try {
    const auth = await Auth.findOne();
    res.json({
      isConfigured: !!auth,
      privacyMode: auth ? auth.privacyMode : 'privacy',
      ownerName: auth ? auth.ownerName : 'Subham',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/setup
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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) {
      return res.status(400).json({ error: 'PIN/Password is required.' });
    }

    let auth = await Auth.findOne();
    // Default fallback setup if none created yet
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
      return res.status(401).json({ error: 'Invalid PIN. (Default setup PIN is 1234)' });
    }

    if (!auth.verifyPin(pin)) {
      return res.status(401).json({ error: 'Incorrect PIN / Master Password.' });
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

// POST /api/auth/verify
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

// POST /api/auth/update-pin
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

// POST /api/auth/update-settings
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
