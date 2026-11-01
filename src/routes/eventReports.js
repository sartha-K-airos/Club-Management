// src/routes/eventReports.js — CRUD for event reports, status updates
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function parseReport(r) {
  return { ...r, data: parseJSON(r.data, {}) };
}

// GET /api/event-reports  ?clubId=X&eventId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    if (req.query.eventId) where.eventId = parseInt(req.query.eventId);
    const reports = await prisma.eventReport.findMany({ where });
    res.json(reports.map(parseReport));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/event-reports
router.post('/', authenticate, async (req, res) => {
  try {
    const body = { ...req.body };
    // Separate extra fields into data JSON
    const { eventId, eventTitle, clubId, clubName, status, superAdminRemarks, ...extra } = body;
    const report = await prisma.eventReport.create({
      data: {
        eventId, eventTitle, clubId, clubName,
        status: status || 'submitted',
        superAdminRemarks,
        data: JSON.stringify(extra)
      }
    });
    res.status(201).json(parseReport(report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/event-reports/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, superAdminRemarks } = req.body;
    const updateData = { status };
    if (superAdminRemarks !== undefined) updateData.superAdminRemarks = superAdminRemarks;
    const report = await prisma.eventReport.update({ where: { id }, data: updateData });
    res.json(parseReport(report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
