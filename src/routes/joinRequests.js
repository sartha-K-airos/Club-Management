// src/routes/joinRequests.js — CRUD for join requests, status updates
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

// GET /api/join-requests  ?clubId=X&studentId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    if (req.query.studentId) where.studentId = parseInt(req.query.studentId);
    const requests = await prisma.joinRequest.findMany({ where });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/join-requests
router.post('/', authenticate, async (req, res) => {
  try {
    const data = req.body;
    // Check for duplicate pending request
    const existing = await prisma.joinRequest.findFirst({
      where: { clubId: data.clubId, studentId: data.studentId, status: 'pending' }
    });
    if (existing) {
      return res.status(409).json({ error: 'You already have a pending request for this club' });
    }
    const request = await prisma.joinRequest.create({ data });
    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/join-requests/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const request = await prisma.joinRequest.update({
      where: { id },
      data: { status }
    });

    // On approve: add club membership to user and increment club members
    if (status === 'approved') {
      const user = await prisma.user.findUnique({ where: { id: request.studentId } });
      if (user) {
        let memberships = parseJSON(user.clubMemberships, []);
        if (!memberships.includes(request.clubId)) {
          memberships.push(request.clubId);
          await prisma.user.update({
            where: { id: request.studentId },
            data: { clubMemberships: JSON.stringify(memberships) }
          });
          await prisma.club.update({
            where: { id: request.clubId },
            data: { members: { increment: 1 } }
          });
        }
      }
    }

    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
