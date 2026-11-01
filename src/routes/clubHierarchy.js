// src/routes/clubHierarchy.js — CRUD for club hierarchy
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/club-hierarchy  ?clubId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    const members = await prisma.clubHierarchy.findMany({ where, orderBy: { order: 'asc' } });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/club-hierarchy
router.post('/', authenticate, async (req, res) => {
  try {
    const member = await prisma.clubHierarchy.create({ data: req.body });
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/club-hierarchy/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };
    delete data.id;
    const member = await prisma.clubHierarchy.update({ where: { id }, data });
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/club-hierarchy/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.clubHierarchy.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
