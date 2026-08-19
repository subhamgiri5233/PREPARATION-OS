import express from 'express';
import ErrorLog from '../models/ErrorLog.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    const mockId = req.query.mockTestId || req.query.mockId;
    if (mockId) {
      filter.$or = [{ mockTestId: mockId }, { mockId: mockId }];
    }
    if (req.query.topicId) filter.topicId = req.query.topicId;
    const logs = await ErrorLog.find(filter);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/all', async (req, res) => {
  try {
    const logs = await ErrorLog.find({});
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const mockId = req.body.mockTestId || req.body.mockId;
    const log = await ErrorLog.create({
      ...req.body,
      mockTestId: mockId || null,
      mockId: mockId || null,
      dateAdded: req.body.dateAdded || new Date().toISOString(),
      reviewed: req.body.reviewed ?? false,
      revisionRequired: req.body.revisionRequired ?? false,
      revisionTaskId: req.body.revisionTaskId ?? null,
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
