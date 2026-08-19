import express from 'express';
import Topic from '../models/Topic.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.preparationAreaId) filter.preparationAreaId = req.query.preparationAreaId;
    if (req.query.courseId) filter.courseId = req.query.courseId;
    if (req.query.chapterId) filter.chapterId = req.query.chapterId;
    const topics = await Topic.find(filter);
    res.json(topics);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const topic = await Topic.findById(req.params.id);
    res.json(topic);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const body = req.body;
    // Sync completionPercent / completionPercentage
    if (body.completionPercentage !== undefined && body.completionPercent === undefined) {
      body.completionPercent = body.completionPercentage;
    }
    if (body.completionPercent !== undefined && body.completionPercentage === undefined) {
      body.completionPercentage = body.completionPercent;
    }
    const topic = await Topic.create(body);
    res.status(201).json(topic);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/bulk', async (req, res) => {
  try {
    const topics = await Topic.insertMany(req.body);
    res.status(201).json(topics);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    // Sync completionPercent / completionPercentage
    if (updates.completionPercentage !== undefined && updates.completionPercent === undefined) {
      updates.completionPercent = updates.completionPercentage;
    } else if (updates.completionPercent !== undefined && updates.completionPercentage === undefined) {
      updates.completionPercentage = updates.completionPercent;
    }
    if (updates.estimatedHours !== undefined && updates.estimatedMinutes === undefined) {
      updates.estimatedMinutes = updates.estimatedHours * 60;
    } else if (updates.estimatedMinutes !== undefined && updates.estimatedHours === undefined) {
      updates.estimatedHours = updates.estimatedMinutes / 60;
    }
    const topic = await Topic.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(topic);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Topic.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
