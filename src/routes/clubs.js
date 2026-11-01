// src/routes/clubs.js — CRUD for clubs, increment members
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await prisma.club.findMany();
    res.json(clubs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/clubs/:id
router.get('/:id', async (req, res) => {
  try {
    const club = await prisma.club.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!club) return res.status(404).json({ error: 'Club not found' });
    res.json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clubs
router.post('/', authenticate, async (req, res) => {
  try {
    const data = req.body;
    // Generate code from name if not provided
    if (!data.code) {
      data.code = data.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    }
    const club = await prisma.club.create({ data });
    res.status(201).json(club);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Club name or code already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/clubs/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };
    delete data.id;
    const club = await prisma.club.update({ where: { id }, data });
    res.json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/clubs/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.club.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clubs/:id/increment-members
router.post('/:id/increment-members', authenticate, async (req, res) => {
  try {
    const club = await prisma.club.update({
      where: { id: parseInt(req.params.id) },
      data: { members: { increment: 1 } }
    });
    res.json(club);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
