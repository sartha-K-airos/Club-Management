// src/routes/resourcePersons.js — CRUD for resource persons
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/resource-persons  ?clubId=X&eventId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    if (req.query.eventId) where.eventId = parseInt(req.query.eventId);
    const persons = await prisma.resourcePerson.findMany({ where });
    res.json(persons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/resource-persons
router.post('/', authenticate, async (req, res) => {
  try {
    const person = await prisma.resourcePerson.create({ data: req.body });
    res.status(201).json(person);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/resource-persons/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.resourcePerson.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
