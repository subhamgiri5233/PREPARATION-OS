import express from 'express';
import PreparationArea from '../models/PreparationArea.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const areas = await PreparationArea.find().sort({ priority: 1 });
    res.json(areas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const area = await PreparationArea.create(req.body);
    res.status(201).json(area);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const area = await PreparationArea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(area);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await PreparationArea.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
