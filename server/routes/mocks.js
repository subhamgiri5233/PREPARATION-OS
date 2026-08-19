import express from 'express';
import MockTest from '../models/MockTest.js';
import MockSubjectResult from '../models/MockSubjectResult.js';

const router = express.Router();

// Mock Tests
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.preparationAreaId) filter.preparationAreaId = req.query.preparationAreaId;
    const mocks = await MockTest.find(filter).sort({ date: -1 });
    res.json(mocks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const mock = await MockTest.create(req.body);
    res.status(201).json(mock);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const mock = await MockTest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(mock);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await MockTest.findByIdAndDelete(req.params.id);
    await MockSubjectResult.deleteMany({ mockTestId: req.params.id });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Mock Subject Results
router.get('/subject-results', async (req, res) => {
  try {
    const filter = {};
    if (req.query.mockTestId) filter.mockTestId = req.query.mockTestId;
    const results = await MockSubjectResult.find(filter);
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

import ErrorLog from '../models/ErrorLog.js';

// Mock Errors by Mock ID
router.get('/:mockId/errors', async (req, res) => {
  try {
    const mockId = req.params.mockId;
    const logs = await ErrorLog.find({
      $or: [{ mockTestId: mockId }, { mockId: mockId }]
    });
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
