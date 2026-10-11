import express from 'express';
import ExpenseDay from '../models/ExpenseDay.js';

const router = express.Router();

// GET /api/expenses - Get all expenses as a map { [dateKey]: { date, totalAmount, items, notes } }
router.get('/', async (req, res) => {
  try {
    const list = await ExpenseDay.find();
    const map = {};
    for (const doc of list) {
      map[doc.date] = {
        date: doc.date,
        totalAmount: doc.totalAmount || 0,
        items: doc.items || [],
        notes: doc.notes || '',
      };
    }
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/expenses/:dateKey - Get record for a single date
router.get('/:dateKey', async (req, res) => {
  try {
    const doc = await ExpenseDay.findOne({ date: req.params.dateKey });
    if (!doc) {
      return res.json({ date: req.params.dateKey, totalAmount: 0, items: [], notes: '' });
    }
    res.json({
      date: doc.date,
      totalAmount: doc.totalAmount || 0,
      items: doc.items || [],
      notes: doc.notes || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/expenses/:dateKey - Upsert a single date's expense record
router.put('/:dateKey', async (req, res) => {
  try {
    const dateKey = req.params.dateKey;
    const body = req.body || {};
    const items = Array.isArray(body.items) ? body.items : [];
    const totalAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);

    const updated = await ExpenseDay.findOneAndUpdate(
      { date: dateKey },
      {
        $set: {
          date: dateKey,
          totalAmount,
          items,
          notes: body.notes || '',
        },
      },
      { upsert: true, new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/expenses/:dateKey - Clear a date's expense record
router.delete('/:dateKey', async (req, res) => {
  try {
    await ExpenseDay.findOneAndDelete({ date: req.params.dateKey });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/expenses/sync - Bulk sync all dates map { [dateKey]: { date, totalAmount, items, notes } }
router.post('/sync', async (req, res) => {
  try {
    const records = req.body || {};
    const bulkOps = [];
    for (const [dateKey, day] of Object.entries(records)) {
      if (!dateKey) continue;
      const items = Array.isArray(day.items) ? day.items : [];
      const totalAmount = items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
      bulkOps.push({
        updateOne: {
          filter: { date: dateKey },
          update: {
            $set: {
              date: dateKey,
              totalAmount,
              items,
              notes: day.notes || '',
            },
          },
          upsert: true,
        },
      });
    }
    if (bulkOps.length > 0) {
      await ExpenseDay.bulkWrite(bulkOps);
    }
    res.json({ success: true, count: bulkOps.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
