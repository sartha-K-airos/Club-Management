// src/routes/data.js — GET / returns ALL collections for the frontend cache
const router = require('express').Router();
const prisma = require('../lib/prisma');

function parseJSON(str, fallback) {
  if (Array.isArray(str) || (typeof str === 'object' && str !== null)) return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  safe.clubMemberships = parseJSON(safe.clubMemberships, []);
  return safe;
}

router.get('/', async (req, res) => {
  try {
    const [
      users, clubs, events, joinRequests, announcements,
      settingsRow, eventReports, eventRegistrations,
      resourcePersons, eventGallery, clubHierarchy,
      eventFeedback, quarterlyReports
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.club.findMany(),
      prisma.event.findMany(),
      prisma.joinRequest.findMany(),
      prisma.announcement.findMany(),
      prisma.settings.findUnique({ where: { id: 1 } }),
      prisma.eventReport.findMany(),
      prisma.eventRegistration.findMany(),
      prisma.resourcePerson.findMany(),
      prisma.eventGallery.findMany(),
      prisma.clubHierarchy.findMany(),
      prisma.eventFeedback.findMany(),
      prisma.quarterlyReport.findMany()
    ]);

    res.json({
      users: users.map(sanitizeUser),
      clubs,
      events: events.map(e => ({ ...e, rsvps: parseJSON(e.rsvps, []) })),
      joinRequests,
      announcements,
      settings: settingsRow ? { ...settingsRow, data: parseJSON(settingsRow.data, {}) } : { maintenanceMode: false, registrationOpen: true, collegeName: 'MITS Gwalior' },
      eventReports: eventReports.map(r => ({ ...r, data: parseJSON(r.data, {}) })),
      eventRegistrations,
      resourcePersons,
      eventGallery,
      clubHierarchy,
      eventFeedback: eventFeedback.map(f => ({ ...f, categories: parseJSON(f.categories, []) })),
      quarterlyReports: quarterlyReports.map(r => ({ ...r, data: parseJSON(r.data, {}) }))
    });
  } catch (err) {
    console.error('Data fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch data', message: err.message });
  }
});

module.exports = router;
