import express from 'express';
import Chapter from '../models/Chapter.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.preparationAreaId) filter.preparationAreaId = req.query.preparationAreaId;
    const chapters = await Chapter.find(filter).sort({ order: 1 });
    res.json(chapters);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const chapter = await Chapter.create(req.body);
    res.status(201).json(chapter);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', async (req, res) => {
  try {
    const chapters = await Chapter.insertMany(req.body);
    res.status(201).json(chapters);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const chapter = await Chapter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(chapter);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Chapter.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
