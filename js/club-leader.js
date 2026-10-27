// js/club-leader.js — Full Club Leader Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
  DB.seed();

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  const currentUser = Auth.requireRole('club-leader');
  if (!currentUser) return;

  // ─── Header ──────────────────────────────────────────────────────────────
  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userAvatar').src = currentUser.avatar;

  // ─── Find Managed Club ────────────────────────────────────────────────────
  const managedClub = DB.clubs.query(c => c.leaderId === currentUser.id)[0];
  if (!managedClub) {
    document.querySelector('.club-banner').innerHTML = `<div style="color:#fff;padding:20px;"><h2>No Club Assigned</h2><p>You are not assigned as leader of any club. Contact the Super Admin.</p></div>`;
    return;
  }

  // ─── Populate Banner ──────────────────────────────────────────────────────
  function refreshBanner() {
    const club = DB.clubs.getById(managedClub.id);
    document.getElementById('clubName').textContent = club.name;
    document.getElementById('clubDesc').textContent = club.category + ' · ' + club.description.substring(0, 80) + '...';
    document.getElementById('clubLogo').src = club.logo;
    document.getElementById('clubDescEdit').value = club.description;
    document.getElementById('clubLogoEdit').value = club.logo;

    const clubEvents = DB.events.query(e => e.clubId === club.id);
    const pendingReqs = DB.joinRequests.query(r => r.clubId === club.id && r.status === 'pending');

    UI.animateCount(document.getElementById('statMembers'), club.members, 600);
    UI.animateCount(document.getElementById('statEvents'), clubEvents.length, 600);
    UI.animateCount(document.getElementById('statPending'), pendingReqs.length, 600);

    // Requests badge
    const badge = document.getElementById('reqBadge');
    if (badge) badge.textContent = pendingReqs.length > 0 ? pendingReqs.length : '';
  }
  refreshBanner();

  // ─── Tab System ──────────────────────────────────────────────────────────
  window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName).style.display = 'block';
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeTab) activeTab.classList.add('active');

    if (tabName === 'events')   renderLeaderEvents();
    if (tabName === 'requests') renderRequests();
    if (tabName === 'members')  renderMembers();
    if (tabName === 'manage')   renderRecentAnnouncements();
  };
  switchTab('manage');

  // ─── Create Event Form ────────────────────────────────────────────────────
  document.getElementById('eventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('evTitle').value.trim();
    const date  = document.getElementById('evDate').value;
    const image = document.getElementById('evImage').value.trim();
    const desc  = document.getElementById('evDesc').value.trim();
    const btn   = document.getElementById('evSubmitBtn');

    // Validation
    let valid = true;
    ['evTitle', 'evDate', 'evDesc'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.classList.add('error'); valid = false; }
      else el.classList.remove('error');
    });
    if (!valid) { UI.showToast('Please fill in all required fields.', 'error'); return; }

    UI.setButtonLoading(btn, true);
    setTimeout(() => {
      const newEvent = DB.events.insert({
        title, date: new Date(date).toISOString(),
        image: image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
        description: desc,
        clubId: managedClub.id
      });
      UI.showToast(`Event "${newEvent.title}" created! 🎉`, 'success');
      this.reset();
      UI.setButtonLoading(btn, false);
      refreshBanner();
    }, 400);
  });

  // ─── Send Announcement Form ───────────────────────────────────────────────
  document.getElementById('announcementForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const msg = document.getElementById('annMsg').value.trim();
    const btn = document.getElementById('annSubmitBtn');
    if (!msg) { UI.showToast('Please write a message.', 'error'); return; }

    UI.setButtonLoading(btn, true);
    setTimeout(() => {
      DB.announcements.insert({ clubId: managedClub.id, message: msg });
      UI.showToast('Announcement sent to all club members! 📢', 'success');
      this.reset();
      UI.setButtonLoading(btn, false);
      renderRecentAnnouncements();
    }, 300);
  });

  // ─── Update Club Info ───────────────────────────────────────────────────
  const uploadInput = document.getElementById('clubLogoUpload');
  if (uploadInput) {
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('clubLogoEdit').value = ev.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  window.saveClubInfo = function() {
    const desc = document.getElementById('clubDescEdit').value.trim();
    const logo = document.getElementById('clubLogoEdit').value.trim();
    if (!desc) return;
    
    const updates = { description: desc };
    if (logo) updates.logo = logo;
    
    DB.clubs.update(managedClub.id, updates);
    UI.showToast('Club info updated!', 'success');
    refreshBanner();
  };

  // ─── Recent Announcements ─────────────────────────────────────────────────
  function renderRecentAnnouncements() {
    const container = document.getElementById('recentAnnouncements');
    if (!container) return;
    const anns = DB.announcements.query(a => a.clubId === managedClub.id).slice(0, 3);
    if (anns.length === 0) {
      container.innerHTML = '<p style="font-size:13px;color:#bbb;">No announcements sent yet.</p>';
      return;
    }
    container.innerHTML = anns.map(a => `
      <div style="padding:10px 14px;background:#f8f6ff;border-radius:10px;margin-bottom:8px;font-size:13px;color:#444;border-left:3px solid #4a1c84;line-height:1.5;">
        ${a.message}
        <div style="font-size:11px;color:#bbb;margin-top:4px;">${UI.timeAgo(a.createdAt)}</div>
      </div>
    `).join('');
  }

  // ─── Events Tab ───────────────────────────────────────────────────────────
  window.refreshLeaderEvents = function() { renderLeaderEvents(); refreshBanner(); };

  function renderLeaderEvents() {
    const events = DB.events.query(e => e.clubId === managedClub.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    renderEvents('eventsContainer', events, 'leader', currentUser.id);
  }

  // ─── Requests Tab ─────────────────────────────────────────────────────────
  function renderRequests() {
    const container = document.getElementById('requestsContainer');
    const requests = DB.joinRequests.query(r => r.clubId === managedClub.id);
    if (requests.length === 0) {
      UI.showEmptyState('requestsContainer', 'No join requests yet.', '📨');
      return;
    }
    container.innerHTML = '';
    requests.forEach(req => {
      const student = DB.users.getById(req.studentId);
      if (!student) return;
      const card = document.createElement('div');
      card.className = 'request-card';
      card.innerHTML = `
        <div class="req-head">
          <img src="${student.avatar}" class="req-avatar" alt="${student.name}" onerror="this.src='https://i.pravatar.cc/150'">
          <div>
            <div class="req-name">${student.name}</div>
            <div class="req-date">${UI.formatDateShort(req.createdAt)}</div>
          </div>
          <div style="margin-left:auto;">${UI.badge(req.status, req.status)}</div>
        </div>
        <div class="req-msg">"${req.message}"</div>
        ${req.status === 'pending' ? `
        <div class="req-actions">
          <button onclick="handleRequest(${req.id}, 'approved')" class="btn-approve">✓ Approve</button>
          <button onclick="handleRequest(${req.id}, 'rejected')" class="btn-reject">✕ Reject</button>
        </div>` : ''}
      `;
      container.appendChild(card);
    });
  }

  window.handleRequest = function(reqId, action) {
    const label = action === 'approved' ? 'approve' : 'reject';
    UI.showConfirm(
      `${action === 'approved' ? 'Approve' : 'Reject'} Request`,
      `Are you sure you want to ${label} this join request?`,
      () => {
        DB.joinRequests.updateStatus(reqId, action);
        const msg = action === 'approved' ? 'Member approved and added to the club! ✅' : 'Request rejected.';
        UI.showToast(msg, action === 'approved' ? 'success' : 'info');
        renderRequests();
        refreshBanner();
      }
    );
  };

  // ─── Members Tab ──────────────────────────────────────────────────────────
  function renderMembers() {
    const container = document.getElementById('membersContainer');
    // Find all users who are members of this club
    const members = DB.users.getAll().filter(u => u.clubMemberships && u.clubMemberships.includes(managedClub.id));
    if (members.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:40px;color:#aaa;">
        <div style="font-size:2rem;margin-bottom:10px;">👥</div>
        <p style="font-weight:600;">No members yet.</p>
        <p style="font-size:13px;">Approve join requests to grow your roster.</p>
      </div>`;
      return;
    }
    container.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">${members.length} Members</div>
      ${members.map(m => `
        <div class="member-item">
          <img src="${m.avatar}" class="member-avatar" onerror="this.src='https://i.pravatar.cc/150'">
          <div>
            <div class="member-name">${m.name}</div>
            <div class="member-role">${m.email}</div>
          </div>
          ${UI.badge('Member', 'approved')}
        </div>
      `).join('')}
    `;
  }
});
