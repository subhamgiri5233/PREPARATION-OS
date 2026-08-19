import express from 'express';
import StudyResource from '../models/StudyResource.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.topicId) filter.topicId = req.query.topicId;
    if (req.query.preparationAreaId) filter.preparationAreaId = req.query.preparationAreaId;
    const resources = await StudyResource.find(filter);
    res.json(resources);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const resource = await StudyResource.create(req.body);
    res.status(201).json(resource);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', async (req, res) => {
  try {
    const resources = await StudyResource.insertMany(req.body);
    res.status(201).json(resources);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const resource = await StudyResource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(resource);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await StudyResource.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
