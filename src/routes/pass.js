// src/routes/pass.js — Pass verification endpoint
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { optionalAuth } = require('../middleware/auth');
const { verifyPassToken } = require('../lib/passToken');

// POST /api/pass/verify
router.post('/verify', optionalAuth, async (req, res) => {
  try {
    const { passToken, registrationCode } = req.body;
    if (!passToken && !registrationCode) {
      return res.status(400).json({ valid: false, error: 'passToken or registrationCode is required' });
    }

    let regCode = null;

    if (passToken) {
      // Verify HMAC signature
      const result = verifyPassToken(passToken);
      if (!result.valid) {
        // Fallback: check if passToken was passed as raw registration code
        if (typeof passToken === 'string' && passToken.startsWith('REG-')) {
          regCode = passToken.trim();
        } else {
          return res.status(400).json({ valid: false, error: 'Invalid or tampered pass token signature.' });
        }
      } else {
        regCode = result.data.regCode;
      }
    } else {
      regCode = (registrationCode || '').trim();
    }

    // Look up registration by regCode
    const registration = await prisma.eventRegistration.findFirst({
      where: { registrationCode: regCode }
    });

    if (!registration) {
      return res.status(404).json({ valid: false, error: `No registration found for pass code: ${regCode}` });
    }

    // Fetch event details
    const event = await prisma.event.findUnique({
      where: { id: registration.eventId }
    });

    // Check if already checked in
    if (registration.attended) {
      return res.status(200).json({
        valid: true,
        alreadyCheckedIn: true,
        attendedAt: registration.attendedAt,
        registration,
        eventTitle: event ? event.title : 'MITS Event',
        error: '⚠️ Pass already used / Student has already checked in.'
      });
    }

    // Mark as checked in
    const updated = await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: { attended: true, attendedAt: new Date() }
    });

    res.json({
      valid: true,
      alreadyCheckedIn: false,
      registration: updated,
      eventTitle: event ? event.title : 'MITS Event'
    });
  } catch (err) {
    console.error('Pass verify error:', err);
    res.status(500).json({ valid: false, error: 'Pass verification failed', message: err.message });
  }
});

module.exports = router;
