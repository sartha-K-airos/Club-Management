// src/routes/payments.js — Razorpay order creation, payment verification, pass generation
const router = require('express').Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { generatePassToken, generateQRDataUrl } = require('../lib/passToken');

// Initialize Razorpay
let razorpay = null;
const isLiveKey = process.env.RAZORPAY_KEY_ID &&
  !process.env.RAZORPAY_KEY_ID.includes('REPLACE') &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_SECRET.includes('REPLACE');

if (isLiveKey) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    console.log('💳 Razorpay initialized with credentials.');
  } catch (e) {
    console.warn('Razorpay initialization failed:', e.message);
  }
} else {
  console.log('ℹ️ Running in Sandbox/Test Payment Mode (add live keys to .env anytime).');
}

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { eventId } = req.body;
    const event = await prisma.event.findUnique({ where: { id: parseInt(eventId) } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!event.isPaid || event.price <= 0) {
      return res.status(400).json({ error: 'This is a free event' });
    }

    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: Math.round(event.price * 100), // amount in paise
        currency: 'INR',
        receipt: `rcpt_${eventId}_${Date.now()}`,
        notes: { eventId: String(eventId), userId: String(req.user.id) }
      });

      return res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        isDemo: false
      });
    }

    // Test/Demo Mode Order
    const testOrderId = `order_test_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    res.json({
      orderId: testOrderId,
      amount: Math.round(event.price * 100),
      currency: 'INR',
      keyId: 'rzp_test_mits_demo',
      isDemo: true
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create payment order', message: err.message });
  }
});

// POST /api/payments/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registrationData } = req.body;

    if (!registrationData || !registrationData.eventId) {
      return res.status(400).json({ error: 'Missing registration data' });
    }

    // Verify signature
    let signatureValid = false;
    if (razorpay && process.env.RAZORPAY_KEY_SECRET) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
      signatureValid = (expectedSignature === razorpay_signature);
    } else {
      // In demo test mode, verify valid structure
      signatureValid = !!razorpay_order_id && !!razorpay_payment_id;
    }

    if (!signatureValid) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    // Generate registration code
    const rand = Math.floor(1000 + Math.random() * 9000);
    const registrationCode = `REG-${registrationData.eventId}-${rand}`;

    // Generate cryptographic pass token
    const regDataWithCode = {
      registrationCode,
      eventId: parseInt(registrationData.eventId),
      studentId: parseInt(req.user.id || registrationData.studentId || 1)
    };
    const passToken = generatePassToken(regDataWithCode);
    const qrDataUrl = await generateQRDataUrl(passToken);

    // Create registration record
    const registration = await prisma.eventRegistration.create({
      data: {
        registrationCode,
        eventId: parseInt(registrationData.eventId),
        studentId: parseInt(req.user.id || registrationData.studentId || 1),
        studentName: registrationData.studentName || req.user.name || 'Student',
        email: registrationData.email || req.user.email,
        rollNo: registrationData.rollNo || req.user.rollNo,
        branch: registrationData.branch || registrationData.department || 'Engineering',
        year: registrationData.year,
        phone: registrationData.phone,
        isPaid: true,
        amountPaid: parseFloat(registrationData.amountPaid || 0),
        paymentStatus: 'PAID',
        paymentMethod: registrationData.paymentMethod || 'Razorpay Online Gateway',
        transactionId: razorpay_payment_id || `TXN-MITS-${Date.now()}`,
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        gatewaySignature: razorpay_signature || 'VERIFIED',
        passToken,
        attended: false
      }
    });

    // Also sync student into event.rsvps
    try {
      const evId = parseInt(registrationData.eventId);
      const stId = parseInt(req.user.id || registrationData.studentId || 1);
      const ev = await prisma.event.findUnique({ where: { id: evId } });
      if (ev) {
        let rsvps = [];
        try { rsvps = JSON.parse(ev.rsvps || '[]'); } catch (e) { rsvps = []; }
        if (!rsvps.includes(stId)) {
          rsvps.push(stId);
          await prisma.event.update({
            where: { id: evId },
            data: { rsvps: JSON.stringify(rsvps) }
          });
        }
      }
    } catch (e) { console.error('Payment RSVP sync error:', e); }

    const dataRouter = require('./data');
    if (dataRouter.invalidateCache) dataRouter.invalidateCache();

    res.json({
      success: true,
      registration,
      passToken,
      qrDataUrl,
      registrationCode
    });
  } catch (err) {
    console.error('Payment verify error:', err);
    res.status(500).json({ error: 'Payment verification failed', message: err.message });
  }
});

module.exports = router;
