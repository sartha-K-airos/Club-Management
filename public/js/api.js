// js/api.js — HTTP API Client (replaces localStorage-based db.js)
// Maintains an in-memory cache for synchronous reads, async writes to backend

const API = (() => {
  let _cache = {
    users: [],
    clubs: [],
    events: [],
    joinRequests: [],
    announcements: [],
    settings: {},
    eventReports: [],
    eventRegistrations: [],
    resourcePersons: [],
    eventGallery: [],
    clubHierarchy: [],
    eventFeedback: [],
    quarterlyReports: []
  };

  // ─── HTTP Helper ─────────────────────────────────────────────────────────
  async function _fetch(url, options = {}) {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      credentials: 'same-origin',
      ...options
    });
    const cType = res.headers.get('content-type') || '';
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    if (!cType.includes('application/json')) {
      console.warn('[API] Expected JSON but received non-JSON response from server.');
      return {};
    }
    return res.json();
  }

  // ─── Cache Initialization ────────────────────────────────────────────────
  let _readyPromise = null;

  async function init() {
    try {
      const data = await _fetch('/api/data');
      _cache.users = data.users || [];
      _cache.clubs = data.clubs || [];
      _cache.events = data.events || [];
      _cache.joinRequests = data.joinRequests || [];
      _cache.announcements = data.announcements || [];
      _cache.settings = data.settings || {};
      _cache.eventReports = data.eventReports || [];
      _cache.eventRegistrations = data.eventRegistrations || [];
      _cache.resourcePersons = data.resourcePersons || [];
      _cache.eventGallery = data.eventGallery || [];
      _cache.clubHierarchy = data.clubHierarchy || [];
      _cache.eventFeedback = data.eventFeedback || [];
      _cache.quarterlyReports = data.quarterlyReports || [];
      console.log('[API] Cache initialized from server.');
      return _cache;
    } catch (e) {
      console.error('[API] Failed to init cache:', e);
      return _cache;
    }
  }

  // Auto-trigger cache load on script parse
  _readyPromise = init();

  async function refreshCache() {
    _readyPromise = init();
    return await _readyPromise;
  }

  // Legacy compatibility
  async function seed() { return await _readyPromise; }
  async function reseed() { return await refreshCache(); }
  function ready() { return _readyPromise; }

  // ─── Users ────────────────────────────────────────────────────────────────
  const users = {
    getAll: () => _cache.users,
    getById: (id) => _cache.users.find(u => u.id === id) || null,
    getByEmail: (email) => _cache.users.find(u => u.email === (email || '').toLowerCase()) || null,
    insert: async (data) => {
      const result = await _fetch('/api/users', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    update: async (id, changes) => {
      const result = await _fetch(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(changes) });
      await refreshCache();
      return result;
    },
    addMembership: async (userId, clubId) => {
      await _fetch(`/api/users/${userId}/membership`, { method: 'PUT', body: JSON.stringify({ clubId, action: 'add' }) });
      await refreshCache();
      return true;
    },
    removeMembership: async (userId, clubId) => {
      await _fetch(`/api/users/${userId}/membership`, { method: 'PUT', body: JSON.stringify({ clubId, action: 'remove' }) });
      await refreshCache();
      return true;
    }
  };

  // ─── Clubs ────────────────────────────────────────────────────────────────
  const clubs = {
    getAll: () => _cache.clubs,
    getById: (id) => _cache.clubs.find(c => c.id === id) || null,
    query: (fn) => _cache.clubs.filter(fn),
    insert: async (data) => {
      const result = await _fetch('/api/clubs', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    update: async (id, changes) => {
      const result = await _fetch(`/api/clubs/${id}`, { method: 'PUT', body: JSON.stringify(changes) });
      await refreshCache();
      return result;
    },
    delete: async (id) => {
      await _fetch(`/api/clubs/${id}`, { method: 'DELETE' });
      await refreshCache();
      return true;
    },
    incrementMembers: async (id) => {
      await _fetch(`/api/clubs/${id}/increment-members`, { method: 'POST' });
      await refreshCache();
      return true;
    }
  };

  // ─── Events ───────────────────────────────────────────────────────────────
  const events = {
    getAll: () => _cache.events,
    getById: (id) => _cache.events.find(e => e.id === id) || null,
    query: (fn) => _cache.events.filter(fn),
    upcoming: () => _cache.events
      .filter(e => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date)),
    past: () => _cache.events
      .filter(e => new Date(e.date) < new Date())
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    insert: async (data) => {
      const result = await _fetch('/api/events', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    update: async (id, changes) => {
      const result = await _fetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(changes) });
      await refreshCache();
      return result;
    },
    delete: async (id) => {
      await _fetch(`/api/events/${id}`, { method: 'DELETE' });
      await refreshCache();
      return true;
    },
    rsvp: async (eventId, userId) => {
      await _fetch(`/api/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ userId }) });
      await refreshCache();
      return true;
    },
    unrsvp: async (eventId, userId) => {
      await _fetch(`/api/events/${eventId}/rsvp`, { method: 'DELETE', body: JSON.stringify({ userId }) });
      await refreshCache();
      return true;
    }
  };

  // ─── Event Registrations ──────────────────────────────────────────────────
  const eventRegistrations = {
    getAll: () => _cache.eventRegistrations,
    getById: (id) => _cache.eventRegistrations.find(r => r.id === id) || null,
    getByEvent: (eventId) => _cache.eventRegistrations.filter(r => r.eventId === eventId),
    getByStudent: (studentId) => _cache.eventRegistrations.filter(r => r.studentId === studentId),
    insert: async (data) => {
      try {
        const result = await _fetch('/api/registrations', { method: 'POST', body: JSON.stringify(data) });
        await refreshCache();
        return result;
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
    markAttendance: async (registrationId, attended = true) => {
      const result = await _fetch(`/api/registrations/${registrationId}/attendance`, {
        method: 'PUT', body: JSON.stringify({ attended })
      });
      await refreshCache();
      return result;
    },
    markAttendanceByCode: async (eventId, regCode, attended = true) => {
      const result = await _fetch('/api/registrations/attendance-by-code', {
        method: 'PUT', body: JSON.stringify({ eventId, regCode, attended })
      });
      await refreshCache();
      return result;
    }
  };

  // ─── Event Reports ────────────────────────────────────────────────────────
  const eventReports = {
    getAll: () => [..._cache.eventReports].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    getById: (id) => _cache.eventReports.find(r => r.id === id) || null,
    getByClub: (clubId) => _cache.eventReports.filter(r => r.clubId === clubId),
    getByEvent: (eventId) => _cache.eventReports.find(r => r.eventId === eventId) || null,
    insert: async (data) => {
      const result = await _fetch('/api/event-reports', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    updateStatus: async (id, status, superAdminRemarks = '') => {
      const result = await _fetch(`/api/event-reports/${id}/status`, {
        method: 'PUT', body: JSON.stringify({ status, superAdminRemarks })
      });
      await refreshCache();
      return result;
    }
  };

  // ─── Resource Persons ─────────────────────────────────────────────────────
  const resourcePersons = {
    getAll: () => _cache.resourcePersons,
    getById: (id) => _cache.resourcePersons.find(p => p.id === id) || null,
    getByClub: (clubId) => _cache.resourcePersons.filter(p => p.clubId === clubId),
    getByEvent: (eventId) => _cache.resourcePersons.filter(p => p.eventId === eventId),
    insert: async (data) => {
      const result = await _fetch('/api/resource-persons', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    delete: async (id) => {
      await _fetch(`/api/resource-persons/${id}`, { method: 'DELETE' });
      await refreshCache();
      return true;
    }
  };

  // ─── Event Gallery ────────────────────────────────────────────────────────
  const eventGallery = {
    getAll: () => [..._cache.eventGallery].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)),
    getById: (id) => _cache.eventGallery.find(g => g.id === id) || null,
    getByClub: (clubId) => _cache.eventGallery.filter(g => g.clubId === clubId),
    getByEvent: (eventId) => _cache.eventGallery.filter(g => g.eventId === eventId),
    insert: async (data) => {
      const result = await _fetch('/api/event-gallery', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    delete: async (id) => {
      await _fetch(`/api/event-gallery/${id}`, { method: 'DELETE' });
      await refreshCache();
      return true;
    }
  };

  // ─── Club Hierarchy ───────────────────────────────────────────────────────
  const clubHierarchy = {
    getAll: () => _cache.clubHierarchy,
    getById: (id) => _cache.clubHierarchy.find(h => h.id === id) || null,
    getByClub: (clubId) => _cache.clubHierarchy.filter(h => h.clubId === clubId).sort((a, b) => (a.order || 99) - (b.order || 99)),
    insert: async (data) => {
      const result = await _fetch('/api/club-hierarchy', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    update: async (id, changes) => {
      const result = await _fetch(`/api/club-hierarchy/${id}`, { method: 'PUT', body: JSON.stringify(changes) });
      await refreshCache();
      return result;
    },
    delete: async (id) => {
      await _fetch(`/api/club-hierarchy/${id}`, { method: 'DELETE' });
      await refreshCache();
      return true;
    }
  };

  // ─── Join Requests ────────────────────────────────────────────────────────
  const joinRequests = {
    getAll: () => [..._cache.joinRequests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    getById: (id) => _cache.joinRequests.find(r => r.id === id) || null,
    query: (fn) => _cache.joinRequests.filter(fn),
    insert: async (data) => {
      try {
        const result = await _fetch('/api/join-requests', { method: 'POST', body: JSON.stringify(data) });
        await refreshCache();
        return result;
      } catch (e) {
        return null;
      }
    },
    updateStatus: async (id, status) => {
      const result = await _fetch(`/api/join-requests/${id}/status`, {
        method: 'PUT', body: JSON.stringify({ status })
      });
      await refreshCache();
      return result;
    }
  };

  // ─── Event Feedback ───────────────────────────────────────────────────────
  const eventFeedback = {
    getAll: () => [..._cache.eventFeedback].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    getById: (id) => _cache.eventFeedback.find(f => f.id === id) || null,
    getByEvent: (eventId) => _cache.eventFeedback.filter(f => f.eventId === eventId),
    getByClub: (clubId) => _cache.eventFeedback.filter(f => f.clubId === clubId),
    insert: async (data) => {
      try {
        const result = await _fetch('/api/event-feedback', { method: 'POST', body: JSON.stringify(data) });
        await refreshCache();
        return result;
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  };

  // ─── Quarterly Reports ────────────────────────────────────────────────────
  const quarterlyReports = {
    getAll: () => [..._cache.quarterlyReports].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    getById: (id) => _cache.quarterlyReports.find(q => q.id === id) || null,
    getByClub: (clubId) => _cache.quarterlyReports.filter(q => q.clubId === clubId),
    insert: async (data) => {
      const result = await _fetch('/api/quarterly-reports', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    updateStatus: async (id, status, superAdminFeedback = '') => {
      const result = await _fetch(`/api/quarterly-reports/${id}/status`, {
        method: 'PUT', body: JSON.stringify({ status, superAdminFeedback })
      });
      await refreshCache();
      return result;
    }
  };

  // ─── Announcements ────────────────────────────────────────────────────────
  const announcements = {
    getAll: () => [..._cache.announcements].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    query: (fn) => _cache.announcements.filter(fn).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    insert: async (data) => {
      const result = await _fetch('/api/announcements', { method: 'POST', body: JSON.stringify(data) });
      await refreshCache();
      return result;
    },
    delete: async (id) => {
      await _fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      await refreshCache();
      return true;
    }
  };

  // ─── Settings ─────────────────────────────────────────────────────────────
  const settings = {
    get: () => _cache.settings || {},
    update: async (changes) => {
      const result = await _fetch('/api/settings', { method: 'PUT', body: JSON.stringify(changes) });
      await refreshCache();
      return result;
    }
  };

  return {
    init,
    refreshCache,
    ready,
    seed,
    reseed,
    _fetch,
    users,
    clubs,
    events,
    joinRequests,
    announcements,
    settings,
    eventReports,
    eventRegistrations,
    resourcePersons,
    eventGallery,
    clubHierarchy,
    eventFeedback,
    quarterlyReports
  };
})();

window.API = API;
// Backward compatibility — any remaining DB.xxx calls still work
window.DB = API;
