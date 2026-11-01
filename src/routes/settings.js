// src/routes/settings.js — GET and PUT for settings (single row, id=1)
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.settings.create({
        data: { id: 1, maintenanceMode: false, registrationOpen: true, collegeName: 'MITS Gwalior' }
      });
    }
    res.json({ ...settings, data: parseJSON(settings.data, {}) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings
router.put('/', authenticate, async (req, res) => {
  try {
    const body = { ...req.body };
    delete body.id;
    // Separate known fields from extra
    const { maintenanceMode, registrationOpen, collegeName, ...extra } = body;
    const updateData = {};
    if (maintenanceMode !== undefined) updateData.maintenanceMode = !!maintenanceMode;
    if (registrationOpen !== undefined) updateData.registrationOpen = !!registrationOpen;
    if (collegeName !== undefined) updateData.collegeName = collegeName;
    if (Object.keys(extra).length > 0) updateData.data = JSON.stringify(extra);

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: updateData,
      create: { id: 1, ...updateData }
    });
    res.json({ ...settings, data: parseJSON(settings.data, {}) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
