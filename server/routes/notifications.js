import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ scheduledAt: -1 });
    res.json(notifs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/unread', async (req, res) => {
  try {
    const notifs = await Notification.find({ read: false });
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

    const created = await Notification.create({ ...notif, read: false });
    res.status(201).json(created);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(notif);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
