import express from 'express';
import Vocabulary from '../models/Vocabulary.js';

const router = express.Router();

// ─── GET /api/vocabulary ─────────────────────────────────────────────────────
// Supports:
//   ?date=YYYY-MM-DD        → words added on that date
//   ?learnedDate=YYYY-MM-DD → words learned on that date
//   ?status=Learning        → filter by revisionStatus ('Not Learned' | 'Learning' | 'Learned')
//   ?favorite=true          → filter favorites
//   ?q=searchterm           → search words or meanings
router.get('/', async (req, res) => {
  try {
    const filter = {};
    const dateFilter = req.query.date;
    if (dateFilter) {
      filter.dateAdded = dateFilter;
    }
    if (req.query.learnedDate) {
      filter.learnedDate = req.query.learnedDate;
    }
    if (req.query.status) {
      filter.revisionStatus = req.query.status;
    }
    if (req.query.favorite === 'true') {
      filter.favorite = true;
    }
    if (req.query.q) {
      const q = req.query.q.trim();
      filter.$or = [
        { word: { $regex: q, $options: 'i' } },
        { meaning: { $regex: q, $options: 'i' } },
        { bengaliMeaning: { $regex: q, $options: 'i' } },
      ];
    }

    const words = await Vocabulary.find(filter).sort({ createdAt: -1 });
    res.json(words);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/vocabulary/daily-history ───────────────────────────────────────
// Returns per-day summary: [{ date, count, words: [...] }]
router.get('/daily-history', async (req, res) => {
  try {
    const allWords = await Vocabulary.find({}).sort({ dateAdded: -1, createdAt: -1 });
    const byDate = {};
    for (const w of allWords) {
      const d = w.dateAdded || w.createdAt?.toISOString()?.slice(0, 10) || 'unknown';
      if (!byDate[d]) byDate[d] = [];
      byDate[d].push({
        _id: w._id,
        id: w._id,
        word: w.word,
        meaning: w.meaning,
        bengaliMeaning: w.bengaliMeaning,
        revisionStatus: w.revisionStatus,
        favorite: w.favorite,
        example: w.example,
        synonyms: w.synonyms,
        antonyms: w.antonyms,
      });
    }
    const history = Object.entries(byDate)
      .map(([date, words]) => ({ date, count: words.length, words }))
      .sort((a, b) => b.date.localeCompare(a.date));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/vocabulary ─────────────────────────────────────────────────────
// Adds a word to My Vocabulary (prevents duplicates by normalizedWord)
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.word || !body.word.trim()) {
      return res.status(400).json({ error: 'Word is required' });
    }

    const normalizedWord = body.word.trim().toLowerCase();
    body.normalizedWord = normalizedWord;

    if (!body.dateAdded) {
      body.dateAdded = new Date().toISOString().slice(0, 10);
    }
    if (!body.revisionStatus) {
      body.revisionStatus = 'Learning';
    }

    // Duplicate check: if the word already exists in My Vocabulary, update with fresh dictionary details
    const existing = await Vocabulary.findOne({ normalizedWord });
    if (existing) {
      // Merge new fields if present
      const updates = { ...body };
      delete updates.dateAdded; // preserve original dateAdded
      const updated = await Vocabulary.findByIdAndUpdate(existing._id, updates, { new: true });
      return res.status(200).json(updated);
    }

    const word = await Vocabulary.create(body);
    res.status(201).json(word);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/vocabulary/:id/learn ─────────────────────────────────────────
// Marks a word as 'Learned' / 'Studied' for today (increments study counter)
router.patch('/:id/learn', async (req, res) => {
  try {
    const { status, learnedDate } = req.body;
    const targetStatus = status || 'Learned';
    const date = learnedDate || new Date().toISOString().slice(0, 10);

    const updated = await Vocabulary.findByIdAndUpdate(
      req.params.id,
      {
        revisionStatus: targetStatus,
        learnedDate: targetStatus === 'Learned' ? date : null,
        lastReviewed: date
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Word not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH /api/vocabulary/:id/favorite ──────────────────────────────────────
router.patch('/:id/favorite', async (req, res) => {
  try {
    const word = await Vocabulary.findById(req.params.id);
    if (!word) return res.status(404).json({ error: 'Word not found' });
    word.favorite = !word.favorite;
    await word.save();
    res.json(word);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/vocabulary/:id ──────────────────────────────────────────────────
// Updates word data (preserves original dateAdded)
router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.dateAdded; // Never allow dateAdded to be modified on edit
    const word = await Vocabulary.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!word) return res.status(404).json({ error: 'Word not found' });
    res.json(word);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/vocabulary/:id ───────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Vocabulary.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
