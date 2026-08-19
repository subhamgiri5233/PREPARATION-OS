import express from 'express';
import DailyProgress from '../models/DailyProgress.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    if (req.query.startDate && req.query.endDate) {
      filter.date = { $gte: req.query.startDate, $lte: req.query.endDate };
    }
    const progress = await DailyProgress.find(filter);
    res.json(progress);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upsert a daily progress record
router.post('/upsert', async (req, res) => {
  try {
    const { date, ...updates } = req.body;
    const progress = await DailyProgress.findOneAndUpdate(
      { date },
      { $set: updates },
      { upsert: true, new: true }
    );
    res.json(progress);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
