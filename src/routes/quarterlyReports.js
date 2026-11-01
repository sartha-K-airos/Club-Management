// src/routes/quarterlyReports.js — CRUD for quarterly reports, status updates
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

// GET /api/quarterly-reports  ?clubId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.clubId) where.clubId = parseInt(req.query.clubId);
    const reports = await prisma.quarterlyReport.findMany({ where });
    res.json(reports.map(parseReport));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quarterly-reports
router.post('/', authenticate, async (req, res) => {
  try {
    const body = { ...req.body };
    const { clubId, clubName, quarter, year, status, superAdminFeedback, ...extra } = body;
    const report = await prisma.quarterlyReport.create({
      data: {
        clubId, clubName, quarter, year,
        status: status || 'submitted',
        superAdminFeedback,
        data: JSON.stringify(extra)
      }
    });
    res.status(201).json(parseReport(report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/quarterly-reports/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, superAdminFeedback } = req.body;
    const updateData = { status };
    if (superAdminFeedback !== undefined) updateData.superAdminFeedback = superAdminFeedback;
    const report = await prisma.quarterlyReport.update({ where: { id }, data: updateData });
    res.json(parseReport(report));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
