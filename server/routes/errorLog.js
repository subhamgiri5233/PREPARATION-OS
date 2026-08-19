import express from 'express';
import ErrorLog from '../models/ErrorLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.mockTestId) filter.mockTestId = req.query.mockTestId;
    if (req.query.topicId) filter.topicId = req.query.topicId;
    const logs = await ErrorLog.find(filter);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const log = await ErrorLog.create({
      ...req.body,
      dateAdded: new Date().toISOString(),
      reviewed: false,
      revisionRequired: req.body.revisionRequired ?? false,
      revisionTaskId: null,
    });
    res.status(201).json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const log = await ErrorLog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await ErrorLog.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
