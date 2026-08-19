import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// GET /api/settings - get the single settings document
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings - update (or create) settings
router.put('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (settings) {
      Object.assign(settings, req.body);
      await settings.save();
    } else {
      settings = await Settings.create(req.body);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
