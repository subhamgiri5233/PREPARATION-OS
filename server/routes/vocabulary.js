import express from 'express';
import Vocabulary from '../models/Vocabulary.js';
import VocabularyReview from '../models/VocabularyReview.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.dateAdded = req.query.date;
    const words = await Vocabulary.find(filter).sort({ dateAdded: -1 });
    res.json(words);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const word = await Vocabulary.create(req.body);
    res.status(201).json(word);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const word = await Vocabulary.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(word);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Vocabulary.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const reviews = await VocabularyReview.find({ vocabularyId: req.params.id });
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reviews', async (req, res) => {
  try {
    const review = await VocabularyReview.create(req.body);
    res.status(201).json(review);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
