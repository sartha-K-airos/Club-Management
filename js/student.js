// js/student.js — Full Student Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
  DB.seed();

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  const currentUser = Auth.requireRole('student');
  if (!currentUser) return;

  // Get full user from DB for fresh data
  let user = DB.users.getById(currentUser.id);

  // ─── Header ──────────────────────────────────────────────────────────────
  document.getElementById('userName').textContent = user.name;
  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  document.getElementById('userAvatar').src = user.avatar;
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // ─── Tab System ──────────────────────────────────────────────────────────
  window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName).style.display = 'block';
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    // Lazy render on tab switch
    if (tabName === 'clubs')    renderAllClubs();
    if (tabName === 'events')   renderAllEvents();
    if (tabName === 'feed')     renderFeed();
  };

  // Default tab
  switchTab('overview');

  // ─── Welcome Stats ────────────────────────────────────────────────────────
  function refreshUser() { user = DB.users.getById(currentUser.id); }

  function updateWelcomeStats() {
    refreshUser();
    const myClubs = user.clubMemberships.length;
    const upcomingEvents = DB.events.upcoming().length;
    const rsvped = DB.events.getAll().filter(e => e.rsvps && e.rsvps.includes(user.id)).length;
    UI.animateCount(document.getElementById('myClubCount'), myClubs, 600);
    UI.animateCount(document.getElementById('upcomingEventCount'), upcomingEvents, 600);
    UI.animateCount(document.getElementById('rsvpCount'), rsvped, 600);
  }
  updateWelcomeStats();

  // ─── Overview: My Clubs ───────────────────────────────────────────────────
  function renderMyClubs() {
    refreshUser();
    const grid = document.getElementById('myClubsGrid');
    if (!grid) return;
    if (user.clubMemberships.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;padding:32px;text-align:center;color:#aaa;font-size:14px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🏛️</div>
        <p style="font-weight:600;">You haven't joined any clubs yet.</p>
        <p>Go to <a href="#" onclick="switchTab('clubs');return false;" style="color:#4a1c84;font-weight:700;">Explore Clubs</a> to find your community!</p>
      </div>`;
      return;
    }
    grid.innerHTML = '';
    user.clubMemberships.forEach(clubId => {
      const club = DB.clubs.getById(clubId);
      if (!club) return;
      const div = document.createElement('div');
      div.className = 'my-club-card';
      div.innerHTML = `
        <img src="${club.logo}" class="my-club-logo" alt="${club.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(club.name.substring(0,2))}&background=4a1c84&color=fff'">
        <div class="my-club-info">
          <h4>${club.name}</h4>
          <p>${club.category} · ${club.members} members</p>
        </div>
        ${UI.badge('Member', 'approved')}
      `;
      grid.appendChild(div);
    });
  }
  renderMyClubs();

  // ─── Overview: Announcements ──────────────────────────────────────────────
  function renderMyAnnouncements() {
    refreshUser();
    const container = document.getElementById('announcementsContainer');
    if (!container) return;
    const myAnnouncements = DB.announcements.query(a => user.clubMemberships.includes(a.clubId));
    if (myAnnouncements.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;">
        <div style="font-size:2rem;margin-bottom:10px;">📢</div>
        <p style="font-weight:600;">No announcements yet from your clubs.</p>
        <p style="font-size:13px;">Join more clubs to see their updates here.</p>
      </div>`;
      return;
    }
    container.innerHTML = myAnnouncements.map(ann => {
      const club = DB.clubs.getById(ann.clubId);
      return `<div class="ann-card">
        <div class="ann-club">📌 ${club ? club.name : 'Unknown Club'}</div>
        <div class="ann-msg">${ann.message}</div>
        <div class="ann-time">${UI.timeAgo(ann.createdAt)}</div>
      </div>`;
    }).join('');
  }
  renderMyAnnouncements();

  // ─── Clubs Tab ─────────────────────────────────────────────────────────────
  let clubSearchQ = '';
  let clubCatQ = '';

  function renderAllClubs() {
    refreshUser();
    let clubs = DB.clubs.getAll();
    if (clubCatQ) clubs = clubs.filter(c => c.category === clubCatQ);
    if (clubSearchQ) clubs = clubs.filter(c =>
      c.name.toLowerCase().includes(clubSearchQ) ||
      c.description.toLowerCase().includes(clubSearchQ)
    );
    clubs.sort((a, b) => b.members - a.members);
    renderClubs('clubsContainer', clubs, 'student', user.id);
  }

  document.getElementById('clubSearch').addEventListener('input', UI.debounce(function() {
    clubSearchQ = this.value.trim().toLowerCase();
    renderAllClubs();
  }, 250));

  const chips = document.querySelectorAll('#clubCatFilterChips .chip');
  if (chips.length > 0) {
    chips.forEach(chip => {
      chip.addEventListener('click', function() {
        chips.forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        clubCatQ = this.dataset.cat;
        renderAllClubs();
      });
    });
  }

  // ─── Events Tab ────────────────────────────────────────────────────────────
  window.refreshEvents = function() {
    refreshUser();
    renderFilteredEvents();
    updateWelcomeStats();
  };

  function renderFilteredEvents() {
    refreshUser();
    const filter = document.getElementById('eventFilter').value;
    let events;
    if (filter === 'upcoming')  events = DB.events.upcoming();
    else if (filter === 'rsvped') events = DB.events.getAll().filter(e => e.rsvps && e.rsvps.includes(user.id));
    else events = DB.events.getAll().sort((a,b) => new Date(a.date) - new Date(b.date));
    renderEvents('eventsContainer', events, 'student', user.id);
  }

  function renderAllEvents() {
    renderFilteredEvents();
  }

  document.getElementById('eventFilter').addEventListener('change', renderFilteredEvents);

  // ─── Feed Tab ──────────────────────────────────────────────────────────────
  function renderFeed() {
    const container = document.getElementById('feedContainer');
    const all = DB.announcements.getAll();
    if (all.length === 0) {
      UI.showEmptyState('feedContainer', 'No announcements yet.', '📢');
      return;
    }
    container.innerHTML = all.map(ann => {
      const club = DB.clubs.getById(ann.clubId);
      return `<div class="ann-card" style="border-left-color:${UI.categoryColor(club ? club.category : 'Academic')}">
        <div class="ann-club">📌 ${club ? club.name : 'Unknown Club'} &nbsp; ${UI.badge(club ? club.category : '', 'active')}</div>
        <div class="ann-msg">${ann.message}</div>
        <div class="ann-time">${UI.timeAgo(ann.createdAt)}</div>
      </div>`;
    }).join('');
  }
});
