import express from 'express';
import { lookupEnglishWord } from '../services/dictionaryService.js';
import SearchHistory from '../models/SearchHistory.js';

const router = express.Router();

// ─── GET /api/dictionary/history ─────────────────────────────────────────────
// Returns recent search history (up to 30 unique recent words)
router.get('/history', async (req, res) => {
  try {
    const history = await SearchHistory.find()
      .sort({ searchedAt: -1 })
      .limit(60);

    // Filter unique words in order
    const seen = new Set();
    const unique = [];
    for (const h of history) {
      if (!seen.has(h.normalizedWord)) {
        seen.add(h.normalizedWord);
        unique.push({ word: h.word, normalizedWord: h.normalizedWord });
        if (unique.length >= 30) break;
      }
    }
    res.json(unique);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/dictionary/:word ───────────────────────────────────────────────
// Looks up English word in dictionary + Bengali translations + cache
router.get('/:word', async (req, res) => {
  try {
    const { word } = req.params;
    if (!word || !word.trim()) {
      return res.status(400).json({ error: 'Please provide a valid word to search.' });
    }

    const normalizedWord = word.trim().toLowerCase();
    const result = await lookupEnglishWord(normalizedWord);

    if (!result) {
      return res.status(404).json({
        error: 'Word not found. Please check the spelling and try again.',
        word: word.trim()
      });
    }

    // Save to SearchHistory asynchronously
    try {
      await SearchHistory.create({
        word: result.word || word.trim(),
        normalizedWord
      });
    } catch (_) {}

    res.json(result);
  } catch (err) {
    console.error('[Dictionary API Error]', err.message);
    res.status(500).json({
      error: 'Dictionary service is temporarily unavailable. Please try again.'
    });
  }
});

export default router;
