// src/routes/events.js — CRUD for events, RSVP/unRSVP
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function parseEvent(e) {
  return { ...e, rsvps: parseJSON(e.rsvps, []) };
}

// GET /api/events  ?upcoming=true&past=true&clubId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);

    let events = await prisma.event.findMany({ where });
    events = events.map(parseEvent);

    const now = new Date().toISOString();
    if (req.query.upcoming === 'true') {
      events = events.filter(e => e.date >= now).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    }
    if (req.query.past === 'true') {
      events = events.filter(e => e.date < now).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(parseEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
router.post('/', authenticate, async (req, res) => {
  try {
    const data = { ...req.body };
    if (Array.isArray(data.rsvps)) data.rsvps = JSON.stringify(data.rsvps);
    if (!data.rsvps) data.rsvps = '[]';
    const event = await prisma.event.create({ data });
    res.status(201).json(parseEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/events/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };
    delete data.id;
    if (Array.isArray(data.rsvps)) data.rsvps = JSON.stringify(data.rsvps);
    const event = await prisma.event.update({ where: { id }, data });
    res.json(parseEvent(event));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.body.userId;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const rsvps = parseJSON(event.rsvps, []);
    if (!rsvps.includes(userId)) {
      rsvps.push(userId);
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { rsvps: JSON.stringify(rsvps) }
    });
    res.json(parseEvent(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id/rsvp
router.delete('/:id/rsvp', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.body.userId;
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    let rsvps = parseJSON(event.rsvps, []);
    rsvps = rsvps.filter(uid => uid !== userId);

    const updated = await prisma.event.update({
      where: { id },
      data: { rsvps: JSON.stringify(rsvps) }
    });
    res.json(parseEvent(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
