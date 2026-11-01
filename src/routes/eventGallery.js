// src/routes/eventGallery.js — CRUD for event gallery
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/event-gallery  ?clubId=X&eventId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    if (req.query.eventId) where.eventId = parseInt(req.query.eventId);
    const photos = await prisma.eventGallery.findMany({ where });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/event-gallery
router.post('/', authenticate, async (req, res) => {
  try {
    const photo = await prisma.eventGallery.create({ data: req.body });
    res.status(201).json(photo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/event-gallery/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.eventGallery.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
