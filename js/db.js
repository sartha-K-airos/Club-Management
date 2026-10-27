// js/db.js — localStorage Data Service
// Single source of truth for all data operations

const DB = (() => {
  const KEYS = {
    users:        'mits_users',
    clubs:        'mits_clubs',
    events:       'mits_events',
    joinRequests: 'mits_join_requests',
    announcements:'mits_announcements',
    settings:     'mits_settings',
    seeded:       'mits_seeded'
  };

  // ─── Seeding ───────────────────────────────────────────────────────────────
  function seed() {
    if (localStorage.getItem(KEYS.seeded)) return;
    if (typeof SEED_DATA === 'undefined') { console.error('SEED_DATA not found'); return; }
    localStorage.setItem(KEYS.users,        JSON.stringify(SEED_DATA.users));
    localStorage.setItem(KEYS.clubs,        JSON.stringify(SEED_DATA.clubs));
    localStorage.setItem(KEYS.events,       JSON.stringify(SEED_DATA.events));
    localStorage.setItem(KEYS.joinRequests, JSON.stringify(SEED_DATA.joinRequests));
    localStorage.setItem(KEYS.announcements,JSON.stringify(SEED_DATA.announcements));
    localStorage.setItem(KEYS.settings,     JSON.stringify(SEED_DATA.settings));
    localStorage.setItem(KEYS.seeded, 'true');
    console.log('[DB] Seeded with MITS data.');
  }

  function reseed() {
    localStorage.removeItem(KEYS.seeded);
    seed();
  }

  // ─── Generic CRUD ─────────────────────────────────────────────────────────
  function _get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }
  function _set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function _nextId(arr) {
    return arr.length ? Math.max(...arr.map(i => i.id)) + 1 : 1;
  }

  // ─── Users ────────────────────────────────────────────────────────────────
  const users = {
    getAll:  ()       => _get(KEYS.users),
    getById: (id)     => _get(KEYS.users).find(u => u.id === id) || null,
    getByEmail: (email) => _get(KEYS.users).find(u => u.email === email) || null,
    insert: (data) => {
      const all = _get(KEYS.users);
      if (all.find(u => u.email === data.email)) return null;
      const newUser = {
        id: _nextId(all),
        clubMemberships: [],
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name.substring(0,2))}&background=random&color=fff`,
        createdAt: new Date().toISOString(),
        ...data
      };
      all.push(newUser);
      _set(KEYS.users, all);
      return newUser;
    },
    update:  (id, changes) => {
      const all = _get(KEYS.users);
      const idx = all.findIndex(u => u.id === id);
      if (idx === -1) return false;
      all[idx] = { ...all[idx], ...changes };
      _set(KEYS.users, all);
      return all[idx];
    },
    addMembership: (userId, clubId) => {
      const all = _get(KEYS.users);
      const idx = all.findIndex(u => u.id === userId);
      if (idx === -1) return false;
      if (!all[idx].clubMemberships.includes(clubId)) {
        all[idx].clubMemberships.push(clubId);
        _set(KEYS.users, all);
      }
      return true;
    },
    removeMembership: (userId, clubId) => {
      const all = _get(KEYS.users);
      const idx = all.findIndex(u => u.id === userId);
      if (idx === -1) return false;
      all[idx].clubMemberships = all[idx].clubMemberships.filter(id => id !== clubId);
      _set(KEYS.users, all);
      return true;
    }
  };

  // ─── Clubs ────────────────────────────────────────────────────────────────
  const clubs = {
    getAll:  ()    => _get(KEYS.clubs),
    getById: (id)  => _get(KEYS.clubs).find(c => c.id === id) || null,
    query:   (fn)  => _get(KEYS.clubs).filter(fn),
    insert:  (data) => {
      const all = _get(KEYS.clubs);
      const newClub = {
        id: _nextId(all),
        members: 0,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        leaderId: null,
        ...data
      };
      all.push(newClub);
      _set(KEYS.clubs, all);
      return newClub;
    },
    update: (id, changes) => {
      const all = _get(KEYS.clubs);
      const idx = all.findIndex(c => c.id === id);
      if (idx === -1) return false;
      all[idx] = { ...all[idx], ...changes };
      _set(KEYS.clubs, all);
      return all[idx];
    },
    delete: (id) => {
      const all = _get(KEYS.clubs).filter(c => c.id !== id);
      _set(KEYS.clubs, all);
      // Cascade: delete related events, requests
      _set(KEYS.events, _get(KEYS.events).filter(e => e.clubId !== id));
      _set(KEYS.joinRequests, _get(KEYS.joinRequests).filter(r => r.clubId !== id));
      _set(KEYS.announcements, _get(KEYS.announcements).filter(a => a.clubId !== id));
      return true;
    },
    incrementMembers: (id) => {
      const all = _get(KEYS.clubs);
      const idx = all.findIndex(c => c.id === id);
      if (idx === -1) return;
      all[idx].members = (all[idx].members || 0) + 1;
      _set(KEYS.clubs, all);
    }
  };

  // ─── Events ───────────────────────────────────────────────────────────────
  const events = {
    getAll:  ()   => _get(KEYS.events),
    getById: (id) => _get(KEYS.events).find(e => e.id === id) || null,
    query:   (fn) => _get(KEYS.events).filter(fn),
    upcoming: ()  => _get(KEYS.events).filter(e => new Date(e.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date)),
    insert: (data) => {
      const all = _get(KEYS.events);
      const newEvent = {
        id: _nextId(all),
        rsvps: [],
        createdAt: new Date().toISOString().split('T')[0],
        ...data
      };
      all.push(newEvent);
      _set(KEYS.events, all);
      return newEvent;
    },
    update: (id, changes) => {
      const all = _get(KEYS.events);
      const idx = all.findIndex(e => e.id === id);
      if (idx === -1) return false;
      all[idx] = { ...all[idx], ...changes };
      _set(KEYS.events, all);
      return all[idx];
    },
    delete: (id) => {
      _set(KEYS.events, _get(KEYS.events).filter(e => e.id !== id));
      return true;
    },
    rsvp: (eventId, userId) => {
      const all = _get(KEYS.events);
      const idx = all.findIndex(e => e.id === eventId);
      if (idx === -1) return false;
      if (!all[idx].rsvps.includes(userId)) {
        all[idx].rsvps.push(userId);
        _set(KEYS.events, all);
        return true;
      }
      return false; // already RSVPed
    },
    unrsvp: (eventId, userId) => {
      const all = _get(KEYS.events);
      const idx = all.findIndex(e => e.id === eventId);
      if (idx === -1) return false;
      all[idx].rsvps = all[idx].rsvps.filter(id => id !== userId);
      _set(KEYS.events, all);
      return true;
    }
  };

  // ─── Join Requests ────────────────────────────────────────────────────────
  const joinRequests = {
    getAll:  ()   => _get(KEYS.joinRequests),
    getById: (id) => _get(KEYS.joinRequests).find(r => r.id === id) || null,
    query:   (fn) => _get(KEYS.joinRequests).filter(fn),
    insert: (data) => {
      const all = _get(KEYS.joinRequests);
      // Prevent duplicate requests
      const exists = all.find(r => r.clubId === data.clubId && r.studentId === data.studentId && r.status === 'pending');
      if (exists) return null;
      const newReq = {
        id: _nextId(all),
        status: 'pending',
        createdAt: new Date().toISOString().split('T')[0],
        ...data
      };
      all.push(newReq);
      _set(KEYS.joinRequests, all);
      return newReq;
    },
    updateStatus: (id, status) => {
      const all = _get(KEYS.joinRequests);
      const idx = all.findIndex(r => r.id === id);
      if (idx === -1) return false;
      all[idx].status = status;
      _set(KEYS.joinRequests, all);
      // If approved, add membership
      if (status === 'approved') {
        users.addMembership(all[idx].studentId, all[idx].clubId);
        clubs.incrementMembers(all[idx].clubId);
      }
      return all[idx];
    }
  };

  // ─── Announcements ────────────────────────────────────────────────────────
  const announcements = {
    getAll:  ()   => _get(KEYS.announcements).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
    query:   (fn) => _get(KEYS.announcements).filter(fn).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
    insert: (data) => {
      const all = _get(KEYS.announcements);
      const newAnn = {
        id: _nextId(all),
        createdAt: new Date().toISOString(),
        ...data
      };
      all.push(newAnn);
      _set(KEYS.announcements, all);
      return newAnn;
    },
    delete: (id) => {
      _set(KEYS.announcements, _get(KEYS.announcements).filter(a => a.id !== id));
      return true;
    }
  };

  // ─── Settings ────────────────────────────────────────────────────────────
  const settings = {
    get: () => {
      try { return JSON.parse(localStorage.getItem(KEYS.settings)) || {}; }
      catch { return {}; }
    },
    update: (changes) => {
      const current = settings.get();
      const updated = { ...current, ...changes };
      localStorage.setItem(KEYS.settings, JSON.stringify(updated));
      return updated;
    }
  };

  return { seed, reseed, users, clubs, events, joinRequests, announcements, settings };
})();

window.DB = DB;
