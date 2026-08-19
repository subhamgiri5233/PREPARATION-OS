import express from 'express';
import TeachingSchedule from '../models/TeachingSchedule.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const schedule = await TeachingSchedule.find();
    res.json(schedule);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const slot = await TeachingSchedule.create(req.body);
    res.status(201).json(slot);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const slot = await TeachingSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(slot);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await TeachingSchedule.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
