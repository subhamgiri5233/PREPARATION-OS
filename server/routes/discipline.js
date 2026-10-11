import express from 'express';
import DisciplineDay from '../models/DisciplineDay.js';

const router = express.Router();

// GET /api/discipline - Get all discipline records as a map { [dateKey]: record }
router.get('/', async (req, res) => {
  try {
    const list = await DisciplineDay.find();
    const map = {};
    for (const doc of list) {
      map[doc.date] = {
        date: doc.date,
        rules: doc.rules || {},
        withdrawalStatus: doc.withdrawalStatus,
        withdrawalAmount: doc.withdrawalAmount || 0,
        withdrawals: doc.withdrawals || { WR: false, WD: false },
        notes: doc.notes || '',
        tasks: doc.tasks || [],
      };
    }
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/discipline/:dateKey - Get record for a single date
router.get('/:dateKey', async (req, res) => {
  try {
    const doc = await DisciplineDay.findOne({ date: req.params.dateKey });
    if (!doc) {
      return res.json(null);
    }
    res.json({
      date: doc.date,
      rules: doc.rules || {},
      withdrawalStatus: doc.withdrawalStatus,
      withdrawalAmount: doc.withdrawalAmount || 0,
      withdrawals: doc.withdrawals || { WR: false, WD: false },
      notes: doc.notes || '',
      tasks: doc.tasks || [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/discipline/:dateKey - Upsert a single date's record
router.put('/:dateKey', async (req, res) => {
  try {
    const dateKey = req.params.dateKey;
    const body = req.body || {};
    const updated = await DisciplineDay.findOneAndUpdate(
      { date: dateKey },
      {
        $set: {
          date: dateKey,
          rules: body.rules || {},
          withdrawalStatus: body.withdrawalStatus ?? null,
          withdrawalAmount: Number(body.withdrawalAmount) || 0,
          withdrawals: body.withdrawals || { WR: false, WD: false },
          notes: body.notes || '',
          tasks: body.tasks || [],
        },
      },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/discipline/sync - Bulk sync multiple dates
router.post('/sync', async (req, res) => {
  try {
    const records = req.body || {};
    const bulkOps = [];
    for (const [dateKey, item] of Object.entries(records)) {
      if (!dateKey) continue;
      bulkOps.push({
        updateOne: {
          filter: { date: dateKey },
          update: {
            $set: {
              date: dateKey,
              rules: item.rules || {},
              withdrawalStatus: item.withdrawalStatus ?? null,
              withdrawalAmount: Number(item.withdrawalAmount) || 0,
              withdrawals: item.withdrawals || { WR: false, WD: false },
              notes: item.notes || '',
              tasks: item.tasks || [],
            },
          },
          upsert: true,
        },
      });
    }
    if (bulkOps.length > 0) {
      await DisciplineDay.bulkWrite(bulkOps);
    }
    res.json({ success: true, count: bulkOps.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
