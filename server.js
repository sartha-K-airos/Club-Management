// server.js — MITS Club & Society Management Express Server
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/data', require('./src/routes/data'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/clubs', require('./src/routes/clubs'));
app.use('/api/events', require('./src/routes/events'));
app.use('/api/registrations', require('./src/routes/registrations'));
app.use('/api/join-requests', require('./src/routes/joinRequests'));
app.use('/api/announcements', require('./src/routes/announcements'));
app.use('/api/event-reports', require('./src/routes/eventReports'));
app.use('/api/resource-persons', require('./src/routes/resourcePersons'));
app.use('/api/event-gallery', require('./src/routes/eventGallery'));
app.use('/api/club-hierarchy', require('./src/routes/clubHierarchy'));
app.use('/api/event-feedback', require('./src/routes/eventFeedback'));
app.use('/api/quarterly-reports', require('./src/routes/quarterlyReports'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/payments', require('./src/routes/payments'));
app.use('/api/pass', require('./src/routes/pass'));

// ── Static files (HTML, CSS, JS, data) — served from project root ───────
app.use(express.static(__dirname));

// ── SPA fallback — serve index.html for unknown routes ──────────────────
app.get('*', (req, res) => {
  // Only serve index.html for non-API, non-file requests
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start server (only if run directly, not when imported by Vercel) ───────
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 MITS StudentHub server running at http://localhost:${PORT}\n`);
  });
}

module.exports = app;
