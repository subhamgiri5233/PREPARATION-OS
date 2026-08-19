import express from 'express';
import StudySession from '../models/StudySession.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    let sessions;
    if (req.query.date) {
      sessions = await StudySession.find({
        startTime: { $regex: `^${req.query.date}` }
      }).sort({ startTime: -1 });
    } else if (req.query.startDate && req.query.endDate) {
      sessions = await StudySession.find({
        startTime: { $gte: req.query.startDate, $lte: req.query.endDate + 'T23:59:59' }
      }).sort({ startTime: -1 });
    } else {
      sessions = await StudySession.find().sort({ startTime: -1 });
    }
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const session = await StudySession.create(req.body);
    res.status(201).json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const session = await StudySession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await StudySession.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
