// js/common.js — Shared Render Functions & Modals (Upgraded with 9 new club features)

function renderClubs(containerId, clubsData, role = 'student', currentUserId = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!clubsData || clubsData.length === 0) {
    UI.showEmptyState(containerId, 'No clubs found matching criteria.', '🔭');
    return;
  }
  container.innerHTML = '';

  clubsData.forEach(club => {
    let userRequest = null;
    let isMember = false;
    if (currentUserId) {
      const user = API.users.getById(currentUserId);
      isMember = user && user.clubMemberships && user.clubMemberships.includes(club.id);
      if (!isMember) {
        userRequest = API.joinRequests.query(r => r.clubId === club.id && r.studentId === currentUserId && r.status === 'pending')[0] || null;
      }
    }

    const catColor = UI.categoryColor(club.category);
    let actionHTML = '';
    if (role === 'student') {
      if (isMember) {
        actionHTML = `<button disabled class="club-action-btn member-btn" style="background:#d1e7dd;color:#155724;border:1px solid #28a745;cursor:default;">✓ Member</button>`;
      } else if (userRequest) {
        actionHTML = `<button disabled class="club-action-btn pending-btn" style="background:#fff3cd;color:#856404;border:1px solid #ffc107;cursor:default;">⏳ Pending</button>`;
      } else {
        actionHTML = `<button onclick="requestJoin(${club.id})" class="club-action-btn join-btn" data-club-id="${club.id}">Join Club</button>`;
      }
    }

    // Get club hierarchy count
    const teamMembers = API.clubHierarchy ? API.clubHierarchy.getByClub(club.id) : [];
    const leaderName = teamMembers.length > 0 ? `${teamMembers[0].position}: ${teamMembers[0].name}` : 'Club Leadership';

    const card = document.createElement('div');
    card.className = 'club-card';
    card.setAttribute('data-aos', 'fade-up');
    card.style.cursor = 'pointer';
    card.onclick = (e) => {
      if (e.target.tagName === 'BUTTON') return;
      if (window.openClubDetails) window.openClubDetails(club);
    };
    card.innerHTML = `
      <div class="club-card-header" style="background:linear-gradient(135deg, ${catColor}22, ${catColor}44); pointer-events: none;">
        <img src="${club.logo}" alt="${club.name}" class="club-logo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(club.name.substring(0, 2))}&background=4a1c84&color=fff&bold=true'">
        <span class="club-category-badge" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}55;">${club.category}</span>
      </div>
      <div class="club-card-body" style="pointer-events: none;">
        <h3 class="club-card-title">${club.name}</h3>
        <p class="club-card-desc">${club.description}</p>
        <div style="font-size:11.5px;color:#7a349c;font-weight:700;margin-top:8px;">👥 ${leaderName}</div>
      </div>
      <div class="club-card-footer" style="padding: 0 20px 20px; display: flex; justify-content: space-between; align-items: center;">
        <span class="club-member-count">👥 ${(club.members || 0).toLocaleString('en-IN')} Members</span>
        ${actionHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderEvents(containerId, eventsData, role = 'student', currentUserId = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!eventsData || eventsData.length === 0) {
    UI.showEmptyState(containerId, 'No events scheduled.', '📅');
    return;
  }
  container.innerHTML = '';

  eventsData.forEach(event => {
    const club = API.clubs.getById(event.clubId);
    const clubName = club ? club.name : 'MITS Club';
    const dateStr = UI.formatDate(event.date);
    const isUpcoming = new Date(event.date) >= new Date();
    const hasRSVPed = currentUserId && event.rsvps && event.rsvps.includes(currentUserId);
    const rsvpCount = event.rsvps ? event.rsvps.length : 0;
    const capacity = event.capacity || 100;
    const venue = event.venue || 'MITS Campus';

    // Check if current user is registered for this event
    const allRegs = (API.eventRegistrations && API.eventRegistrations.getAll) ? API.eventRegistrations.getAll() : [];
    const currentUser = (typeof Auth !== 'undefined' && Auth.getCurrentUser) ? Auth.getCurrentUser() : null;
    const userReg = currentUserId ? allRegs.find(r =>
      r.eventId === event.id && (
        r.studentId === currentUserId ||
        (currentUser && currentUser.email && r.email && r.email.toLowerCase() === currentUser.email.toLowerCase())
      )
    ) : null;
    const isRegistered = !!userReg || hasRSVPed;

    // Check for linked Resource Person
    const experts = API.resourcePersons ? API.resourcePersons.getByEvent(event.id) : [];
    const expertText = experts.length > 0 ? `🎙️ Speaker: ${experts[0].name} (${experts[0].organization})` : '';

    const priceBadge = event.isPaid
      ? `<div style="position:absolute;bottom:12px;left:12px;background:rgba(255,255,255,0.95);color:#7a349c;font-size:11px;font-weight:900;padding:4px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">💰 ₹${event.price}</div>`
      : `<div style="position:absolute;bottom:12px;left:12px;background:rgba(255,255,255,0.95);color:#15803d;font-size:11px;font-weight:900;padding:4px 10px;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.15);">✨ Free Entry</div>`;

    let actionHTML = '';
    if (role === 'student') {
      if (isUpcoming) {
        if (isRegistered) {
          actionHTML = `
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:center;">
              <a href="event-register.html?id=${event.id}" class="event-action-btn" style="background:#15803d;color:#fff;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;padding:7px 14px;border-radius:8px;font-weight:700;font-size:12px;">🎟️ View My Pass</a>
              <span style="font-size:12px;color:#15803d;font-weight:700;">✓ Registered</span>
            </div>`;
        } else {
          actionHTML = `
            <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
              <a href="event-register.html?id=${event.id}" class="event-action-btn rsvp-btn" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">Register ${event.isPaid ? '· ₹' + event.price : '(Free)'}</a>
              <button onclick="rsvpEvent(${event.id})" class="event-action-btn" style="background:#f4f2fa;color:#4a1c84;border:1px solid #4a1c84;font-size:12px;padding:6px 12px;border-radius:8px;cursor:pointer;font-weight:700;">Quick RSVP</button>
            </div>`;
        }
      } else {
        actionHTML = `
          <div style="display:flex;gap:8px;margin-top:12px;align-items:center;">
            <span style="font-size:12px;color:#888;">🏁 Concluded</span>
            <a href="event-feedback.html?id=${event.id}" style="margin-left:auto;background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;text-decoration:none;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">★ Give Feedback</a>
          </div>`;
      }
    } else if (role === 'leader') {
      actionHTML = `
        <div style="display:flex;gap:8px;margin-top:12px;align-items:center;flex-wrap:wrap;">
          <span style="font-size:12px;color:#888;">👥 ${rsvpCount}/${capacity} registered</span>
          <button onclick="selectAttendanceEvent(${event.id});" style="background:#4a1c84;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Take Attendance</button>
          <button onclick="deleteEvent(${event.id})" style="margin-left:auto;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">Delete</button>
        </div>`;
    }

    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-aos', 'zoom-in');
    card.innerHTML = `
      <div class="event-card-img-wrap">
        <img src="${event.image}" alt="${event.title}" class="event-card-img" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'">
        <div class="event-club-badge">${clubName}</div>
        ${priceBadge}
        ${!isUpcoming ? '<div class="event-past-badge">Past Event</div>' : ''}
      </div>
      <div class="event-card-body">
        <h3 class="event-card-title">${event.title}</h3>
        <p class="event-card-date">📅 ${dateStr} · 📍 ${venue}</p>
        ${expertText ? `<p style="font-size:12px;font-weight:700;color:#4a1c84;margin:4px 0 8px;">${expertText}</p>` : ''}
        <p class="event-card-desc">${event.description}</p>
        ${actionHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

// ─── Requirement 7: Detailed Reason-based Join Request System ────────────────
async function requestJoin(clubId) {
  const user = Auth.getCurrentUser();
  if (!user) {
    UI.showToast('Please log in first to apply for club membership.', 'info');
    if (document.getElementById('loginModal')) document.getElementById('loginModal').classList.add('open');
    return;
  }

  const club = API.clubs.getById(clubId);
  if (!club) return;
  const dbUser = API.users.getById(user.id) || user;

  // Check existing membership or pending request
  if (dbUser.clubMemberships && dbUser.clubMemberships.includes(clubId)) {
    UI.showToast('You are already an active member of this club.', 'info');
    return;
  }
  const pending = API.joinRequests.query(r => r.clubId === clubId && r.studentId === user.id && r.status === 'pending')[0];
  if (pending) {
    UI.showToast('You already have a pending application under review for this club.', 'warning');
    return;
  }

  // Open detailed reason application modal
  let modal = document.getElementById('joinReasonModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'joinReasonModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:9500;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.25s ease;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:24px;padding:36px;max-width:540px;width:92%;max-height:90vh;overflow-y:auto;box-shadow:0 30px 90px rgba(0,0,0,0.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <h3 style="font-family:'Playfair Display',serif;font-size:1.6rem;font-weight:800;color:#2d0c5a;margin:0;">Club Membership Application</h3>
            <p id="jrmClubName" style="color:#7a349c;font-weight:700;font-size:13px;margin:4px 0 0;"></p>
          </div>
          <button id="jrmCloseBtn" style="background:#f0f0f5;border:none;width:34px;height:34px;border-radius:50%;font-size:16px;cursor:pointer;">✕</button>
        </div>

        <form id="jrmForm" style="display:flex;flex-direction:column;gap:14px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;">Full Name</label>
              <input type="text" id="jrmName" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;" required>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;">Roll Number</label>
              <input type="text" id="jrmRoll" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;" placeholder="0901CS..." required>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;">Department</label>
              <input type="text" id="jrmDept" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;" placeholder="e.g. CSE / IT / ME" required>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;">Academic Year</label>
              <select id="jrmYear" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;">
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year" selected>3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;">Why do you want to join this club? (Statement of Purpose) *</label>
            <textarea id="jrmReason" rows="3" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;font-family:inherit;" placeholder="Explain your interest, learning goals, or motivation..." required></textarea>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;">Relevant Skills & Past Experience</label>
            <textarea id="jrmSkills" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;font-family:inherit;" placeholder="Tools, technologies, creative skills, or events organized..."></textarea>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:700;color:#555;margin-bottom:4px;">What can you contribute to this club?</label>
            <textarea id="jrmContrib" rows="2" style="width:100%;padding:10px 14px;border:1.5px solid #ddd;border-radius:10px;font-size:13px;font-family:inherit;" placeholder="Event coordination, technical projects, content writing, design, PR..."></textarea>
          </div>

          <button type="submit" id="jrmSubmitBtn" style="padding:14px;background:linear-gradient(135deg,#4a1c84,#7a349c);color:#fff;border:none;border-radius:12px;font-weight:800;cursor:pointer;margin-top:6px;font-size:14px;">Submit Membership Application →</button>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#jrmCloseBtn').onclick = () => modal.remove();
  }

  document.getElementById('jrmClubName').textContent = `Target Club: ${club.name} (${club.category})`;
  document.getElementById('jrmName').value = dbUser.name || '';
  document.getElementById('jrmRoll').value = dbUser.rollNo || '';
  document.getElementById('jrmDept').value = dbUser.department || '';
  if (dbUser.year) document.getElementById('jrmYear').value = dbUser.year;

  modal.querySelector('#jrmForm').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('jrmName').value.trim();
    const roll = document.getElementById('jrmRoll').value.trim();
    const dept = document.getElementById('jrmDept').value.trim();
    const year = document.getElementById('jrmYear').value;
    const reason = document.getElementById('jrmReason').value.trim();
    const skills = document.getElementById('jrmSkills').value.trim();
    const contrib = document.getElementById('jrmContrib').value.trim();
    const btn = document.getElementById('jrmSubmitBtn');

    UI.setButtonLoading(btn, true);

    const newReq = await API.joinRequests.insert({
      clubId: club.id,
      studentId: user.id,
      studentName: name,
      studentEmail: user.email,
      rollNo: roll,
      department: dept,
      year: year,
      reason: reason,
      skills: skills,
      contributions: contrib
    });

    UI.setButtonLoading(btn, false);
    modal.remove();

    if (!newReq) {
      UI.showToast('You already have a pending request for this club.', 'warning');
      return;
    }

    // Update button on page
    const b = document.querySelector(`[data-club-id="${club.id}"]`);
    if (b) {
      b.textContent = '⏳ Pending';
      b.disabled = true;
      b.className = 'club-action-btn pending-btn';
      b.style.cssText = 'background:#fff3cd;color:#856404;border:1px solid #ffc107;cursor:default;';
    }

    UI.showToast('Application submitted! Club coordinators will review your reasons and skills.', 'success');
  };
}

async function rsvpEvent(eventId) {
  const user = Auth.getCurrentUser();
  if (!user) { UI.showToast('Please log in first.', 'error'); return; }

  const success = await API.events.rsvp(eventId, user.id);
  if (success) {
    UI.showToast('RSVP confirmed! See you there 🎉', 'success');
    if (typeof refreshEvents === 'function') refreshEvents();
  } else {
    UI.showToast('You have already RSVPed for this event.', 'info');
  }
}

async function unrsvpEvent(eventId) {
  const user = Auth.getCurrentUser();
  if (!user) return;
  await API.events.unrsvp(eventId, user.id);
  UI.showToast('RSVP cancelled.', 'info');
  if (typeof refreshEvents === 'function') refreshEvents();
}

async function deleteEvent(eventId) {
  UI.showConfirm('Delete Event', 'Are you sure you want to delete this event? This cannot be undone.', async () => {
    await API.events.delete(eventId);
    UI.showToast('Event deleted.', 'info');
    if (typeof refreshLeaderEvents === 'function') refreshLeaderEvents();
  });
}

// ─── Requirement 6, 4, 5: Upgraded Club Details Modal with Team Hierarchy, Experts & Gallery ───
window.openClubDetails = function (club) {
  let modal = document.getElementById('clubDetailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'club-details-overlay';
    modal.id = 'clubDetailsModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:9000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.25s ease;';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:28px;max-width:850px;width:92%;max-height:92vh;overflow-y:auto;box-shadow:0 30px 90px rgba(0,0,0,0.3);position:relative;display:flex;flex-direction:column;">
        <button id="closeClubModalBtn" style="position:absolute;top:20px;right:20px;background:#f0f0f5;border:none;width:38px;height:38px;border-radius:50%;font-size:18px;font-weight:bold;cursor:pointer;z-index:10;">✕</button>

        <!-- Banner -->
        <div style="background:linear-gradient(135deg,#2d0c5a,#4a1c84);padding:36px;color:#fff;border-radius:28px 28px 0 0;display:flex;align-items:center;gap:24px;position:relative;overflow:hidden;">
          <img id="cdModalLogo" src="" alt="Club Logo" style="width:84px;height:84px;border-radius:20px;object-fit:cover;border:3px solid rgba(255,255,255,0.4);background:#fff;">
          <div style="flex:1;">
            <span id="cdModalCat" style="background:#36c5bc;color:#0f3d39;padding:4px 12px;border-radius:50px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">Category</span>
            <h2 id="cdModalName" style="font-family:'Playfair Display',serif;font-size:1.8rem;margin:6px 0 4px;font-weight:800;">Club Name</h2>
            <p id="cdModalMeta" style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);">0 Members · Established MITS</p>
          </div>
          <button id="cdModalJoinBtn" style="background:#fff;color:#4a1c84;border:none;padding:12px 24px;border-radius:50px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,0.2);">Apply to Join →</button>
        </div>

        <!-- Navigation Tabs inside Club Details -->
        <div style="display:flex;border-bottom:1.5px solid #eee;padding:0 36px;background:#fafafa;">
          <button class="cd-tab-btn active" data-cd-tab="overview" onclick="switchClubModalTab('overview')" style="padding:14px 18px;border:none;background:none;font-weight:700;font-size:13px;color:#4a1c84;border-bottom:3px solid #4a1c84;cursor:pointer;">Overview</button>
          <button class="cd-tab-btn" data-cd-tab="hierarchy" onclick="switchClubModalTab('hierarchy')" style="padding:14px 18px;border:none;background:none;font-weight:600;font-size:13px;color:#777;border-bottom:3px solid transparent;cursor:pointer;">👑 Student Leadership Team</button>
          <button class="cd-tab-btn" data-cd-tab="experts" onclick="switchClubModalTab('experts')" style="padding:14px 18px;border:none;background:none;font-weight:600;font-size:13px;color:#777;border-bottom:3px solid transparent;cursor:pointer;">🎙️ Resource Persons & Experts</button>
          <button class="cd-tab-btn" data-cd-tab="gallery" onclick="switchClubModalTab('gallery')" style="padding:14px 18px;border:none;background:none;font-weight:600;font-size:13px;color:#777;border-bottom:3px solid transparent;cursor:pointer;">📸 Event Glimpses</button>
        </div>

        <!-- Tab Contents -->
        <div style="padding:32px 36px;flex:1;">
          <!-- Tab 1: Overview -->
          <div id="cdTab-overview" class="cd-tab-content">
            <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:800;color:#2d0c5a;margin:0 0 10px;">About the Club</h3>
            <p id="cdModalDesc" style="color:#555;font-size:14.5px;line-height:1.7;margin:0 0 24px;"></p>
            
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
              <div style="background:#f9f8fc;border:1.5px solid #ede8f8;border-radius:16px;padding:18px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:800;color:#4a1c84;" id="cdStatMembers">0</div>
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;margin-top:4px;">Active Members</div>
              </div>
              <div style="background:#f9f8fc;border:1.5px solid #ede8f8;border-radius:16px;padding:18px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:800;color:#11a096;" id="cdStatEvents">0</div>
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;margin-top:4px;">Events Conducted</div>
              </div>
              <div style="background:#f9f8fc;border:1.5px solid #ede8f8;border-radius:16px;padding:18px;text-align:center;">
                <div style="font-size:1.8rem;font-weight:800;color:#ff8c5f;" id="cdStatBudget">₹0</div>
                <div style="font-size:11px;font-weight:700;color:#888;text-transform:uppercase;margin-top:4px;">Annual Grant</div>
              </div>
            </div>
          </div>

          <!-- Tab 2: Leadership Hierarchy (Requirement 6) -->
          <div id="cdTab-hierarchy" class="cd-tab-content" style="display:none;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
              <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:800;color:#2d0c5a;margin:0;">Club Executive Board</h3>
              <span style="font-size:12px;color:#888;">Hierarchical Order: President → VP → Secretary → Core</span>
            </div>
            <div id="cdHierarchyGrid" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
              <!-- Hierarchy cards rendered here -->
            </div>
          </div>

          <!-- Tab 3: Resource Persons (Requirement 4) -->
          <div id="cdTab-experts" class="cd-tab-content" style="display:none;">
            <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:800;color:#2d0c5a;margin:0 0 16px;">Invited Experts & Keynote Speakers</h3>
            <div id="cdExpertsGrid" style="display:grid;grid-template-columns:1fr;gap:14px;">
              <!-- Experts rendered here -->
            </div>
          </div>

          <!-- Tab 4: Event Glimpses & Gallery (Requirement 5) -->
          <div id="cdTab-gallery" class="cd-tab-content" style="display:none;">
            <h3 style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:800;color:#2d0c5a;margin:0 0 16px;">Moments & Glimpses from Past Events</h3>
            <div id="cdGalleryGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));gap:16px;">
              <!-- Photos rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#closeClubModalBtn').onclick = () => modal.remove();
  }

  // Populate Details
  document.getElementById('cdModalName').textContent = club.name;
  document.getElementById('cdModalCat').textContent = club.category;
  document.getElementById('cdModalDesc').textContent = club.description;
  document.getElementById('cdModalLogo').src = club.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name.substring(0, 2))}&background=4a1c84&color=fff&bold=true`;
  document.getElementById('cdModalMeta').textContent = `${(club.members || 0).toLocaleString('en-IN')} Members · Active since ${club.createdAt || '2023'}`;

  const eventsCount = API.events.query(e => e.clubId === club.id).length;
  document.getElementById('cdStatMembers').textContent = (club.members || 0).toLocaleString('en-IN');
  document.getElementById('cdStatEvents').textContent = eventsCount;
  document.getElementById('cdStatBudget').textContent = `₹${(club.budget || 35000).toLocaleString('en-IN')}`;

  // Join button hook
  const joinBtn = document.getElementById('cdModalJoinBtn');
  joinBtn.onclick = () => {
    modal.remove();
    requestJoin(club.id);
  };

  // Populate Hierarchy (Requirement 6)
  const hierarchy = API.clubHierarchy ? API.clubHierarchy.getByClub(club.id) : [];
  const hGrid = document.getElementById('cdHierarchyGrid');
  if (hierarchy.length === 0) {
    hGrid.innerHTML = `
      <div style="grid-column:1/-1;padding:30px;text-align:center;color:#888;background:#fafafa;border-radius:16px;">
        <div style="font-size:2rem;margin-bottom:8px;">👥</div>
        Core leadership team positions being updated for this academic session.
      </div>`;
  } else {
    hGrid.innerHTML = hierarchy.map(person => {
      const isPresident = person.position.toLowerCase().includes('president') && !person.position.toLowerCase().includes('vice');
      return `
        <div style="background:#fff;border-radius:16px;padding:18px;border:1.5px solid ${isPresident ? '#4a1c84' : '#ede8f8'};box-shadow:0 4px 15px rgba(0,0,0,0.04);display:flex;gap:14px;align-items:flex-start;">
          <img src="${person.avatar}" alt="${person.name}" style="width:56px;height:56px;border-radius:14px;object-fit:cover;border:2px solid #4a1c84;">
          <div style="flex:1;">
            <span style="background:${isPresident ? '#4a1c84' : '#f0ebf8'};color:${isPresident ? '#fff' : '#4a1c84'};font-size:11px;font-weight:800;padding:3px 10px;border-radius:50px;text-transform:uppercase;">${person.position}</span>
            <h4 style="margin:6px 0 2px;font-size:15px;font-weight:800;color:#2d0c5a;">${person.name}</h4>
            <p style="margin:0;font-size:12px;color:#777;">${person.department || 'Engineering'} · ${person.year || ''}</p>
            ${person.bio ? `<p style="margin:6px 0 0;font-size:12px;color:#555;line-height:1.4;">${person.bio}</p>` : ''}
            ${person.linkedin ? `<a href="${person.linkedin}" target="_blank" style="display:inline-block;margin-top:6px;font-size:11.5px;color:#0077b5;text-decoration:none;font-weight:700;">LinkedIn Profile ↗</a>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Populate Resource Persons / Experts (Requirement 4)
  const experts = API.resourcePersons ? (API.resourcePersons.getByClub(club.id).concat(
    API.events.query(e => e.clubId === club.id).flatMap(e => API.resourcePersons.getByEvent(e.id))
  )) : [];
  // Deduplicate by ID
  const uniqueExperts = Array.from(new Map(experts.map(e => [e.id, e])).values());

  const expGrid = document.getElementById('cdExpertsGrid');
  if (uniqueExperts.length === 0) {
    expGrid.innerHTML = `
      <div style="padding:30px;text-align:center;color:#888;background:#fafafa;border-radius:16px;">
        <div style="font-size:2rem;margin-bottom:8px;">🎙️</div>
        No guest experts or resource persons recorded for this club yet.
      </div>`;
  } else {
    expGrid.innerHTML = uniqueExperts.map(exp => `
      <div style="background:#fff;border-radius:16px;padding:20px;border:1.5px solid #ede8f8;display:flex;gap:18px;align-items:center;">
        <img src="${exp.avatar}" alt="${exp.name}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid #36c5bc;">
        <div style="flex:1;">
          <h4 style="margin:0 0 2px;font-size:15px;font-weight:800;color:#2d0c5a;">${exp.name}</h4>
          <div style="font-size:13px;font-weight:600;color:#4a1c84;">${exp.title}</div>
          <div style="font-size:12px;color:#666;margin-bottom:6px;">${exp.organization}</div>
          ${exp.bio ? `<p style="margin:0;font-size:12.5px;color:#555;line-height:1.4;">${exp.bio}</p>` : ''}
          ${exp.expertise ? `<div style="font-size:11px;color:#888;margin-top:4px;"><b>Areas of Focus:</b> ${exp.expertise}</div>` : ''}
        </div>
      </div>
    `).join('');
  }

  // Populate Event Gallery / Glimpses (Requirement 5)
  const gallery = API.eventGallery ? API.eventGallery.getByClub(club.id) : [];
  const gGrid = document.getElementById('cdGalleryGrid');
  if (gallery.length === 0) {
    gGrid.innerHTML = `
      <div style="grid-column:1/-1;padding:30px;text-align:center;color:#888;background:#fafafa;border-radius:16px;">
        <div style="font-size:2rem;margin-bottom:8px;">📸</div>
        Event photographs and glimpses will be uploaded here following upcoming sessions.
      </div>`;
  } else {
    gGrid.innerHTML = gallery.map(item => `
      <div style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #ede8f8;box-shadow:0 4px 15px rgba(0,0,0,0.04);">
        <img src="${item.imageUrl}" alt="Event Glimpse" style="width:100%;height:150px;object-fit:cover;">
        <div style="padding:12px;">
          ${item.tag ? `<span style="background:#eef2ff;color:#4338ca;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:4px;display:inline-block;margin-bottom:6px;">${item.tag}</span>` : ''}
          <p style="margin:0;font-size:12px;color:#555;line-height:1.4;">${item.caption}</p>
        </div>
      </div>
    `).join('');
  }

  window.switchClubModalTab = function (tabName) {
    document.querySelectorAll('.cd-tab-btn').forEach(btn => {
      btn.style.color = '#777';
      btn.style.borderBottomColor = 'transparent';
      btn.classList.remove('active');
    });
    document.querySelectorAll('.cd-tab-content').forEach(c => c.style.display = 'none');

    const activeBtn = document.querySelector(`.cd-tab-btn[data-cd-tab="${tabName}"]`);
    if (activeBtn) {
      activeBtn.style.color = '#4a1c84';
      activeBtn.style.borderBottomColor = '#4a1c84';
      activeBtn.classList.add('active');
    }
    const activeContent = document.getElementById(`cdTab-${tabName}`);
    if (activeContent) activeContent.style.display = 'block';
  };

  switchClubModalTab('overview');
  document.body.appendChild(modal);
};

window.renderClubs = renderClubs;
window.renderEvents = renderEvents;
window.requestJoin = requestJoin;
window.rsvpEvent = rsvpEvent;
window.unrsvpEvent = unrsvpEvent;
window.deleteEvent = deleteEvent;
