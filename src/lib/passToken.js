// src/lib/passToken.js — HMAC-SHA256 signed passes with QR generation
const crypto = require('crypto');
const QRCode = require('qrcode');

function generatePassToken(registrationData) {
  const passData = {
    regCode: registrationData.registrationCode,
    eventId: registrationData.eventId,
    studentId: registrationData.studentId,
    issuedAt: Date.now()
  };
  const signature = crypto.createHmac('sha256', process.env.PASS_SIGNING_SECRET)
    .update(JSON.stringify(passData))
    .digest('hex');
  return Buffer.from(JSON.stringify({ ...passData, sig: signature })).toString('base64');
}

function verifyPassToken(token) {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    const { sig, ...passData } = decoded;
    const expected = crypto.createHmac('sha256', process.env.PASS_SIGNING_SECRET)
      .update(JSON.stringify(passData))
      .digest('hex');
    if (sig !== expected) return { valid: false, error: 'Invalid signature' };
    return { valid: true, data: passData };
  } catch (e) {
    return { valid: false, error: 'Malformed token' };
  }
}

async function generateQRDataUrl(passToken) {
  return QRCode.toDataURL(passToken, { errorCorrectionLevel: 'H', width: 250, margin: 2 });
}

module.exports = { generatePassToken, verifyPassToken, generateQRDataUrl };
