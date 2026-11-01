// src/routes/eventFeedback.js — CRUD for event feedback (prevent duplicates)
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function parseFeedback(f) {
  return { ...f, categories: parseJSON(f.categories, []) };
}

// GET /api/event-feedback  ?eventId=X&clubId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.eventId) where.eventId = parseInt(req.query.eventId);
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    const feedback = await prisma.eventFeedback.findMany({ where });
    res.json(feedback.map(parseFeedback));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/event-feedback
router.post('/', authenticate, async (req, res) => {
  try {
    const data = { ...req.body };

    // Prevent duplicate feedback from same student for same event
    const existing = await prisma.eventFeedback.findFirst({
      where: { eventId: data.eventId, studentId: data.studentId }
    });
    if (existing) {
      return res.status(409).json({ success: false, error: 'You have already submitted feedback for this event' });
    }

    // Stringify categories if it's an array
    if (Array.isArray(data.categories)) {
      data.categories = JSON.stringify(data.categories);
    }

    const feedback = await prisma.eventFeedback.create({ data });
    res.status(201).json({ success: true, feedback: parseFeedback(feedback) });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
