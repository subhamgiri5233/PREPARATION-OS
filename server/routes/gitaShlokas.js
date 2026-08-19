import express from 'express';
import GitaShloka from '../models/GitaShloka.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const shlokas = await GitaShloka.find().sort({ date: -1 });
    res.json(shlokas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/today', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const shloka = await GitaShloka.findOne({ date: today });
    res.json(shloka || null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const shloka = await GitaShloka.findById(req.params.id);
    res.json(shloka);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    const shloka = await GitaShloka.create({
      date: req.body.date || today,
      chapter: req.body.chapter ? String(req.body.chapter) : '',
      verse: req.body.verse ? String(req.body.verse) : '',
      sanskritText: req.body.sanskritText || '',
      transliteration: req.body.transliteration || '',
      meaning: req.body.meaning || '',
      personalReflection: req.body.personalReflection || '',
      favorite: !!req.body.favorite,
      updatedAt: now,
    });
    res.status(201).json(shloka);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const shloka = await GitaShloka.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date().toISOString() },
      { new: true }
    );
    res.json(shloka);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/favorite', async (req, res) => {
  try {
    const shloka = await GitaShloka.findById(req.params.id);
    if (!shloka) return res.status(404).json({ error: 'Not found' });
    shloka.favorite = !shloka.favorite;
    shloka.updatedAt = new Date().toISOString();
    await shloka.save();
    res.json(shloka);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await GitaShloka.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
