import express from 'express';
import RevisionTask from '../models/RevisionTask.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.dueDate) filter.dueDate = req.query.dueDate;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.overdueBefore) {
      filter.dueDate = { $lt: req.query.overdueBefore };
      filter.status = 'Pending';
    }
    const revisions = await RevisionTask.find(filter);
    res.json(revisions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const revision = await RevisionTask.create(req.body);
    res.status(201).json(revision);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', async (req, res) => {
  try {
    const revisions = await RevisionTask.insertMany(req.body);
    res.status(201).json(revisions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const revision = await RevisionTask.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(revision);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
