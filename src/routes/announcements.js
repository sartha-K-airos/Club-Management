// src/routes/announcements.js — CRUD for announcements
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/announcements  ?clubId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    const anns = await prisma.announcement.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(anns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements
router.post('/', authenticate, async (req, res) => {
  try {
    const ann = await prisma.announcement.create({ data: req.body });
    res.status(201).json(ann);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
