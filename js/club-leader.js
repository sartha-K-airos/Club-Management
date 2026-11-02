// js/club-leader.js — Full Club Leader Operations & Event Management Logic

document.addEventListener('DOMContentLoaded', async () => {
  // ─── Auth Guard (0ms synchronous check) ──────────────────────────────────
  const currentUser = Auth.requireRole('club-leader');
  if (!currentUser) return;

  // ─── Header Instant Render ───────────────────────────────────────────────
  const userEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  if (userEl) userEl.textContent = currentUser.name;
  if (avatarEl) avatarEl.src = currentUser.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=4a1c84&color=fff');

  await API.ready();

  // ─── Find Managed Club ────────────────────────────────────────────────────
  let managedClub = DB.clubs.query(c => Number(c.leaderId) === Number(currentUser.id))[0];
  if (!managedClub && currentUser.name) {
    managedClub = DB.clubs.query(c => c.leaderName && c.leaderName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())[0];
  }

  if (!managedClub) {
    const banner = document.querySelector('.club-banner');
    if (banner) {
      banner.innerHTML = `
        <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);border-radius:18px;padding:36px 24px;text-align:center;width:100%;border:1px solid rgba(255,255,255,0.2);">
          <div style="font-size:3rem;margin-bottom:12px;">⏳</div>
          <h2 style="font-family:'Playfair Display',serif;color:#fff;margin:0 0 10px;font-size:1.6rem;">Leadership Assignment Pending</h2>
          <p style="color:rgba(255,255,255,0.9);font-size:14.5px;max-width:540px;margin:0 auto 12px;line-height:1.6;">
            Welcome, <strong>${currentUser.name}</strong>! Your account has Club Leader privileges.
            The Super Admin has not assigned you to lead a specific club charter yet.
          </p>
          <p style="color:rgba(255,255,255,0.65);font-size:12.5px;margin:0;">Once assigned from the Super Admin portal, your full club dashboard and operations will activate automatically.</p>
        </div>`;
    }
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    return;
  }

  // Active sub-tab state inside event modal
  window.currentLeaderModalTab = 'attendance';

  // ─── Populate Banner ──────────────────────────────────────────────────────
  function refreshBanner() {
    const club = DB.clubs.getById(managedClub.id) || managedClub;
    if (!club) return;
    document.getElementById('clubName').textContent = club.name;
    document.getElementById('clubDesc').textContent = `${club.category || 'General'} · ${(club.description || '').substring(0, 95)}...`;

    const logoUrl = club.icon || club.logo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent((club.name || 'CL').substring(0, 2)) + '&background=4a1c84&color=fff&bold=true');
    const logoEl = document.getElementById('clubLogo');
    if (logoEl) logoEl.src = logoUrl;
    const previewEl = document.getElementById('clubLogoPreview');
    if (previewEl) { previewEl.src = logoUrl; previewEl.style.display = 'block'; }
    const urlInput = document.getElementById('clubLogoUrlEdit');
    if (urlInput) urlInput.value = club.icon || club.logo || '';

    const descEdit = document.getElementById('clubDescEdit');
    if (descEdit) descEdit.value = club.description || '';

    const clubEvents = DB.events.query(e => e.clubId === club.id);
    const pendingReqs = DB.joinRequests.query(r => r.clubId === club.id && r.status === 'pending');

    UI.animateCount(document.getElementById('statMembers'), club.members || 0, 500);
    UI.animateCount(document.getElementById('statEvents'), clubEvents.length, 500);
    UI.animateCount(document.getElementById('statPending'), pendingReqs.length, 500);

    const badge = document.getElementById('reqBadge');
    if (badge) {
      if (pendingReqs.length > 0) {
        badge.textContent = pendingReqs.length;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }
  refreshBanner();

  // ─── Tab Switching ────────────────────────────────────────────────────────
  window.switchTab = function (tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) targetTab.style.display = 'block';

    const activeNav = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeNav) activeNav.classList.add('active');

    // Trigger tab-specific renders
    if (tabName === 'events') renderLeaderEvents();
    if (tabName === 'reports') initReportsTab();
    if (tabName === 'team') renderClubHierarchy();
    if (tabName === 'requests') renderDetailedRequests();
    if (tabName === 'members') renderMembers();
    if (tabName === 'manage') renderRecentAnnouncements();
  };

  // ─── Sub-Tab Switching for Reports ────────────────────────────────────────
  window.switchReportSubTab = function (subTab) {
    const btnEv = document.getElementById('btnSubTabEventReport');
    const btnQ = document.getElementById('btnSubTabQuarterlyReport');
    const contentEv = document.getElementById('subTabContentEventReport');
    const contentQ = document.getElementById('subTabContentQuarterlyReport');

    if (subTab === 'eventReport') {
      btnEv.classList.add('active');
      btnQ.classList.remove('active');
      contentEv.style.display = 'block';
      contentQ.style.display = 'none';
      renderSubmittedReports();
    } else {
      btnQ.classList.add('active');
      btnEv.classList.remove('active');
      contentQ.style.display = 'block';
      contentEv.style.display = 'none';
      renderQuarterlyReportsArchive();
    }
  };

  // ─── Create Event Form ────────────────────────────────────────────────────
  const evForm = document.getElementById('eventForm');
  if (evForm) {
    evForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const title = document.getElementById('evTitle').value.trim();
      const date = document.getElementById('evDate').value;
      const venue = document.getElementById('evVenue').value.trim();
      const capacity = parseInt(document.getElementById('evCapacity').value) || 100;
      const isPaid = document.getElementById('evIsPaid') ? (document.getElementById('evIsPaid').value === 'true') : false;
      const price = isPaid && document.getElementById('evPrice') ? (parseInt(document.getElementById('evPrice').value) || 0) : 0;
      const image = document.getElementById('evImage').value.trim();
      const desc = document.getElementById('evDesc').value.trim();
      const btn = document.getElementById('evSubmitBtn');

      if (!title || !date || !desc) {
        UI.showToast('Please fill in required event fields.', 'error');
        return;
      }

      UI.setButtonLoading(btn, true);
      setTimeout(() => {
        const newEv = DB.events.insert({
          title,
          date: new Date(date).toISOString(),
          venue: venue || 'MITS Campus',
          capacity: capacity,
          isPaid: isPaid,
          price: price,
          image: image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
          description: desc,
          clubId: managedClub.id
        });
        UI.showToast(`Event "${newEv.title}" (${isPaid ? 'Paid: ₹' + price : 'Free'}) published! 🎉`, 'success');
        evForm.reset();
        toggleEventPriceInput();
        UI.setButtonLoading(btn, false);
        refreshBanner();
        switchTab('events');
      }, 400);
    });
  }

  window.toggleEventPriceInput = function () {
    const el = document.getElementById('evIsPaid');
    const group = document.getElementById('evPriceGroup');
    if (el && group) {
      group.style.display = (el.value === 'true') ? 'block' : 'none';
    }
  };

  // ─── Send Announcement Form ───────────────────────────────────────────────
  const annForm = document.getElementById('announcementForm');
  if (annForm) {
    annForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const msg = document.getElementById('annMsg').value.trim();
      const btn = document.getElementById('annSubmitBtn');
      if (!msg) { UI.showToast('Please enter an announcement message.', 'error'); return; }

      UI.setButtonLoading(btn, true);
      setTimeout(() => {
        DB.announcements.insert({ clubId: managedClub.id, message: msg });
        UI.showToast('Announcement broadcasted to members! 📢', 'success');
        annForm.reset();
        UI.setButtonLoading(btn, false);
        renderRecentAnnouncements();
      }, 350);
    });
  }

  function renderRecentAnnouncements() {
    const container = document.getElementById('recentAnnouncements');
    if (!container) return;
    const list = DB.announcements.query(a => a.clubId === managedClub.id).slice(0, 4);
    if (list.length === 0) {
      container.innerHTML = '<p style="color:#aaa;font-size:12px;">No announcements yet.</p>';
      return;
    }
    container.innerHTML = list.map(a => `
      <div style="font-size:12px;color:#555;padding:6px 0;border-bottom:1px solid #f4f4f4;">
        <span>📌 ${a.message}</span>
        <span style="display:block;font-size:10px;color:#bbb;margin-top:2px;">${UI.formatDateShort(a.createdAt)}</span>
      </div>
    `).join('');
  }

  // ─── Club Logo Upload & Profile Update ────────────────────────────────────
  window.triggerClubLogoUpload = function () {
    const input = document.getElementById('clubLogoFileInput');
    if (input) input.click();
  };

  window.handleClubLogoFile = function (event) {
    const file = event.target && event.target.files && event.target.files[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      UI.showToast('Please select an image smaller than 2.5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const dataUrl = e.target.result;
      const urlInput = document.getElementById('clubLogoUrlEdit');
      if (urlInput) urlInput.value = dataUrl;
      const preview = document.getElementById('clubLogoPreview');
      if (preview) { preview.src = dataUrl; preview.style.display = 'block'; }
      const bannerLogo = document.getElementById('clubLogo');
      if (bannerLogo) bannerLogo.src = dataUrl;
      UI.showToast('Logo chosen! Click "Save Club Profile & Logo" to apply changes.', 'info');
    };
    reader.readAsDataURL(file);
  };

  window.saveClubInfo = async function () {
    if (!managedClub) {
      UI.showToast('No managed club assigned to update.', 'error');
      return;
    }
    const desc = document.getElementById('clubDescEdit').value.trim();
    const logoUrl = document.getElementById('clubLogoUrlEdit') ? document.getElementById('clubLogoUrlEdit').value.trim() : '';
    const btn = document.getElementById('saveClubInfoBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

    try {
      const updates = { description: desc };
      if (logoUrl) updates.icon = logoUrl;
      await API.clubs.update(managedClub.id, updates);
      managedClub.description = desc;
      if (logoUrl) { managedClub.icon = logoUrl; managedClub.logo = logoUrl; }
      UI.showToast('Club profile and logo updated successfully! 🎉', 'success');
      refreshBanner();
    } catch (err) {
      console.error('Save club info failed:', err);
      UI.showToast('Failed to save club info: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '💾 Save Club Profile & Logo'; }
    }
  };

  // ─── RENDER LEADER EVENTS (Clean, Simple Grid Interface) ───────────────────
  function renderLeaderEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    const events = DB.events.query(e => e.clubId === managedClub.id);

    if (events.length === 0) {
      container.innerHTML = `
        <div style="grid-column:1/-1;background:#fff;border-radius:20px;padding:48px 24px;text-align:center;border:1.5px solid #ede8f8;box-shadow:0 4px 20px rgba(0,0,0,0.03);">
          <div style="font-size:3rem;margin-bottom:12px;">📅</div>
          <h3 style="font-family:'Playfair Display',serif;color:#2d0c5a;margin:0 0 8px;font-size:1.4rem;">No Events Scheduled Yet</h3>
          <p style="color:#777;font-size:13.5px;max-width:460px;margin:0 auto 20px;line-height:1.5;">Schedule your club's first workshop, hackathon, or seminar. Once created, click on it to manage attendance, registration pass, speakers, gallery, and student feedback!</p>
          <button onclick="switchTab('manage')" class="btn-submit" style="padding:10px 24px;font-size:13px;">+ Schedule First Event</button>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map(ev => {
      const isUpcoming = new Date(ev.date) >= new Date();
      const dateStr = UI.formatDate(ev.date);
      const registrations = DB.eventRegistrations.getByEvent(ev.id);
      const presentCount = registrations.filter(r => r.attended).length;
      const capacity = ev.capacity || 100;
      const venue = ev.venue || 'MITS Campus';

      const experts = DB.resourcePersons.getByEvent(ev.id);
      const glimpses = DB.eventGallery.getByEvent(ev.id);
      const feedback = DB.eventFeedback.getByEvent(ev.id);

      const avgRating = feedback.length
        ? (feedback.reduce((sum, f) => sum + (f.ratingOverall || 5), 0) / feedback.length).toFixed(1)
        : null;

      return `
        <div class="event-simple-card" onclick="openLeaderEventModal(${ev.id})" data-aos="fade-up">
          <div class="event-simple-img-wrap">
            <img src="${ev.image}" alt="${ev.title}" class="event-simple-img" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'">
            <span class="event-simple-badge" style="background:${isUpcoming ? '#d1e7dd' : '#f1f1f5'};color:${isUpcoming ? '#155724' : '#666'};">
              ${isUpcoming ? '🟢 Upcoming' : '🏁 Concluded'}
            </span>
            <span style="position:absolute;bottom:10px;left:10px;background:rgba(255,255,255,0.95);color:${ev.isPaid ? '#7a349c' : '#15803d'};font-size:11px;font-weight:900;padding:3px 9px;border-radius:20px;box-shadow:0 2px 6px rgba(0,0,0,0.12);">
              ${ev.isPaid ? '💰 ₹' + ev.price : '✨ Free'}
            </span>
          </div>

          <div class="event-simple-body">
            <h3 class="event-simple-title">${ev.title}</h3>

            <div class="event-simple-meta">
              <span>📅 <b>${dateStr}</b></span>
              <span>📍 <b>${venue}</b></span>
              <span>👥 <b>${registrations.length}/${capacity}</b> Registered (${presentCount} Present)</span>
            </div>

            <p style="font-size:12.5px;color:#777;margin:0 0 14px;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${ev.description}
            </p>

            <div class="event-chips-row">
              <span class="event-chip-item" style="background:${ev.isPaid ? '#fff3cd' : '#e8f5e9'};color:${ev.isPaid ? '#856404' : '#2e7d32'};font-weight:800;">
                ${ev.isPaid ? '💰 ₹' + ev.price : '✨ Free'}
              </span>
              <span class="event-chip-item">🎙️ ${experts.length} Expert${experts.length === 1 ? '' : 's'}</span>
              <span class="event-chip-item">📸 ${glimpses.length} Moment${glimpses.length === 1 ? '' : 's'}</span>
              <span class="event-chip-item">★ ${feedback.length} Review${feedback.length === 1 ? '' : 's'}${avgRating ? ` (${avgRating}★)` : ''}</span>
            </div>

            <button class="btn-submit" style="margin-top:16px;padding:10px;font-size:12.5px;text-align:center;width:100%;border-radius:10px;">
              ⚙️ Manage Event Details →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ─── OPEN EVENT MANAGEMENT MODAL (Live Attendance, Pass, Experts, Gallery, Feedback) ───
  window.openLeaderEventModal = function (eventId, activeTab = null) {
    const ev = DB.events.getById(eventId);
    if (!ev) return;

    if (activeTab) window.currentLeaderModalTab = activeTab;
    const currentTab = window.currentLeaderModalTab || 'attendance';

    const isUpcoming = new Date(ev.date) >= new Date();
    const dateStr = UI.formatDate(ev.date);
    const registrations = DB.eventRegistrations.getByEvent(ev.id);
    const presentCount = registrations.filter(r => r.attended).length;
    const capacity = ev.capacity || 100;
    const venue = ev.venue || 'MITS Campus';

    const experts = DB.resourcePersons.getByEvent(ev.id);
    const glimpses = DB.eventGallery.getByEvent(ev.id);
    const feedback = DB.eventFeedback.getByEvent(ev.id);

    const avgRating = feedback.length
      ? (feedback.reduce((sum, f) => sum + (f.ratingOverall || 5), 0) / feedback.length).toFixed(1)
      : null;

    const regUrl = `${window.location.origin}${window.location.pathname.replace('club-leader.html', '')}event-register.html?id=${ev.id}`;
    const fbUrl = `${window.location.origin}${window.location.pathname.replace('club-leader.html', '')}event-feedback.html?id=${ev.id}`;

    // Remove existing modal if any
    const existing = document.getElementById('leaderEventModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'leaderEventModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,7,30,0.68);backdrop-filter:blur(8px);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;animation:fadeIn 0.25s ease;';

    modal.innerHTML = `
      <div style="background:#fff;width:100%;max-width:960px;max-height:92vh;border-radius:24px;border:1.5px solid #ede8f8;box-shadow:0 20px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;position:relative;">

        <!-- Modal Top Header -->
        <div style="background:linear-gradient(135deg,#2d0c5a,#4a1c84);color:#fff;padding:22px 28px;position:relative;display:flex;gap:18px;align-items:center;flex-wrap:wrap;">
          <button id="closeLeaderModalBtn" onclick="closeLeaderEventModal()" style="position:absolute;top:18px;right:18px;background:rgba(255,255,255,0.18);color:#fff;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;">✕</button>

          <img src="${ev.image}" alt="${ev.title}" style="width:72px;height:72px;border-radius:14px;object-fit:cover;border:2px solid rgba(255,255,255,0.4);" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'">

          <div style="flex:1;min-width:240px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px;flex-wrap:wrap;">
              <span style="background:${isUpcoming ? '#d1e7dd' : '#f8f9fa'};color:${isUpcoming ? '#155724' : '#555'};font-size:11px;font-weight:800;padding:3px 10px;border-radius:50px;">
                ${isUpcoming ? '🟢 Upcoming Event' : '🏁 Concluded'}
              </span>
              <span style="background:${ev.isPaid ? 'rgba(255,243,205,0.9)' : 'rgba(209,231,221,0.9)'};color:${ev.isPaid ? '#856404' : '#155724'};font-size:11px;font-weight:900;padding:3px 10px;border-radius:50px;">
                ${ev.isPaid ? '💰 Paid: ₹' + ev.price : '✨ Free Entry'}
              </span>
              <span style="font-size:12px;color:rgba(255,255,255,0.75);">ID: #EV-${ev.id}</span>
            </div>
            <h2 style="margin:0 0 4px;font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:800;">${ev.title}</h2>
            <div style="font-size:12.5px;color:rgba(255,255,255,0.85);display:flex;gap:14px;flex-wrap:wrap;">
              <span>📅 ${dateStr}</span>
              <span>📍 ${venue}</span>
              <span>👥 <b>${registrations.length}/${capacity}</b> Registered</span>
            </div>
          </div>

          <!-- Quick Action Buttons on Header -->
          <div style="display:flex;gap:8px;align-items:center;margin-top:6px;flex-wrap:wrap;">
            <a href="event-register.html?id=${ev.id}" target="_blank" style="background:#fff;color:#4a1c84;text-decoration:none;padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:700;">
              🔗 Pass ↗
            </a>
            <a href="event-feedback.html?id=${ev.id}" target="_blank" style="background:#f59e0b;color:#fff;text-decoration:none;padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:700;">
              ★ Feedback ↗
            </a>
            <button onclick="deleteLeaderEventFromModal(${ev.id})" style="background:#ef4444;color:#fff;border:none;padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;">
              🗑️ Delete
            </button>
          </div>
        </div>

        <!-- Modal Sub-Navigation Bar -->
        <div style="background:#faf8fc;border-bottom:1.5px solid #ede8f8;padding:8px 24px;display:flex;gap:8px;overflow-x:auto;">
          <button class="ev-card-tab-btn ${currentTab === 'attendance' ? 'active' : ''}" id="mTabBtn-attendance" onclick="switchLeaderModalTab('attendance', ${ev.id})">
            📋 Live Attendance (${registrations.length})
          </button>
          <button class="ev-card-tab-btn ${currentTab === 'pass' ? 'active' : ''}" id="mTabBtn-pass" onclick="switchLeaderModalTab('pass', ${ev.id})">
            🔗 Registration Pass & QR
          </button>
          <button class="ev-card-tab-btn ${currentTab === 'experts' ? 'active' : ''}" id="mTabBtn-experts" onclick="switchLeaderModalTab('experts', ${ev.id})">
            🎙️ Invited Experts (${experts.length})
          </button>
          <button class="ev-card-tab-btn ${currentTab === 'gallery' ? 'active' : ''}" id="mTabBtn-gallery" onclick="switchLeaderModalTab('gallery', ${ev.id})">
            📸 Glimpses (${glimpses.length})
          </button>
          <button class="ev-card-tab-btn ${currentTab === 'feedback' ? 'active' : ''}" id="mTabBtn-feedback" onclick="switchLeaderModalTab('feedback', ${ev.id})">
            ★ Feedback (${feedback.length}${avgRating ? ` · ${avgRating}★` : ''})
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div style="padding:24px 28px;overflow-y:auto;flex:1;">

          <!-- ══════ 1. LIVE ATTENDANCE TAB ══════ -->
          <div id="mSec-attendance" class="modal-ev-section" style="display:${currentTab === 'attendance' ? 'block' : 'none'};">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
              <div>
                <h3 style="margin:0 0 4px;font-size:16px;font-weight:800;color:#2d0c5a;">Live Event Attendance Check-in</h3>
                <p style="margin:0;font-size:12.5px;color:#777;">Mark attendees present or absent in real-time as students arrive at the venue.</p>
              </div>
              <span id="modalAttendanceBadge" style="background:${presentCount > 0 ? '#d1e7dd' : '#f8d7da'};color:${presentCount > 0 ? '#155724' : '#721c24'};font-size:13px;padding:6px 14px;border-radius:50px;font-weight:800;">
                ${presentCount} / ${registrations.length} Present (${registrations.length ? Math.round((presentCount / registrations.length) * 100) : 0}%)
              </span>
            </div>

            <!-- Attendance Controls: Filter & Quick Scan -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div>
                <label class="form-label" style="font-size:11px;">Search Registered Student</label>
                <input type="text" id="modalAttSearch" class="form-input" style="padding:9px 12px;font-size:12.5px;" placeholder="Search by name, roll no, or code..." oninput="filterModalAttendance(${ev.id})">
              </div>
              <div>
                <label class="form-label" style="font-size:11px;">Quick Code Scan (e.g. REG-201-1234)</label>
                <div style="display:flex;gap:6px;">
                  <input type="text" id="modalScanCode" class="form-input" style="padding:9px 12px;font-size:12.5px;" placeholder="Enter registration code...">
                  <button onclick="scanModalAttendanceCode(${ev.id})" class="btn-submit" style="padding:9px 16px;white-space:nowrap;font-size:12px;">Check-In</button>
                </div>
              </div>
            </div>

            <!-- Attendees Table -->
            <div style="overflow-x:auto;border:1.5px solid #ece6f6;border-radius:14px;">
              <table class="styled-table" style="margin:0;">
                <thead>
                  <tr>
                    <th>Reg Code</th>
                    <th>Student Name</th>
                    <th>Roll Number</th>
                    <th>Department & Year</th>
                    <th>Payment & Pass</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody id="modalAttTableBody">
                  ${registrations.length === 0
        ? `<tr><td colspan="7" style="text-align:center;padding:32px;color:#888;">No students have registered for this event yet.</td></tr>`
        : registrations.map(reg => `
                      <tr>
                        <td><code style="background:#f4f0fa;color:#4a1c84;padding:2px 8px;border-radius:6px;font-weight:700;font-size:11.5px;">${reg.registrationCode}</code></td>
                        <td><b>${reg.studentName}</b><br><span style="font-size:11px;color:#888;">${reg.studentEmail || ''}</span></td>
                        <td>${reg.rollNo || 'N/A'}</td>
                        <td>${reg.branch || 'Eng'}<br><span style="font-size:11px;color:#888;">${reg.year || ''}</span></td>
                        <td>
                          ${reg.isPaid
            ? `<span style="background:#d1fae5;color:#065f46;font-size:11px;font-weight:700;padding:2px 8px;border-radius:50px;display:inline-block;">✓ Paid ₹${reg.amountPaid || '—'}</span><br><span style="font-size:10px;color:#6b7280;font-family:monospace;">${reg.transactionId || 'TXN-PAID'}</span>`
            : `<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:2px 8px;border-radius:50px;display:inline-block;">✨ Free Pass</span>`
          }
                        </td>
                        <td>
                          ${reg.attended
            ? `<span style="background:#d1e7dd;color:#155724;font-size:11px;font-weight:700;padding:3px 8px;border-radius:50px;">✓ Present</span>`
            : `<span style="background:#f8d7da;color:#721c24;font-size:11px;font-weight:700;padding:3px 8px;border-radius:50px;">✕ Absent</span>`
          }
                        </td>
                        <td>
                          <button onclick="toggleModalAttendance(${reg.id}, ${!reg.attended}, ${ev.id})" style="background:${reg.attended ? '#fee2e2' : '#dcfce7'};color:${reg.attended ? '#dc2626' : '#15803d'};border:1px solid ${reg.attended ? '#fca5a5' : '#86efac'};padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">
                            ${reg.attended ? 'Mark Absent' : 'Mark Present'}
                          </button>
                        </td>
                      </tr>
                    `).join('')
      }
                </tbody>
              </table>
            </div>
          </div>

          <!-- ══════ 2. REGISTRATION PASS & QR TAB ══════ -->
          <div id="mSec-pass" class="modal-ev-section" style="display:${currentTab === 'pass' ? 'block' : 'none'};">
            <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;">
              <div>
                <h3 style="margin:0 0 6px;font-size:16px;font-weight:800;color:#2d0c5a;">Public Student Registration Pass</h3>
                <p style="margin:0 0 16px;font-size:13px;color:#666;">Students can register online for this event using the dedicated registration page. Upon registration, a digital entry pass with an instant check-in code is issued.</p>

                <div style="background:#faf8fc;border-radius:14px;padding:16px;border:1.5px solid #ece6f6;margin-bottom:16px;">
                  <label class="form-label" style="font-size:11px;">Dedicated Student Registration Link</label>
                  <div style="display:flex;gap:8px;">
                    <input type="text" readonly value="${regUrl}" id="modalRegLinkInput" class="form-input" style="padding:9px 12px;font-size:12.5px;background:#fff;">
                    <button onclick="copyModalLink('${regUrl}', 'Registration Pass link')" class="btn-submit" style="padding:9px 16px;font-size:12px;white-space:nowrap;">📋 Copy Link</button>
                  </div>
                </div>

                <div style="display:flex;gap:12px;">
                  <a href="event-register.html?id=${ev.id}" target="_blank" class="btn-submit" style="text-decoration:none;padding:10px 18px;font-size:12.5px;display:inline-flex;align-items:center;gap:6px;">
                    Open Student Registration Portal ↗
                  </a>
                </div>
              </div>

              <!-- Pass Preview Card Simulation -->
              <div style="background:linear-gradient(135deg,#2d0c5a,#4a1c84);color:#fff;border-radius:18px;padding:22px;box-shadow:0 8px 24px rgba(74,28,132,0.15);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                  <span style="font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#ff8c5f;">MITS DIGITAL PASS</span>
                  <span style="font-size:11px;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:4px;">CONFIRMED</span>
                </div>
                <h4 style="margin:0 0 6px;font-size:16px;font-weight:800;">${ev.title}</h4>
                <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-bottom:14px;">
                  📅 ${dateStr}<br>📍 ${venue}
                </div>
                <div style="background:#fff;color:#2d0c5a;border-radius:12px;padding:12px;text-align:center;">
                  <div style="font-size:10.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#888;">Pass Code</div>
                  <div style="font-size:16px;font-weight:900;letter-spacing:2px;margin:2px 0;">REG-${ev.id}-XXXX</div>
                  <div style="font-size:10.5px;color:#666;">Scan at venue for instant check-in</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════ 3. INVITED EXPERTS TAB ══════ -->
          <div id="mSec-experts" class="modal-ev-section" style="display:${currentTab === 'experts' ? 'block' : 'none'};">
            <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:24px;">
              <!-- Experts List -->
              <div>
                <h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:#2d0c5a;text-transform:uppercase;letter-spacing:0.5px;">
                  Invited Resource Persons & Speakers (${experts.length})
                </h3>
                ${experts.length === 0
        ? `<div style="background:#faf9fd;border:1.5px dashed #dfd7ee;border-radius:14px;padding:28px;text-align:center;color:#888;font-size:13px;">
                      No resource persons or visiting experts registered for this event yet.<br>
                      <span style="font-size:12px;color:#aaa;">Use the form to the right to add keynote speakers or industry mentors.</span>
                    </div>`
        : `<div style="display:flex;flex-direction:column;gap:12px;">
                      ${experts.map(p => `
                        <div style="background:#faf9fd;border-radius:14px;padding:14px 16px;border:1.5px solid #ece6f6;display:flex;align-items:center;gap:14px;">
                          <img src="${p.avatar}" alt="${p.name}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #4a1c84;">
                          <div style="flex:1;">
                            <h5 style="margin:0;font-size:14px;font-weight:800;color:#2d0c5a;">${p.name}</h5>
                            <div style="font-size:12px;color:#4a1c84;font-weight:700;">${p.title} · ${p.organization}</div>
                            <div style="font-size:11px;color:#666;margin-top:2px;"><b>Focus:</b> ${p.expertise}</div>
                          </div>
                          <button onclick="removeModalExpert(${p.id}, ${ev.id})" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">
                            Remove
                          </button>
                        </div>
                      `).join('')}
                    </div>`
      }
              </div>

              <!-- Add Expert Form -->
              <div class="ev-inline-box">
                <h4 style="margin:0 0 12px;font-size:14px;font-weight:800;color:#2d0c5a;">+ Register Expert for this Event</h4>
                <form id="modalExpForm" onsubmit="handleModalCreateExpert(event, ${ev.id})">
                  <div class="form-row" style="margin-bottom:10px;">
                    <div>
                      <label class="form-label" style="font-size:11px;">Expert Full Name *</label>
                      <input type="text" id="mExpName" class="form-input" style="padding:8px 12px;font-size:12.5px;" placeholder="e.g. Dr. Aris Thorne" required>
                    </div>
                    <div>
                      <label class="form-label" style="font-size:11px;">Designation / Title *</label>
                      <input type="text" id="mExpTitle" class="form-input" style="padding:8px 12px;font-size:12.5px;" placeholder="e.g. Research Scientist" required>
                    </div>
                  </div>
                  <div class="form-row" style="margin-bottom:10px;">
                    <div>
                      <label class="form-label" style="font-size:11px;">Organization / Company *</label>
                      <input type="text" id="mExpOrg" class="form-input" style="padding:8px 12px;font-size:12.5px;" placeholder="e.g. Google DeepMind" required>
                    </div>
                    <div>
                      <label class="form-label" style="font-size:11px;">Topics / Expertise *</label>
                      <input type="text" id="mExpExpertise" class="form-input" style="padding:8px 12px;font-size:12.5px;" placeholder="e.g. LLMs & Multi-Agent AI" required>
                    </div>
                  </div>
                  <div class="form-group" style="margin-bottom:10px;">
                    <label class="form-label" style="font-size:11px;">Photo URL (Optional)</label>
                    <input type="url" id="mExpAvatar" class="form-input" style="padding:8px 12px;font-size:12.5px;" placeholder="https://images.unsplash.com/...">
                  </div>
                  <div class="form-group" style="margin-bottom:12px;">
                    <label class="form-label" style="font-size:11px;">Short Bio</label>
                    <textarea id="mExpBio" class="form-textarea" rows="2" style="padding:8px 12px;font-size:12px;" placeholder="Milestones, education, or talk topic..."></textarea>
                  </div>
                  <button type="submit" class="btn-submit" id="btnModalExpSubmit" style="width:100%;padding:9px;font-size:12.5px;">+ Save Expert</button>
                </form>
              </div>
            </div>
          </div>

          <!-- ══════ 4. PHOTO GLIMPSES TAB ══════ -->
          <div id="mSec-gallery" class="modal-ev-section" style="display:${currentTab === 'gallery' ? 'block' : 'none'};">
            <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:24px;">
              <!-- Glimpses Grid -->
              <div>
                <h3 style="margin:0 0 12px;font-size:15px;font-weight:800;color:#2d0c5a;text-transform:uppercase;letter-spacing:0.5px;">
                  Event Moments & Photo Highlights (${glimpses.length})
                </h3>
                ${glimpses.length === 0
        ? `<div style="background:#faf9fd;border:1.5px dashed #dfd7ee;border-radius:14px;padding:28px;text-align:center;color:#888;font-size:13px;">
                      No photo glimpses uploaded for this event yet.<br>
                      <span style="font-size:12px;color:#aaa;">Upload workshop stage moments, hands-on lab highlights, and award photos!</span>
                    </div>`
        : `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(170px, 1fr));gap:12px;">
                      ${glimpses.map(g => `
                        <div style="background:#fff;border-radius:12px;overflow:hidden;border:1.5px solid #ece6f6;position:relative;">
                          <img src="${g.imageUrl}" alt="Glimpse" style="width:100%;height:120px;object-fit:cover;" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'">
                          <div style="padding:8px 10px;">
                            <span style="font-size:10px;font-weight:700;color:#4338ca;background:#eef2ff;padding:2px 6px;border-radius:4px;">${g.tag || 'Moment'}</span>
                            <p style="margin:4px 0 0;font-size:11.5px;color:#555;line-height:1.3;">${g.caption}</p>
                          </div>
                          <button onclick="removeModalGlimpse(${g.id}, ${ev.id})" style="position:absolute;top:6px;right:6px;background:rgba(220,38,38,0.9);color:#fff;border:none;width:24px;height:24px;border-radius:50%;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
                        </div>
                      `).join('')}
                    </div>`
      }
              </div>

              <!-- Upload Glimpse Form -->
              <div class="ev-inline-box">
                <h4 style="margin:0 0 12px;font-size:14px;font-weight:800;color:#2d0c5a;">+ Upload Photo Glimpse</h4>
                <form id="modalGalForm" onsubmit="handleModalCreateGlimpse(event, ${ev.id})">
                  <div class="form-group" style="margin-bottom:10px;">
                    <label class="form-label" style="font-size:11px;">Image URL *</label>
                    <input type="url" id="mGalUrl" class="form-input" style="padding:8px 12px;font-size:12.5px;" placeholder="https://images.unsplash.com/..." required>
                  </div>
                  <div class="form-group" style="margin-bottom:10px;">
                    <label class="form-label" style="font-size:11px;">Category Tag *</label>
                    <select id="mGalTag" class="form-select" style="padding:8px 12px;font-size:12.5px;" required>
                      <option value="Live Workshop">Live Workshop</option>
                      <option value="Keynote Talk">Keynote Talk</option>
                      <option value="Hands-on Lab">Hands-on Lab</option>
                      <option value="Award Ceremony">Award Ceremony</option>
                      <option value="Group Photo">Group Photo</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom:12px;">
                    <label class="form-label" style="font-size:11px;">Caption & Context *</label>
                    <textarea id="mGalCaption" class="form-textarea" rows="2" style="padding:8px 12px;font-size:12px;" placeholder="Describe what happened in this moment..." required></textarea>
                  </div>
                  <button type="submit" class="btn-submit" id="btnModalGalSubmit" style="width:100%;padding:9px;font-size:12.5px;">+ Add to Gallery</button>
                </form>
              </div>
            </div>
          </div>

          <!-- ══════ 5. STUDENT FEEDBACK TAB ══════ -->
          <div id="mSec-feedback" class="modal-ev-section" style="display:${currentTab === 'feedback' ? 'block' : 'none'};">
            <!-- Feedback Summary & Share Link -->
            <div style="background:#faf8fc;border-radius:16px;padding:18px;border:1.5px solid #ece6f6;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;">
              <div style="display:flex;align-items:center;gap:18px;">
                <div style="background:#fff;border-radius:14px;padding:12px 20px;border:1.5px solid #ede8f8;text-align:center;">
                  <div style="font-size:2rem;font-weight:900;color:#2d0c5a;line-height:1;">${avgRating || '—'}</div>
                  <div style="color:#f59e0b;font-size:13px;margin-top:2px;">★★★★★</div>
                  <div style="font-size:10.5px;color:#888;font-weight:700;text-transform:uppercase;">${feedback.length} Ratings</div>
                </div>
                <div>
                  <h4 style="margin:0 0 4px;font-size:15px;font-weight:800;color:#2d0c5a;">Event Feedback & Ratings</h4>
                  <p style="margin:0;font-size:12.5px;color:#666;">Ratings and suggestions directly submitted by attending students.</p>
                </div>
              </div>

              <!-- Share Feedback URL -->
              <div style="display:flex;align-items:center;gap:8px;">
                <button onclick="copyModalLink('${fbUrl}', 'Student Feedback link')" class="btn-secondary" style="padding:8px 14px;font-size:12px;">
                  📋 Copy Feedback Link
                </button>
                <a href="event-feedback.html?id=${ev.id}" target="_blank" class="btn-submit" style="text-decoration:none;padding:8px 14px;font-size:12px;">
                  Open Feedback Page ↗
                </a>
              </div>
            </div>

            <!-- Reviews List -->
            ${feedback.length === 0
        ? `<div style="background:#fff;border:1.5px dashed #dfd7ee;border-radius:14px;padding:32px;text-align:center;color:#888;font-size:13px;">
                  No student feedback submitted for this event yet.<br>
                  <span style="font-size:12px;color:#aaa;">Share the feedback link with attendees to gather ratings!</span>
                </div>`
        : `<div style="display:flex;flex-direction:column;gap:12px;">
                  ${feedback.map(fb => `
                    <div style="background:#fff;border-radius:14px;padding:16px 18px;border:1.5px solid #ece6f6;">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <div>
                          <span style="font-weight:800;font-size:14px;color:#2d0c5a;">${fb.studentName || 'Student Participant'}</span>
                          <span style="font-size:11.5px;color:#888;margin-left:8px;">${UI.formatDateShort(fb.submittedAt || ev.date)}</span>
                        </div>
                        <div style="color:#f59e0b;font-weight:800;font-size:13.5px;">★ ${fb.ratingOverall || 5}/5 Overall</div>
                      </div>

                      <div style="display:flex;gap:16px;font-size:11.5px;color:#777;margin-bottom:8px;flex-wrap:wrap;">
                        <span>Speaker: <b style="color:#2d0c5a;">★ ${fb.ratingSpeaker || 5}/5</b></span>
                        <span>Organization: <b style="color:#2d0c5a;">★ ${fb.ratingOrganization || 4}/5</b></span>
                        <span>Relevance: <b style="color:#2d0c5a;">★ ${fb.ratingRelevance || 5}/5</b></span>
                      </div>

                      <p style="margin:0 0 6px;font-size:13px;color:#444;line-height:1.45;">"${fb.comments}"</p>
                      ${fb.suggestions ? `<div style="background:#faf8fc;border-left:3px solid #7a349c;padding:6px 12px;border-radius:4px;font-size:11.5px;color:#4a1c84;">💡 <b>Suggestion:</b> ${fb.suggestions}</div>` : ''}
                    </div>
                  `).join('')}
                </div>`
      }
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(modal);
  };

  window.closeLeaderEventModal = function () {
    const modal = document.getElementById('leaderEventModal');
    if (modal) modal.remove();
  };

  window.switchLeaderModalTab = function (tabName, eventId) {
    window.currentLeaderModalTab = tabName;
    document.querySelectorAll('.modal-ev-section').forEach(sec => sec.style.display = 'none');
    document.querySelectorAll('#leaderEventModal .ev-card-tab-btn').forEach(btn => btn.classList.remove('active'));

    const activeBtn = document.getElementById(`mTabBtn-${tabName}`);
    const activeSec = document.getElementById(`mSec-${tabName}`);
    if (activeBtn) activeBtn.classList.add('active');
    if (activeSec) activeSec.style.display = 'block';
  };

  // ─── Modal Attendance Check-in Handlers ──────────────────────────────────
  window.toggleModalAttendance = function (regId, markPresent, eventId) {
    DB.eventRegistrations.markAttendance(regId, markPresent);
    UI.showToast(markPresent ? 'Attendance marked: Present ✓' : 'Status updated: Absent', markPresent ? 'success' : 'info');
    openLeaderEventModal(eventId, 'attendance');
    renderLeaderEvents();
    if (document.getElementById('attendanceEventSelect')) loadAttendanceList();
  };

  window.scanModalAttendanceCode = function (eventId) {
    const code = (document.getElementById('modalScanCode').value || '').trim();
    if (!code) { UI.showToast('Please enter registration code.', 'warning'); return; }

    const updated = DB.eventRegistrations.markAttendanceByCode(eventId, code, true);
    if (updated) {
      const payInfo = updated.isPaid ? ` [Verified Paid: ₹${updated.amountPaid || ''}]` : ' [Free Pass]';
      UI.showToast(`✓ Marked Present: ${updated.studentName} (${updated.registrationCode})${payInfo}`, 'success');
      openLeaderEventModal(eventId, 'attendance');
      renderLeaderEvents();
      if (document.getElementById('attendanceEventSelect')) loadAttendanceList();
    } else {
      UI.showToast('Registration code not found for this event.', 'error');
    }
  };

  window.filterModalAttendance = function (eventId) {
    const query = (document.getElementById('modalAttSearch').value || '').trim().toLowerCase();
    const tableBody = document.getElementById('modalAttTableBody');
    if (!tableBody) return;

    const all = DB.eventRegistrations.getByEvent(eventId);
    const filtered = all.filter(r =>
      (r.studentName && r.studentName.toLowerCase().includes(query)) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(query)) ||
      (r.registrationCode && r.registrationCode.toLowerCase().includes(query))
    );

    if (filtered.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">No matching registered students found.</td></tr>';
      return;
    }

    tableBody.innerHTML = filtered.map(reg => `
      <tr>
        <td><code style="background:#f4f0fa;color:#4a1c84;padding:2px 8px;border-radius:6px;font-weight:700;font-size:11.5px;">${reg.registrationCode}</code></td>
        <td><b>${reg.studentName}</b><br><span style="font-size:11px;color:#888;">${reg.studentEmail || ''}</span></td>
        <td>${reg.rollNo || 'N/A'}</td>
        <td>${reg.branch || 'Eng'}<br><span style="font-size:11px;color:#888;">${reg.year || ''}</span></td>
        <td>
          ${reg.isPaid
        ? `<span style="background:#d1fae5;color:#065f46;font-size:11px;font-weight:700;padding:2px 8px;border-radius:50px;display:inline-block;">✓ Paid ₹${reg.amountPaid || '—'}</span><br><span style="font-size:10px;color:#6b7280;font-family:monospace;">${reg.transactionId || 'TXN-PAID'}</span>`
        : `<span style="background:#ede9fe;color:#5b21b6;font-size:11px;font-weight:700;padding:2px 8px;border-radius:50px;display:inline-block;">✨ Free Pass</span>`
      }
        </td>
        <td>
          ${reg.attended
        ? `<span style="background:#d1e7dd;color:#155724;font-size:11px;font-weight:700;padding:3px 8px;border-radius:50px;">✓ Present</span>`
        : `<span style="background:#f8d7da;color:#721c24;font-size:11px;font-weight:700;padding:3px 8px;border-radius:50px;">✕ Absent</span>`
      }
        </td>
        <td>
          <button onclick="toggleModalAttendance(${reg.id}, ${!reg.attended}, ${eventId})" style="background:${reg.attended ? '#fee2e2' : '#dcfce7'};color:${reg.attended ? '#dc2626' : '#15803d'};border:1px solid ${reg.attended ? '#fca5a5' : '#86efac'};padding:5px 12px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">
            ${reg.attended ? 'Mark Absent' : 'Mark Present'}
          </button>
        </td>
      </tr>
    `).join('');
  };

  // ─── Modal Expert Handlers ────────────────────────────────────────────────
  window.handleModalCreateExpert = function (e, eventId) {
    e.preventDefault();
    const name = document.getElementById('mExpName').value.trim();
    const title = document.getElementById('mExpTitle').value.trim();
    const org = document.getElementById('mExpOrg').value.trim();
    const expertise = document.getElementById('mExpExpertise').value.trim();
    const avatar = document.getElementById('mExpAvatar').value.trim();
    const bio = document.getElementById('mExpBio').value.trim();
    const btn = document.getElementById('btnModalExpSubmit');

    if (!name || !title || !org || !expertise) {
      UI.showToast('Please fill in required expert fields.', 'error');
      return;
    }

    UI.setButtonLoading(btn, true);
    setTimeout(() => {
      DB.resourcePersons.insert({
        clubId: managedClub.id,
        eventId: eventId,
        name: name,
        title: title,
        organization: org,
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.substring(0, 2))}&background=4a1c84&color=fff`,
        expertise: expertise,
        bio: bio
      });

      UI.setButtonLoading(btn, false);
      UI.showToast(`Expert "${name}" registered for this event! 🎙️`, 'success');
      openLeaderEventModal(eventId, 'experts');
      renderLeaderEvents();
    }, 300);
  };

  window.removeModalExpert = function (expertId, eventId) {
    if (!confirm('Remove this resource expert from the event?')) return;
    DB.resourcePersons.delete(expertId);
    UI.showToast('Resource expert removed from event.', 'info');
    openLeaderEventModal(eventId, 'experts');
    renderLeaderEvents();
  };

  // ─── Modal Glimpse Handlers ───────────────────────────────────────────────
  window.handleModalCreateGlimpse = function (e, eventId) {
    e.preventDefault();
    const imgUrl = document.getElementById('mGalUrl').value.trim();
    const tag = document.getElementById('mGalTag').value;
    const caption = document.getElementById('mGalCaption').value.trim();
    const btn = document.getElementById('btnModalGalSubmit');

    if (!imgUrl || !caption) {
      UI.showToast('Please provide photo URL and caption.', 'error');
      return;
    }

    UI.setButtonLoading(btn, true);
    setTimeout(() => {
      DB.eventGallery.insert({
        clubId: managedClub.id,
        eventId: eventId,
        imageUrl: imgUrl,
        tag: tag,
        caption: caption,
        uploadedBy: currentUser.id
      });

      UI.setButtonLoading(btn, false);
      UI.showToast('Photo glimpse added to this event! 📸', 'success');
      openLeaderEventModal(eventId, 'gallery');
      renderLeaderEvents();
    }, 300);
  };

  window.removeModalGlimpse = function (glimpseId, eventId) {
    if (!confirm('Delete this photo glimpse?')) return;
    DB.eventGallery.delete(glimpseId);
    UI.showToast('Photo glimpse removed from event.', 'info');
    openLeaderEventModal(eventId, 'gallery');
    renderLeaderEvents();
  };

  // ─── Delete Event from Modal or Card ─────────────────────────────────────
  window.deleteLeaderEventFromModal = function (eventId) {
    const ev = DB.events.getById(eventId);
    const title = ev ? ev.title : 'this event';
    if (!confirm(`Are you sure you want to permanently delete "${title}"? This will also remove its registrations, gallery photos, and expert links.`)) return;

    DB.events.delete(eventId);
    closeLeaderEventModal();
    UI.showToast(`Event "${title}" deleted.`, 'info');
    refreshBanner();
    renderLeaderEvents();
  };

  window.deleteLeaderEvent = function (eventId) {
    deleteLeaderEventFromModal(eventId);
  };

  // ─── Copy Link Helper ────────────────────────────────────────────────────
  window.copyModalLink = function (url, label = 'Link') {
    navigator.clipboard.writeText(url).then(() => {
      UI.showToast(`${label} copied to clipboard! 📋`, 'success');
    }).catch(() => {
      prompt(`Copy ${label}:`, url);
    });
  };

  // ─── Requirement 3: Live Event Attendance System ──────────────────────────
  function initAttendanceTab() {
    const select = document.getElementById('attendanceEventSelect');
    if (!select) return;
    select.innerHTML = '';
    const clubEvents = DB.events.query(e => e.clubId === managedClub.id);
    if (clubEvents.length === 0) {
      select.innerHTML = '<option value="">No events found</option>';
      return;
    }
    clubEvents.forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev.id;
      opt.textContent = `${ev.title} (${UI.formatDateShort(ev.date)})`;
      select.appendChild(opt);
    });
    loadAttendanceList();
  }

  window.selectAttendanceEvent = function (eventId) {
    openLeaderEventModal(eventId, 'attendance');
  };

  window.loadAttendanceList = function () {
    const select = document.getElementById('attendanceEventSelect');
    const tableBody = document.getElementById('attendanceTableBody');
    const badge = document.getElementById('attendanceSummaryBadge');
    if (!select || !tableBody) return;

    const eventId = parseInt(select.value);
    if (!eventId) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:#888;">Select an event above.</td></tr>';
      return;
    }

    const registrations = DB.eventRegistrations.getByEvent(eventId);
    const presentCount = registrations.filter(r => r.attended).length;
    const totalCount = registrations.length;

    if (badge) {
      badge.textContent = `${presentCount} / ${totalCount} Present (${totalCount ? Math.round((presentCount / totalCount) * 100) : 0}%)`;
      badge.style.background = presentCount > 0 ? '#d1e7dd' : '#f8d7da';
      badge.style.color = presentCount > 0 ? '#155724' : '#721c24';
    }

    if (registrations.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:#888;">No students have registered for this event yet.</td></tr>';
      return;
    }

    renderAttendanceRows(registrations);
  };

  function renderAttendanceRows(list) {
    const tableBody = document.getElementById('attendanceTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = list.map(reg => `
      <tr id="attRow-${reg.id}">
        <td><code style="background:#f4f0fa;color:#4a1c84;padding:3px 8px;border-radius:6px;font-weight:700;">${reg.registrationCode}</code></td>
        <td><strong>${reg.studentName}</strong><br><span style="font-size:11px;color:#888;">${reg.studentEmail || ''}</span></td>
        <td>${reg.rollNo || 'N/A'}</td>
        <td>${reg.branch || 'Eng'}<br><span style="font-size:11px;color:#888;">${reg.year || ''}</span></td>
        <td>${reg.phone || 'N/A'}</td>
        <td>
          ${reg.attended
        ? `<span style="background:#d1e7dd;color:#155724;font-size:11px;font-weight:700;padding:4px 10px;border-radius:50px;">✓ Present</span>`
        : `<span style="background:#f8d7da;color:#721c24;font-size:11px;font-weight:700;padding:4px 10px;border-radius:50px;">✕ Absent</span>`
      }
        </td>
        <td>
          <button onclick="toggleAttendance(${reg.id}, ${!reg.attended})" style="background:${reg.attended ? '#fee2e2' : '#dcfce7'};color:${reg.attended ? '#dc2626' : '#15803d'};border:1px solid ${reg.attended ? '#fca5a5' : '#86efac'};padding:5px 12px;border-radius:6px;font-size:11.5px;font-weight:700;cursor:pointer;">
            ${reg.attended ? 'Mark Absent' : 'Mark Present'}
          </button>
        </td>
      </tr>
    `).join('');
  }

  window.toggleAttendance = function (regId, markPresent) {
    DB.eventRegistrations.markAttendance(regId, markPresent);
    UI.showToast(markPresent ? 'Attendance marked: Present ✓' : 'Status updated: Absent', markPresent ? 'success' : 'info');
    loadAttendanceList();
  };

  window.filterAttendanceList = function () {
    const query = (document.getElementById('attendanceSearch').value || '').trim().toLowerCase();
    const eventId = parseInt(document.getElementById('attendanceEventSelect').value);
    if (!eventId) return;
    const all = DB.eventRegistrations.getByEvent(eventId);
    const filtered = all.filter(r =>
      (r.studentName && r.studentName.toLowerCase().includes(query)) ||
      (r.rollNo && r.rollNo.toLowerCase().includes(query)) ||
      (r.registrationCode && r.registrationCode.toLowerCase().includes(query))
    );
    renderAttendanceRows(filtered);
  };

  window.markByScannedCode = function () {
    const code = (document.getElementById('scanCodeInput').value || '').trim();
    const eventId = parseInt(document.getElementById('attendanceEventSelect').value);
    if (!code || !eventId) { UI.showToast('Please enter registration code.', 'warning'); return; }

    const updated = DB.eventRegistrations.markAttendanceByCode(eventId, code, true);
    if (updated) {
      UI.showToast(`✓ Marked Present: ${updated.studentName} (${updated.registrationCode})`, 'success');
      document.getElementById('scanCodeInput').value = '';
      loadAttendanceList();
    } else {
      UI.showToast('Registration code not found for this event.', 'error');
    }
  };

  // ─── Requirement 1: Post-Event Reports Submission to SuperAdmin ───────────
  function initReportsTab() {
    const select = document.getElementById('repEventSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Choose Completed Event --</option>';
    const clubEvents = DB.events.query(e => e.clubId === managedClub.id);
    clubEvents.forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev.id;
      opt.textContent = `${ev.title} (${UI.formatDateShort(ev.date)})`;
      select.appendChild(opt);
    });
    renderSubmittedReports();
  }

  const repForm = document.getElementById('eventReportForm');
  if (repForm) {
    repForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const eventId = parseInt(document.getElementById('repEventSelect').value);
      const attCount = parseInt(document.getElementById('repAttendance').value) || 0;
      const budget = parseFloat(document.getElementById('repBudget').value) || 0;
      const experts = document.getElementById('repExperts').value.trim();
      const summary = document.getElementById('repSummary').value.trim();
      const outcomes = document.getElementById('repOutcomes').value.trim();
      const btn = document.getElementById('btnSubmitRep');

      if (!eventId) { UI.showToast('Please select an event.', 'error'); return; }

      const ev = DB.events.getById(eventId);
      UI.setButtonLoading(btn, true);

      setTimeout(() => {
        DB.eventReports.insert({
          eventId: eventId,
          clubId: managedClub.id,
          submittedBy: currentUser.id,
          submittedByName: currentUser.name,
          eventTitle: ev ? ev.title : 'Event',
          conductedDate: ev ? ev.date.split('T')[0] : new Date().toISOString().split('T')[0],
          venue: ev ? ev.venue : 'MITS Campus',
          attendanceCount: attCount,
          budgetSpent: budget,
          guestExperts: experts,
          summary: summary,
          objectivesAchieved: outcomes
        });

        UI.setButtonLoading(btn, false);
        UI.showToast('Event Report submitted directly to SuperAdmin! 📄', 'success');
        repForm.reset();
        renderSubmittedReports();
      }, 400);
    });
  }

  function renderSubmittedReports() {
    const container = document.getElementById('submittedReportsList');
    if (!container) return;
    const list = DB.eventReports.getByClub(managedClub.id);
    if (list.length === 0) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#888;background:#fafafa;border-radius:12px;">No event reports submitted yet.</div>';
      return;
    }
    container.innerHTML = list.map(rep => `
      <div style="background:#fff;border-radius:14px;padding:16px;border:1.5px solid #ede8f8;box-shadow:0 2px 8px rgba(0,0,0,0.03);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <h4 style="margin:0;font-size:14.5px;font-weight:800;color:#2d0c5a;">${rep.eventTitle}</h4>
          <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:50px;background:${rep.status === 'approved' ? '#d1e7dd' : '#fff3cd'};color:${rep.status === 'approved' ? '#155724' : '#856404'};text-transform:uppercase;">${rep.status}</span>
        </div>
        <div style="font-size:12px;color:#777;margin-bottom:8px;">
          👥 ${rep.attendanceCount} Attendees · 💰 ₹${(rep.budgetSpent || 0).toLocaleString('en-IN')} Spent · 📅 ${rep.conductedDate}
        </div>
        <p style="font-size:12.5px;color:#555;margin:0 0 6px;line-height:1.5;">${rep.summary}</p>
        ${rep.superAdminRemarks ? `<div style="background:#f4f0fa;padding:8px 12px;border-radius:8px;font-size:11.5px;color:#4a1c84;"><b>SuperAdmin Remarks:</b> ${rep.superAdminRemarks}</div>` : ''}
      </div>
    `).join('');
  }

  // ─── Requirement 9: Three-Month (Quarterly) Reports ────────────────────────
  const qForm = document.getElementById('quarterlyForm');
  if (qForm) {
    qForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const quarter = document.getElementById('qRepQuarter').value;
      const session = document.getElementById('qRepSession').value.trim();
      const eventsCount = parseInt(document.getElementById('qRepEvents').value) || 0;
      const footfall = parseInt(document.getElementById('qRepFootfall').value) || 0;
      const members = parseInt(document.getElementById('qRepMembers').value) || 0;
      const budget = parseFloat(document.getElementById('qRepBudget').value) || 0;
      const summary = document.getElementById('qRepSummary').value.trim();
      const achieve = document.getElementById('qRepAchievements').value.trim();
      const roadmap = document.getElementById('qRepRoadmap').value.trim();
      const btn = document.getElementById('btnSubmitQuarterly');

      UI.setButtonLoading(btn, true);
      setTimeout(() => {
        DB.quarterlyReports.insert({
          clubId: managedClub.id,
          quarter: quarter,
          academicYear: session,
          submittedBy: currentUser.id,
          submittedByName: `${currentUser.name} (Club Leader)`,
          eventsConducted: eventsCount,
          totalFootfall: footfall,
          newMembersJoined: members,
          budgetUtilized: budget,
          executiveSummary: summary,
          keyAchievements: achieve,
          planNextQuarter: roadmap
        });

        UI.setButtonLoading(btn, false);
        UI.showToast('Quarterly 3-Month Report submitted to SuperAdmin! 📅', 'success');
        qForm.reset();
        renderQuarterlyReportsArchive();
      }, 400);
    });
  }

  function renderQuarterlyReportsArchive() {
    const container = document.getElementById('quarterlyReportsArchive');
    if (!container) return;
    const list = DB.quarterlyReports.getByClub(managedClub.id);
    if (list.length === 0) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#888;background:#fafafa;border-radius:12px;">No quarterly reports filed yet.</div>';
      return;
    }
    container.innerHTML = list.map(q => `
      <div style="background:#fff;border-radius:14px;padding:18px;border:1.5px solid #ede8f8;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <h4 style="margin:0;font-size:15px;font-weight:800;color:#2d0c5a;">${q.quarter}</h4>
          <span style="font-size:11px;font-weight:700;padding:3px 8px;border-radius:50px;background:${q.status === 'approved' ? '#d1e7dd' : '#fff3cd'};color:${q.status === 'approved' ? '#155724' : '#856404'};text-transform:uppercase;">${q.status}</span>
        </div>
        <div style="font-size:12px;color:#777;margin-bottom:8px;">
          Session: ${q.academicYear} · 🎯 ${q.eventsConducted} Events · 👥 ${q.totalFootfall} Footfall · 💰 ₹${(q.budgetUtilized || 0).toLocaleString('en-IN')}
        </div>
        <p style="font-size:12.5px;color:#555;margin:0 0 6px;line-height:1.5;"><b>Summary:</b> ${q.executiveSummary}</p>
        <p style="font-size:12px;color:#666;margin:0;line-height:1.4;"><b>Achievements:</b> ${q.keyAchievements}</p>
        ${q.superAdminFeedback ? `<div style="background:#f4f0fa;padding:8px 12px;border-radius:8px;font-size:11.5px;color:#4a1c84;margin-top:8px;"><b>SuperAdmin Feedback:</b> ${q.superAdminFeedback}</div>` : ''}
      </div>
    `).join('');
  }

  // ─── Requirement 6: Leadership Hierarchy / Team Posts ─────────────────────
  const postForm = document.getElementById('teamPostForm');
  if (postForm) {
    postForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const select = document.getElementById('postTitle');
      const position = select.value;
      const order = parseInt(select.options[select.selectedIndex].dataset.order) || 10;
      const name = document.getElementById('postName').value.trim();
      const dept = document.getElementById('postDept').value.trim();
      const year = document.getElementById('postYear').value;
      const avatar = document.getElementById('postAvatar').value.trim();
      const bio = document.getElementById('postBio').value.trim();
      const linkedin = document.getElementById('postLinkedin').value.trim();
      const btn = document.getElementById('btnSubmitPost');

      UI.setButtonLoading(btn, true);
      setTimeout(() => {
        DB.clubHierarchy.insert({
          clubId: managedClub.id,
          position: position,
          order: order,
          name: name,
          department: dept,
          year: year,
          avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name.substring(0, 2))}&background=4a1c84&color=fff&bold=true`,
          bio: bio,
          linkedin: linkedin
        });

        UI.setButtonLoading(btn, false);
        UI.showToast(`Leadership position "${position}" assigned to ${name}! 👑`, 'success');
        postForm.reset();
        renderClubHierarchy();
      }, 350);
    });
  }

  function renderClubHierarchy() {
    const container = document.getElementById('clubHierarchyList');
    if (!container) return;
    const list = DB.clubHierarchy.getByClub(managedClub.id);
    if (list.length === 0) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:#888;background:#fafafa;border-radius:12px;">No leadership appointments added yet.</div>';
      return;
    }
    container.innerHTML = list.map(item => `
      <div style="background:#fff;border-radius:14px;padding:14px;border:1.5px solid #ede8f8;display:flex;align-items:center;gap:14px;">
        <img src="${item.avatar}" alt="${item.name}" style="width:48px;height:48px;border-radius:12px;object-fit:cover;border:2px solid #4a1c84;">
        <div style="flex:1;">
          <span style="background:#f4f0fa;color:#4a1c84;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:50px;text-transform:uppercase;">${item.position}</span>
          <h4 style="margin:2px 0;font-size:14px;font-weight:800;color:#2d0c5a;">${item.name}</h4>
          <div style="font-size:11.5px;color:#777;">${item.department} · ${item.year}</div>
        </div>
        <button onclick="removeHierarchyPost(${item.id})" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">Remove</button>
      </div>
    `).join('');
  }

  window.removeHierarchyPost = function (id) {
    DB.clubHierarchy.delete(id);
    UI.showToast('Position removed.', 'info');
    renderClubHierarchy();
  };

  // ─── Requirement 7: Review Join Requests with Reasons & Qualifications ─────
  function renderDetailedRequests() {
    const container = document.getElementById('requestsContainer');
    if (!container) return;
    const reqs = DB.joinRequests.query(r => r.clubId === managedClub.id && r.status === 'pending');

    if (reqs.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#888;background:#fff;border-radius:16px;border:1.5px solid #ede8f8;"><div style="font-size:2rem;margin-bottom:8px;">📬</div>No pending join applications right now.</div>';
      return;
    }

    container.innerHTML = reqs.map(r => {
      const student = DB.users.getById(r.studentId) || {};
      const studentName = r.studentName || student.name || 'Student';
      const studentRoll = r.rollNo || student.rollNo || 'N/A';
      const studentDept = r.department || student.department || 'Engineering';
      const studentYear = r.year || student.year || '';
      const avatar = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName.substring(0, 2))}&background=random&color=fff`;

      return `
        <div class="request-card" style="background:#fff;border-radius:18px;padding:22px;border:1.5px solid #ede8f8;box-shadow:0 4px 15px rgba(0,0,0,0.03);">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            <img src="${avatar}" class="req-avatar" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #4a1c84;">
            <div>
              <div style="font-weight:800;font-size:15px;color:#2d0c5a;">${studentName}</div>
              <div style="font-size:12px;color:#777;">${studentRoll} · ${studentDept} (${studentYear})</div>
            </div>
          </div>

          <div style="background:#fcfaff;border-left:3px solid #4a1c84;padding:10px 14px;border-radius:8px;margin-bottom:10px;">
            <div style="font-size:11px;font-weight:700;color:#4a1c84;text-transform:uppercase;margin-bottom:3px;">Reason to Join:</div>
            <div style="font-size:13px;color:#333;line-height:1.4;">"${r.reason || r.message || 'I would love to join!'}"</div>
          </div>

          ${r.skills ? `
            <div style="font-size:12px;color:#555;margin-bottom:6px;">
              <b>Skills / Experience:</b> ${r.skills}
            </div>` : ''}

          ${r.contributions ? `
            <div style="font-size:12px;color:#555;margin-bottom:12px;">
              <b>Planned Contribution:</b> ${r.contributions}
            </div>` : ''}

          <div style="display:flex;gap:10px;margin-top:14px;">
            <button onclick="respondDetailedRequest(${r.id}, 'approved')" style="flex:1;background:#d1e7dd;color:#155724;border:1px solid #28a745;padding:10px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;">✓ Approve Member</button>
            <button onclick="respondDetailedRequest(${r.id}, 'rejected')" style="flex:1;background:#f8d7da;color:#721c24;border:1px solid #dc3545;padding:10px;border-radius:10px;font-weight:800;font-size:12px;cursor:pointer;">✕ Decline</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.respondDetailedRequest = function (id, status) {
    const updated = DB.joinRequests.updateStatus(id, status);
    UI.showToast(status === 'approved' ? '✓ Student inducted into club!' : 'Application declined.', status === 'approved' ? 'success' : 'info');
    renderDetailedRequests();
    refreshBanner();
  };

  // ─── Members Roster ───────────────────────────────────────────────────────
  function renderMembers() {
    const container = document.getElementById('membersContainer');
    if (!container) return;
    const members = DB.users.getAll().filter(u => u.clubMemberships && u.clubMemberships.includes(managedClub.id));

    if (members.length === 0) {
      container.innerHTML = '<p style="color:#aaa;padding:20px;text-align:center;">No members yet.</p>';
      return;
    }

    container.innerHTML = members.map(m => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px;border-bottom:1px solid #f0f0f5;">
        <img src="${m.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
        <div style="flex:1;">
          <div style="font-weight:700;font-size:14px;color:#2d0c5a;">${m.name}</div>
          <div style="font-size:12px;color:#888;">${m.rollNo || ''} · ${m.department || 'Engineering'}</div>
        </div>
        <span style="background:#d1e7dd;color:#155724;font-size:11px;font-weight:700;padding:3px 10px;border-radius:50px;">Active Member</span>
      </div>
    `).join('');
  }

  // Default initial tab
  switchTab('manage');
});
