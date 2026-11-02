// src/routes/auth.js — Register, Login, Logout, Me
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { authenticate, optionalAuth } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'mits-studenthub-jwt-secret-change-in-production-2026';
const SALT_ROUNDS = 12;

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function setTokenCookie(res, token) {
  res.cookie('mits_token', token, {
    httpOnly: true,
    secure: false, // set true in production with HTTPS
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  // Parse JSON fields
  safe.clubMemberships = parseJSON(safe.clubMemberships, []);
  return safe;
}

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, rollNo, year, phone, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Check rollNo uniqueness if provided
    if (rollNo) {
      const existingRoll = await prisma.user.findUnique({ where: { rollNo } });
      if (existingRoll) {
        return res.status(409).json({ error: 'Roll number already registered' });
      }
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'student',
        department: department || null,
        rollNo: rollNo || null,
        year: year || null,
        phone: phone || null,
        avatar: avatar || null,
        clubMemberships: JSON.stringify([])
      }
    });

    const token = generateToken(user);
    setTokenCookie(res, token);

    const dataRouter = require('./data');
    if (dataRouter.invalidateCache) dataRouter.invalidateCache();

    res.status(201).json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', message: err.message });
  }
});

let _maintenanceCache = { enabled: false, checkedAt: 0 };
async function isMaintenanceMode() {
  const now = Date.now();
  if (now - _maintenanceCache.checkedAt < 60000) {
    return _maintenanceCache.enabled;
  }
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    _maintenanceCache = { enabled: !!settings?.maintenanceMode, checkedAt: now };
    return _maintenanceCache.enabled;
  } catch (e) {
    return false;
  }
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check maintenance mode for students with fast memory cache
    if (user.role === 'student') {
      const inMaintenance = await isMaintenanceMode();
      if (inMaintenance) {
        return res.status(503).json({ error: 'System is under maintenance. Please try again later.' });
      }
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', message: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('mits_token');
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.json({ user: null });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.json({ user: null });
  }
});

module.exports = router;
