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

// Mock Subject Results
router.get('/subject-results', async (req, res) => {
  try {
    const filter = {};
    if (req.query.mockTestId) filter.mockTestId = req.query.mockTestId;
    const results = await MockSubjectResult.find(filter);
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/subject-results/bulk', async (req, res) => {
  try {
    const results = await MockSubjectResult.insertMany(req.body);
    res.status(201).json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
