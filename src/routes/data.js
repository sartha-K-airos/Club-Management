// src/routes/data.js — GET / returns ALL collections for the frontend cache with in-memory caching
const router = require('express').Router();
const prisma = require('../lib/prisma');

let _cachedPayload = null;
let _cachedAt = 0;
const CACHE_TTL_MS = 10 * 1000; // 10 seconds

function invalidateCache() {
  _cachedPayload = null;
  _cachedAt = 0;
}

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
  // If cache is fresh and fresh flag is not requested, return instantly in 0.5ms!
  const now = Date.now();
  if (_cachedPayload && (now - _cachedAt < CACHE_TTL_MS) && req.query.fresh !== 'true') {
    res.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
    return res.json(_cachedPayload);
  }

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

    const payload = {
      users: users.map(sanitizeUser),
      clubs: clubs.map(c => {
        const logoUrl = c.icon || c.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent((c.name || 'CL').substring(0, 2))}&background=4a1c84&color=fff&bold=true`;
        return {
          ...c,
          icon: logoUrl,
          logo: logoUrl
        };
      }),
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
    };

    _cachedPayload = payload;
    _cachedAt = now;

    res.set('Cache-Control', 'private, max-age=5, stale-while-revalidate=15');
    res.json(payload);
  } catch (err) {
    console.error('Data fetch error:', err);
    if (_cachedPayload) {
      return res.json(_cachedPayload); // Graceful fallback
    }
    res.status(500).json({ error: 'Failed to fetch data', message: err.message });
  }
});

router.invalidateCache = invalidateCache;
module.exports = router;
