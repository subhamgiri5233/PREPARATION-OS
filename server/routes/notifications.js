import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.unread === 'true') filter.read = false;
    if (req.query.dismissed === 'false') filter.dismissed = false;
    const notifs = await Notification.find(filter).sort({ createdAt: -1 });
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/unread', async (req, res) => {
  try {
    const notifs = await Notification.find({ read: false, dismissed: { $ne: true } });
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const notif = req.body;
    const today = new Date().toISOString().slice(0, 10);

    // Idempotency check
    if (notif.idempotencyKey) {
      const existing = await Notification.findOne({ idempotencyKey: notif.idempotencyKey });
      if (existing) return res.json(existing);
    } else {
      const existing = await Notification.findOne({
        type: notif.type,
        title: notif.title,
        scheduledAt: { $regex: `^${today}` },
      });
      if (existing) return res.json(existing);
    }

    const created = await Notification.create({ ...notif, read: false, dismissed: false });
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/', async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
