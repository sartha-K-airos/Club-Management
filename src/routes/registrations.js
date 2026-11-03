// src/routes/registrations.js — CRUD for event registrations, attendance marking
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { generatePassToken, generateQRDataUrl } = require('../lib/passToken');

// GET /api/registrations  ?eventId=X&studentId=X
router.get('/', async (req, res) => {
  try {
    let where = {};
    if (req.query.eventId) where.eventId = parseInt(req.query.eventId);
    if (req.query.studentId) where.studentId = parseInt(req.query.studentId);
    const regs = await prisma.eventRegistration.findMany({ where, orderBy: { id: 'desc' } });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/registrations (Free and Direct registrations)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const data = { ...req.body };
    const eventId = parseInt(data.eventId);
    const studentId = parseInt(req.user?.id || data.studentId || 1);

    // Check for duplicate registration
    const existing = await prisma.eventRegistration.findFirst({
      where: { eventId, studentId }
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Already registered for this event',
        registration: existing
      });
    }

    // Generate registration code if not provided
    if (!data.registrationCode) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      data.registrationCode = `REG-${eventId}-${rand}`;
    }

    // Generate signed pass token and QR
    const passToken = generatePassToken({
      registrationCode: data.registrationCode,
      eventId,
      studentId
    });
    const qrDataUrl = await generateQRDataUrl(passToken);

    const reg = await prisma.eventRegistration.create({
      data: {
        registrationCode: data.registrationCode,
        eventId,
        studentId,
        studentName: data.studentName || req.user?.name || 'Student',
        email: data.email || req.user?.email,
        rollNo: data.rollNo || req.user?.rollNo,
        branch: data.branch || data.department || 'Engineering',
        year: data.year,
        phone: data.phone,
        isPaid: !!data.isPaid,
        amountPaid: parseFloat(data.amountPaid || 0),
        paymentStatus: data.paymentStatus || (data.isPaid ? 'PAID' : 'FREE'),
        paymentMethod: data.paymentMethod || (data.isPaid ? 'Online Gateway' : 'Complimentary Free Pass'),
        transactionId: data.transactionId || 'FREE-ENTRY',
        passToken,
        attended: false
      }
    });

    // Also sync student into event.rsvps
    try {
      const ev = await prisma.event.findUnique({ where: { id: eventId } });
      if (ev) {
        let rsvps = [];
        try { rsvps = JSON.parse(ev.rsvps || '[]'); } catch (e) { rsvps = []; }
        if (!rsvps.includes(studentId)) {
          rsvps.push(studentId);
          await prisma.event.update({
            where: { id: eventId },
            data: { rsvps: JSON.stringify(rsvps) }
          });
        }
      }
    } catch (e) { console.error('RSVP sync error:', e); }

    const dataRouter = require('./data');
    if (dataRouter.invalidateCache) dataRouter.invalidateCache();

    res.status(201).json({ success: true, registration: reg, qrDataUrl, passToken });
  } catch (err) {
    console.error('Registration create error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/registrations/:id/attendance
router.put('/:id/attendance', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { attended } = req.body;
    const reg = await prisma.eventRegistration.update({
      where: { id },
      data: {
        attended: !!attended,
        attendedAt: attended ? new Date() : null
      }
    });
    res.json(reg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/registrations/attendance-by-code
router.put('/attendance-by-code', authenticate, async (req, res) => {
  try {
    const { eventId, regCode, attended } = req.body;
    const reg = await prisma.eventRegistration.findFirst({
      where: {
        eventId: parseInt(eventId),
        registrationCode: { equals: (regCode || '').trim() }
      }
    });
    if (!reg) return res.status(404).json({ error: 'Registration pass not found' });

    const updated = await prisma.eventRegistration.update({
      where: { id: reg.id },
      data: {
        attended: !!attended,
        attendedAt: attended ? new Date() : null
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
