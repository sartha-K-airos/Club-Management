// js/common.js — Shared render functions (upgraded)

function renderClubs(containerId, clubsData, role = 'student', currentUserId = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!clubsData || clubsData.length === 0) {
    UI.showEmptyState(containerId, 'No clubs found.', '🔭');
    return;
  }
  container.innerHTML = '';

  clubsData.forEach(club => {
    let userRequest = null;
    let isMember = false;
    if (currentUserId) {
      const user = DB.users.getById(currentUserId);
      isMember = user && user.clubMemberships.includes(club.id);
      if (!isMember) {
        userRequest = DB.joinRequests.query(r => r.clubId === club.id && r.studentId === currentUserId && r.status === 'pending')[0] || null;
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

    const card = document.createElement('div');
    card.className = 'club-card';
    card.setAttribute('data-aos', 'fade-up');
    card.style.cursor = 'pointer';
    card.onclick = (e) => {
      // Don't open modal if clicking a button
      if (e.target.tagName === 'BUTTON') return;
      if (window.openClubDetails) window.openClubDetails(club);
    };
    card.innerHTML = `
      <div class="club-card-header" style="background:linear-gradient(135deg, ${catColor}22, ${catColor}44); pointer-events: none;">
        <img src="${club.logo}" alt="${club.name}" class="club-logo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(club.name.substring(0,2))}&background=4a1c84&color=fff&bold=true'">
        <span class="club-category-badge" style="background:${catColor}22;color:${catColor};border:1px solid ${catColor}55;">${club.category}</span>
      </div>
      <div class="club-card-body" style="pointer-events: none;">
        <h3 class="club-card-title">${club.name}</h3>
        <p class="club-card-desc">${club.description}</p>
      </div>
      <div class="club-card-footer" style="padding: 0 20px 20px; display: flex; justify-content: space-between; align-items: center;">
        <span class="club-member-count">👥 ${club.members.toLocaleString('en-IN')} Members</span>
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
    UI.showEmptyState(containerId, 'No upcoming events.', '📅');
    return;
  }
  container.innerHTML = '';

  eventsData.forEach(event => {
    const club = DB.clubs.getById(event.clubId);
    const clubName = club ? club.name : 'Unknown Club';
    const dateStr = UI.formatDate(event.date);
    const isUpcoming = new Date(event.date) >= new Date();
    const hasRSVPed = currentUserId && event.rsvps && event.rsvps.includes(currentUserId);
    const rsvpCount = event.rsvps ? event.rsvps.length : 0;

    let actionHTML = '';
    if (role === 'student') {
      if (hasRSVPed) {
        actionHTML = `<button onclick="unrsvpEvent(${event.id})" class="event-action-btn rsvped-btn">✓ RSVPed (${rsvpCount}) — Cancel</button>`;
      } else if (isUpcoming) {
        actionHTML = `<button onclick="rsvpEvent(${event.id})" class="event-action-btn rsvp-btn">RSVP Now · ${rsvpCount} going</button>`;
      }
    } else if (role === 'leader') {
      actionHTML = `
        <div style="display:flex;gap:8px;margin-top:12px;">
          <span style="font-size:12px;color:#888;">👥 ${rsvpCount} RSVPs</span>
          <button onclick="deleteEvent(${event.id})" class="event-action-btn delete-btn" style="margin-left:auto;background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;padding:6px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">Delete</button>
        </div>`;
    }

    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-aos', 'zoom-in');
    card.innerHTML = `
      <div class="event-card-img-wrap">
        <img src="${event.image}" alt="${event.title}" class="event-card-img" onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80'">
        <div class="event-club-badge">${clubName}</div>
        ${!isUpcoming ? '<div class="event-past-badge">Past Event</div>' : ''}
      </div>
      <div class="event-card-body">
        <h3 class="event-card-title">${event.title}</h3>
        <p class="event-card-date">📅 ${dateStr}</p>
        <p class="event-card-desc">${event.description}</p>
        ${actionHTML}
      </div>
    `;
    container.appendChild(card);
  });
}

function requestJoin(clubId) {
  const user = Auth.getCurrentUser();
  if (!user) { UI.showToast('Please log in first.', 'error'); return; }

  const req = DB.joinRequests.insert({ clubId, studentId: user.id, message: 'I would love to join this club!' });
  if (!req) {
    UI.showToast('You already have a pending request for this club.', 'warning');
    return;
  }

  // Update UI immediately
  const btn = document.querySelector(`[data-club-id="${clubId}"]`);
  if (btn) {
    btn.textContent = '⏳ Pending';
    btn.disabled = true;
    btn.className = 'club-action-btn pending-btn';
    btn.style.cssText = 'background:#fff3cd;color:#856404;border:1px solid #ffc107;cursor:default;';
  }
  UI.showToast('Join request sent! The club leader will review it.', 'success');
}

function rsvpEvent(eventId) {
  const user = Auth.getCurrentUser();
  if (!user) { UI.showToast('Please log in first.', 'error'); return; }

  const success = DB.events.rsvp(eventId, user.id);
  if (success) {
    UI.showToast('RSVP confirmed! See you there 🎉', 'success');
    // Refresh events section
    if (typeof refreshEvents === 'function') refreshEvents();
  } else {
    UI.showToast('You have already RSVPed for this event.', 'info');
  }
}

function unrsvpEvent(eventId) {
  const user = Auth.getCurrentUser();
  if (!user) return;
  DB.events.unrsvp(eventId, user.id);
  UI.showToast('RSVP cancelled.', 'info');
  if (typeof refreshEvents === 'function') refreshEvents();
}

function deleteEvent(eventId) {
  UI.showConfirm('Delete Event', 'Are you sure you want to delete this event? This cannot be undone.', () => {
    DB.events.delete(eventId);
    UI.showToast('Event deleted.', 'info');
    if (typeof refreshLeaderEvents === 'function') refreshLeaderEvents();
  });
}

window.renderClubs = renderClubs;
window.renderEvents = renderEvents;
window.requestJoin = requestJoin;
window.rsvpEvent = rsvpEvent;
window.unrsvpEvent = unrsvpEvent;
window.deleteEvent = deleteEvent;

window.openProfileModal = function() {
  const user = Auth.getCurrentUser();
  if (!user) return;
  const dbUser = DB.users.getById(user.id);
  
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:9000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:24px;padding:36px;max-width:420px;width:90%;box-shadow:0 25px 80px rgba(0,0,0,0.25);">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h3 style="font-size:1.4rem;font-weight:800;color:#2d0c5a;margin:0;font-family:'Playfair Display',serif;">Edit Profile</h3>
        <button id="closeProfileBtn" style="background:none;border:none;font-size:1.2rem;cursor:pointer;">✕</button>
      </div>
      <form id="profileForm" style="display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;align-items:center;gap:16px;">
          <img id="profilePreview" src="${dbUser.avatar}" onerror="this.src='https://i.pravatar.cc/150'" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">
          <div style="flex:1;">
            <label style="font-size:12px;font-weight:700;color:#555;">Upload Photo (Or keep existing)</label>
            <input type="file" id="profileImageUpload" accept="image/*" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:8px;font-family:Inter;font-size:13px;margin-bottom:6px;">
            <input type="hidden" id="profileAvatar" value="${dbUser.avatar}">
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#555;">Full Name</label>
          <input type="text" id="profileName" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:Inter;" value="${dbUser.name}" required>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:#555;">Phone Number</label>
          <input type="tel" id="profilePhone" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;font-family:Inter;" value="${dbUser.phone || ''}">
        </div>
        <button type="submit" style="padding:12px;background:linear-gradient(135deg,#4a1c84,#7a349c);color:#fff;border:none;border-radius:12px;font-weight:700;cursor:pointer;margin-top:10px;font-family:Inter;">Save Changes</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('#closeProfileBtn').onclick = close;
  
  overlay.querySelector('#profileImageUpload').onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        overlay.querySelector('#profilePreview').src = ev.target.result;
        overlay.querySelector('#profileAvatar').value = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  overlay.querySelector('#profileForm').onsubmit = (e) => {
    e.preventDefault();
    const newName = overlay.querySelector('#profileName').value.trim();
    const newAvatar = overlay.querySelector('#profileAvatar').value.trim();
    const newPhone = overlay.querySelector('#profilePhone').value.trim();
    
    DB.users.update(dbUser.id, { name: newName, avatar: newAvatar, phone: newPhone });
    
    const session = JSON.parse(sessionStorage.getItem('mits_session'));
    session.name = newName;
    session.avatar = newAvatar;
    sessionStorage.setItem('mits_session', JSON.stringify(session));
    
    const nameEl = document.getElementById('userName');
    const avEl = document.getElementById('userAvatar');
    if (nameEl) nameEl.textContent = newName;
    if (avEl) avEl.src = newAvatar;
    
    UI.showToast('Profile updated successfully!', 'success');
    close();
  };
};

document.addEventListener('DOMContentLoaded', () => {
  const userChip = document.querySelector('.user-chip');
  if (userChip && Auth.getCurrentUser()) {
    userChip.style.cursor = 'pointer';
    userChip.addEventListener('click', window.openProfileModal);
  }
});

window.openClubDetails = function(club) {
  let modal = document.getElementById('clubDetailsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'club-details-overlay';
    modal.id = 'clubDetailsModal';
    modal.innerHTML = `
        <div class="club-details-container">
            <button class="club-details-close" onclick="document.getElementById('clubDetailsModal').classList.remove('open')">✕</button>
            <div class="club-details-left" id="cdLeftBg"></div>
            <div class="club-details-right">
                <div class="club-details-bg-text" id="cdBgText">SALES</div>
                <div class="club-details-circle"></div>
                <div class="club-details-circle-bottom"></div>
                <h3 style="font-family:'Inter',sans-serif;font-weight:800;font-size:1.8rem;margin-bottom:24px;">Season Collection</h3>
                <h2 class="club-details-name" id="cdName">Club Name</h2>
                <p class="club-details-desc" id="cdDesc">Club description goes here...</p>
                <div>
                    <button class="btn-hero-primary" style="background:#111;color:#fff;padding:12px 32px;border:none;border-radius:50px;font-weight:800;cursor:pointer;" onclick="document.getElementById('clubDetailsModal').classList.remove('open'); if(document.getElementById('loginModal')) document.getElementById('loginModal').classList.add('open');">Join Club →</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('cdName').textContent = club.name;
  document.getElementById('cdDesc').textContent = club.description;
  document.getElementById('cdBgText').textContent = club.category.toUpperCase();
  document.getElementById('cdLeftBg').style.backgroundImage = `url(${club.logo || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80'})`;
  modal.classList.add('open');
};
