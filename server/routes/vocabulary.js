import express from 'express';
import Vocabulary from '../models/Vocabulary.js';

const router = express.Router();

// ─── GET /api/vocabulary ─────────────────────────────────────────────────────
// Supports:
//   ?date=YYYY-MM-DD     → only words for that date (TODAY'S COUNT)
//   ?learnedDate=YYY-MM-DD → alias for compatibility
//   (no params)          → all vocabulary (full history)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    // Accept both 'date' and 'learnedDate' query params for compatibility
    const dateFilter = req.query.date || req.query.learnedDate;
    if (dateFilter) {
      filter.dateAdded = dateFilter;
    }
    const words = await Vocabulary.find(filter).sort({ createdAt: -1 });
    res.json(words);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── GET /api/vocabulary/daily-history ───────────────────────────────────────
// Returns per-day summary: [{ date, count, words: [{word, meaning, bengaliMeaning}] }]
// Used for the Vocabulary History view.
router.get('/daily-history', async (req, res) => {
  try {
    const allWords = await Vocabulary.find({}).sort({ dateAdded: -1, createdAt: -1 });
    const byDate = {};
    for (const w of allWords) {
      const d = w.dateAdded || w.createdAt?.toISOString()?.slice(0, 10) || 'unknown';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({
        _id: w._id,
        word: w.word,
        meaning: w.meaning,
        bengaliMeaning: w.bengaliMeaning,
      });
    }
    const history = Object.entries(byDate)
      .map(([date, words]) => ({ date, count: words.length, words }))
      .sort((a, b) => b.date.localeCompare(a.date));
    res.json(history);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── POST /api/vocabulary ─────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };
    // Ensure dateAdded is always set to today if not provided
    if (!body.dateAdded) {
      body.dateAdded = new Date().toISOString().slice(0, 10);
    }
    const word = await Vocabulary.create(body);
    res.status(201).json(word);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUT /api/vocabulary/:id ──────────────────────────────────────────────────
// NOTE: Editing a word does NOT change its dateAdded, so it never inflates
// today's count even if the word was originally added on a different day.
router.put('/:id', async (req, res) => {
  try {
    // Never allow dateAdded to be changed via edit — preserves correct daily count
    const updates = { ...req.body };
    delete updates.dateAdded;
    const word = await Vocabulary.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(word);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DELETE /api/vocabulary/:id ───────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Vocabulary.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
