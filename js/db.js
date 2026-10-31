// js/db.js — localStorage Data Service
// Single source of truth for all data operations (Upgraded with 9 new club management models)

const DB = (() => {
  const KEYS = {
    users:              'mits_users',
    clubs:              'mits_clubs',
    events:             'mits_events',
    joinRequests:       'mits_join_requests',
    announcements:      'mits_announcements',
    settings:           'mits_settings',
    eventReports:       'mits_event_reports',
    eventRegistrations: 'mits_event_registrations',
    resourcePersons:    'mits_resource_persons',
    eventGallery:       'mits_event_gallery',
    clubHierarchy:      'mits_club_hierarchy',
    eventFeedback:      'mits_event_feedback',
    quarterlyReports:   'mits_quarterly_reports',
    seeded:             'mits_seeded_v4'
  };

  // ─── Seeding ───────────────────────────────────────────────────────────────
  function seed() {
    if (localStorage.getItem(KEYS.seeded)) return;
    if (typeof SEED_DATA === 'undefined') { console.error('SEED_DATA not found'); return; }
    localStorage.setItem(KEYS.users,              JSON.stringify(SEED_DATA.users || []));
    localStorage.setItem(KEYS.clubs,              JSON.stringify(SEED_DATA.clubs || []));
    localStorage.setItem(KEYS.events,             JSON.stringify(SEED_DATA.events || []));
    localStorage.setItem(KEYS.joinRequests,       JSON.stringify(SEED_DATA.joinRequests || []));
    localStorage.setItem(KEYS.announcements,      JSON.stringify(SEED_DATA.announcements || []));
    localStorage.setItem(KEYS.settings,           JSON.stringify(SEED_DATA.settings || {}));
    localStorage.setItem(KEYS.eventReports,       JSON.stringify(SEED_DATA.eventReports || []));
    localStorage.setItem(KEYS.eventRegistrations, JSON.stringify(SEED_DATA.eventRegistrations || []));
    localStorage.setItem(KEYS.resourcePersons,    JSON.stringify(SEED_DATA.resourcePersons || []));
    localStorage.setItem(KEYS.eventGallery,       JSON.stringify(SEED_DATA.eventGallery || []));
    localStorage.setItem(KEYS.clubHierarchy,      JSON.stringify(SEED_DATA.clubHierarchy || []));
    localStorage.setItem(KEYS.eventFeedback,      JSON.stringify(SEED_DATA.eventFeedback || []));
    localStorage.setItem(KEYS.quarterlyReports,   JSON.stringify(SEED_DATA.quarterlyReports || []));
    localStorage.setItem(KEYS.seeded, 'true');
    console.log('[DB] Seeded with full MITS v3 data.');
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
    return arr && arr.length ? Math.max(...arr.map(i => i.id || 0)) + 1 : 1;
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
    update: (id, changes) => {
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
      if (!all[idx].clubMemberships) all[idx].clubMemberships = [];
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
      if (!all[idx].clubMemberships) all[idx].clubMemberships = [];
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
        budget: 30000,
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
      // Cascade deletions
      _set(KEYS.events, _get(KEYS.events).filter(e => e.clubId !== id));
      _set(KEYS.joinRequests, _get(KEYS.joinRequests).filter(r => r.clubId !== id));
      _set(KEYS.announcements, _get(KEYS.announcements).filter(a => a.clubId !== id));
      _set(KEYS.clubHierarchy, _get(KEYS.clubHierarchy).filter(h => h.clubId !== id));
      _set(KEYS.eventReports, _get(KEYS.eventReports).filter(r => r.clubId !== id));
      _set(KEYS.quarterlyReports, _get(KEYS.quarterlyReports).filter(q => q.clubId !== id));
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
    past:     ()  => _get(KEYS.events).filter(e => new Date(e.date) < new Date()).sort((a,b) => new Date(b.date) - new Date(a.date)),
    insert: (data) => {
      const all = _get(KEYS.events);
      const isPaid = !!data.isPaid;
      const price = isPaid ? (parseInt(data.price) || 0) : 0;
      const newEvent = {
        id: _nextId(all),
        rsvps: [],
        capacity: 100,
        venue: 'MITS Campus',
        isPaid: isPaid,
        price: price,
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
      _set(KEYS.eventRegistrations, _get(KEYS.eventRegistrations).filter(r => r.eventId !== id));
      _set(KEYS.eventReports, _get(KEYS.eventReports).filter(r => r.eventId !== id));
      _set(KEYS.eventFeedback, _get(KEYS.eventFeedback).filter(f => f.eventId !== id));
      _set(KEYS.eventGallery, _get(KEYS.eventGallery).filter(g => g.eventId !== id));
      _set(KEYS.resourcePersons, _get(KEYS.resourcePersons).filter(p => p.eventId !== id));
      return true;
    },
    rsvp: (eventId, userId) => {
      const all = _get(KEYS.events);
      const idx = all.findIndex(e => e.id === eventId);
      if (idx === -1) return false;
      if (!all[idx].rsvps) all[idx].rsvps = [];
      if (!all[idx].rsvps.includes(userId)) {
        all[idx].rsvps.push(userId);
        _set(KEYS.events, all);
        return true;
      }
      return false;
    },
    unrsvp: (eventId, userId) => {
      const all = _get(KEYS.events);
      const idx = all.findIndex(e => e.id === eventId);
      if (idx === -1) return false;
      if (!all[idx].rsvps) all[idx].rsvps = [];
      all[idx].rsvps = all[idx].rsvps.filter(id => id !== userId);
      _set(KEYS.events, all);
      return true;
    }
  };

  // ─── 1. Event Reports (Submitted to SuperAdmin) ─────────────────────────────
  const eventReports = {
    getAll:  ()       => _get(KEYS.eventReports).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    getById: (id)     => _get(KEYS.eventReports).find(r => r.id === id) || null,
    getByClub: (clubId) => _get(KEYS.eventReports).filter(r => r.clubId === clubId),
    getByEvent:(eventId)=> _get(KEYS.eventReports).find(r => r.eventId === eventId) || null,
    insert: (data) => {
      const all = _get(KEYS.eventReports);
      const newReport = {
        id: _nextId(all),
        status: 'submitted',
        superAdminRemarks: '',
        submittedAt: new Date().toISOString(),
        ...data
      };
      all.push(newReport);
      _set(KEYS.eventReports, all);
      return newReport;
    },
    updateStatus: (id, status, superAdminRemarks = '') => {
      const all = _get(KEYS.eventReports);
      const idx = all.findIndex(r => r.id === id);
      if (idx === -1) return false;
      all[idx].status = status;
      if (superAdminRemarks) all[idx].superAdminRemarks = superAdminRemarks;
      _set(KEYS.eventReports, all);
      return all[idx];
    }
  };

  // ─── 2. Dedicated Event Registrations & 3. Live Attendance ──────────────────
  const eventRegistrations = {
    getAll: () => _get(KEYS.eventRegistrations),
    getById: (id) => _get(KEYS.eventRegistrations).find(r => r.id === id) || null,
    getByEvent: (eventId) => _get(KEYS.eventRegistrations).filter(r => r.eventId === eventId),
    getByStudent: (studentId) => _get(KEYS.eventRegistrations).filter(r => r.studentId === studentId),
    insert: (data) => {
      const all = _get(KEYS.eventRegistrations);
      // Prevent duplicate registration
      const exists = all.find(r => r.eventId === data.eventId && (r.studentId === data.studentId || (data.rollNo && r.rollNo === data.rollNo)));
      if (exists) return { success: false, error: 'Student is already registered for this event.', registration: exists };

      const regCode = `REG-${data.eventId}-${Math.floor(1000 + Math.random() * 9000)}`;
      const isPaid = !!data.isPaid;
      const amountPaid = isPaid ? (parseInt(data.amountPaid) || 0) : 0;
      const txnId = data.transactionId || (isPaid ? `TXN-MITS-${Math.floor(100000 + Math.random() * 900000)}` : 'FREE-ENTRY');
      const newReg = {
        id: _nextId(all),
        registrationCode: regCode,
        isPaid: isPaid,
        amountPaid: amountPaid,
        paymentStatus: data.paymentStatus || (isPaid ? 'PAID' : 'FREE'),
        paymentMethod: data.paymentMethod || (isPaid ? 'Online Gateway' : 'Free Entry'),
        transactionId: txnId,
        registeredAt: new Date().toISOString(),
        attended: false,
        attendedAt: null,
        ...data
      };
      all.push(newReg);
      _set(KEYS.eventRegistrations, all);

      // Sync event RSVPs
      if (data.studentId) events.rsvp(data.eventId, data.studentId);
      return { success: true, registration: newReg };
    },
    markAttendance: (registrationId, attended = true) => {
      const all = _get(KEYS.eventRegistrations);
      const idx = all.findIndex(r => r.id === registrationId);
      if (idx === -1) return false;
      all[idx].attended = attended;
      all[idx].attendedAt = attended ? new Date().toISOString() : null;
      _set(KEYS.eventRegistrations, all);
      return all[idx];
    },
    markAttendanceByCode: (eventId, regCode, attended = true) => {
      const all = _get(KEYS.eventRegistrations);
      const idx = all.findIndex(r => r.eventId === eventId && r.registrationCode.trim().toUpperCase() === regCode.trim().toUpperCase());
      if (idx === -1) return null;
      all[idx].attended = attended;
      all[idx].attendedAt = attended ? new Date().toISOString() : null;
      _set(KEYS.eventRegistrations, all);
      return all[idx];
    }
  };

  // ─── 4. Resource Persons / Guest Experts ──────────────────────────────────
  const resourcePersons = {
    getAll: () => _get(KEYS.resourcePersons),
    getById: (id) => _get(KEYS.resourcePersons).find(p => p.id === id) || null,
    getByClub: (clubId) => _get(KEYS.resourcePersons).filter(p => p.clubId === clubId),
    getByEvent: (eventId) => _get(KEYS.resourcePersons).filter(p => p.eventId === eventId),
    insert: (data) => {
      const all = _get(KEYS.resourcePersons);
      const newPerson = {
        id: _nextId(all),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Guest')}&background=4a1c84&color=fff`,
        addedAt: new Date().toISOString().split('T')[0],
        ...data
      };
      all.push(newPerson);
      _set(KEYS.resourcePersons, all);
      return newPerson;
    },
    delete: (id) => {
      _set(KEYS.resourcePersons, _get(KEYS.resourcePersons).filter(p => p.id !== id));
      return true;
    }
  };

  // ─── 5. Event Gallery / Glimpses ───────────────────────────────────────────
  const eventGallery = {
    getAll: () => _get(KEYS.eventGallery).sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)),
    getById: (id) => _get(KEYS.eventGallery).find(g => g.id === id) || null,
    getByClub: (clubId) => _get(KEYS.eventGallery).filter(g => g.clubId === clubId),
    getByEvent: (eventId) => _get(KEYS.eventGallery).filter(g => g.eventId === eventId),
    insert: (data) => {
      const all = _get(KEYS.eventGallery);
      const newPhoto = {
        id: _nextId(all),
        uploadedAt: new Date().toISOString().split('T')[0],
        ...data
      };
      all.push(newPhoto);
      _set(KEYS.eventGallery, all);
      return newPhoto;
    },
    delete: (id) => {
      _set(KEYS.eventGallery, _get(KEYS.eventGallery).filter(g => g.id !== id));
      return true;
    }
  };

  // ─── 6. Club Leadership Hierarchy / Post Section ───────────────────────────
  const clubHierarchy = {
    getAll: () => _get(KEYS.clubHierarchy),
    getById: (id) => _get(KEYS.clubHierarchy).find(h => h.id === id) || null,
    getByClub: (clubId) => _get(KEYS.clubHierarchy).filter(h => h.clubId === clubId).sort((a,b) => (a.order || 99) - (b.order || 99)),
    insert: (data) => {
      const all = _get(KEYS.clubHierarchy);
      const newPost = {
        id: _nextId(all),
        order: data.order || 10,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Member')}&background=random&color=fff`,
        ...data
      };
      all.push(newPost);
      _set(KEYS.clubHierarchy, all);
      return newPost;
    },
    update: (id, changes) => {
      const all = _get(KEYS.clubHierarchy);
      const idx = all.findIndex(h => h.id === id);
      if (idx === -1) return false;
      all[idx] = { ...all[idx], ...changes };
      _set(KEYS.clubHierarchy, all);
      return all[idx];
    },
    delete: (id) => {
      _set(KEYS.clubHierarchy, _get(KEYS.clubHierarchy).filter(h => h.id !== id));
      return true;
    }
  };

  // ─── 7. Club Join Requests with Reason & Qualifications ─────────────────────
  const joinRequests = {
    getAll:  ()   => _get(KEYS.joinRequests).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)),
    getById: (id) => _get(KEYS.joinRequests).find(r => r.id === id) || null,
    query:   (fn) => _get(KEYS.joinRequests).filter(fn),
    insert: (data) => {
      const all = _get(KEYS.joinRequests);
      // Prevent duplicate pending requests
      const exists = all.find(r => r.clubId === data.clubId && r.studentId === data.studentId && r.status === 'pending');
      if (exists) return null;
      const newReq = {
        id: _nextId(all),
        status: 'pending',
        reason: data.reason || data.message || 'I would like to join this club.',
        skills: data.skills || 'General interest',
        contributions: data.contributions || 'Active participation in club activities',
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
      if (status === 'approved') {
        users.addMembership(all[idx].studentId, all[idx].clubId);
        clubs.incrementMembers(all[idx].clubId);
      }
      return all[idx];
    }
  };

  // ─── 8. Event Feedback System ──────────────────────────────────────────────
  const eventFeedback = {
    getAll: () => _get(KEYS.eventFeedback).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    getById: (id) => _get(KEYS.eventFeedback).find(f => f.id === id) || null,
    getByEvent: (eventId) => _get(KEYS.eventFeedback).filter(f => f.eventId === eventId),
    getByClub: (clubId) => _get(KEYS.eventFeedback).filter(f => f.clubId === clubId),
    insert: (data) => {
      const all = _get(KEYS.eventFeedback);
      const exists = all.find(f => f.eventId === data.eventId && f.studentId === data.studentId);
      if (exists) return { success: false, error: 'You have already submitted feedback for this event.' };

      const newFeedback = {
        id: _nextId(all),
        submittedAt: new Date().toISOString(),
        ...data
      };
      all.push(newFeedback);
      _set(KEYS.eventFeedback, all);
      return { success: true, feedback: newFeedback };
    }
  };

  // ─── 9. Three-Month (Quarterly) Club Reports ────────────────────────────────
  const quarterlyReports = {
    getAll: () => _get(KEYS.quarterlyReports).sort((a,b) => new Date(b.submittedAt) - new Date(a.submittedAt)),
    getById: (id) => _get(KEYS.quarterlyReports).find(q => q.id === id) || null,
    getByClub: (clubId) => _get(KEYS.quarterlyReports).filter(q => q.clubId === clubId),
    insert: (data) => {
      const all = _get(KEYS.quarterlyReports);
      const newQuarterly = {
        id: _nextId(all),
        status: 'submitted',
        superAdminFeedback: '',
        submittedAt: new Date().toISOString(),
        ...data
      };
      all.push(newQuarterly);
      _set(KEYS.quarterlyReports, all);
      return newQuarterly;
    },
    updateStatus: (id, status, superAdminFeedback = '') => {
      const all = _get(KEYS.quarterlyReports);
      const idx = all.findIndex(q => q.id === id);
      if (idx === -1) return false;
      all[idx].status = status;
      if (superAdminFeedback) all[idx].superAdminFeedback = superAdminFeedback;
      _set(KEYS.quarterlyReports, all);
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

  return {
    seed,
    reseed,
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

window.DB = DB;
