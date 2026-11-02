// src/routes/users.js — CRUD for users
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  safe.clubMemberships = parseJSON(safe.clubMemberships, []);
  return safe;
}

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const data = { ...req.body };
    // Never allow password update through this route
    delete data.passwordHash;
    delete data.password;
    delete data.id;
    // Stringify clubMemberships if it's an array
    if (Array.isArray(data.clubMemberships)) {
      data.clubMemberships = JSON.stringify(data.clubMemberships);
    }
    const user = await prisma.user.update({ where: { id }, data });
    const dataRouter = require('./data');
    if (dataRouter.invalidateCache) dataRouter.invalidateCache();
    res.json(sanitizeUser(user));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id/membership
router.put('/:id/membership', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { clubId, action } = req.body;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let memberships = parseJSON(user.clubMemberships, []);

    if (action === 'add') {
      if (!memberships.includes(clubId)) {
        memberships.push(clubId);
      }
    } else if (action === 'remove') {
      memberships = memberships.filter(cid => cid !== clubId);
    } else {
      return res.status(400).json({ error: 'action must be "add" or "remove"' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { clubMemberships: JSON.stringify(memberships) }
    });

    res.json(sanitizeUser(updated));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
