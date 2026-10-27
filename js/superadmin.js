// js/superadmin.js — Full SuperAdmin Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
  DB.seed();

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  const currentUser = Auth.requireRole('superadmin');
  if (!currentUser) return;

  document.getElementById('userName').textContent = currentUser.name;
  document.getElementById('userAvatar').src = currentUser.avatar;

  // ─── Tab System ──────────────────────────────────────────────────────────
  window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + tabName).style.display = 'block';
    const active = document.querySelector(`[data-tab="${tabName}"]`);
    if (active) active.classList.add('active');
    if (tabName === 'clubs')    renderClubsTable();
    if (tabName === 'users')    renderUsersTable();
    if (tabName === 'settings') renderSettings();
    if (tabName === 'overview') { renderActivityLog(); }
  };
  switchTab('overview');

  // ─── Live Stats ───────────────────────────────────────────────────────────
  function updateStats() {
    const clubs = DB.clubs.getAll();
    const totalMembers = clubs.reduce((s, c) => s + (c.members || 0), 0);
    const events = DB.events.getAll().length;
    const pending = DB.joinRequests.query(r => r.status === 'pending').length;
    UI.animateCount(document.getElementById('sc1'), clubs.length, 800);
    UI.animateCount(document.getElementById('sc2'), totalMembers, 800);
    UI.animateCount(document.getElementById('sc3'), events, 800);
    UI.animateCount(document.getElementById('sc4'), pending, 800);
  }
  updateStats();

  // ─── Activity Log ─────────────────────────────────────────────────────────
  function renderActivityLog() {
    const container = document.getElementById('activityLog');
    const clubs = DB.clubs.getAll().slice(-5).reverse();
    const events = DB.events.getAll().slice(-3).reverse();
    const reqs = DB.joinRequests.query(r => r.status === 'approved').slice(-3).reverse();
    const logs = [
      ...clubs.map(c => ({ icon: '🏛️', color: 'rgba(74,28,132,0.3)', text: `Club "<b>${c.name}</b>" was created`, time: c.createdAt })),
      ...events.map(e => ({ icon: '📅', color: 'rgba(17,160,150,0.3)', text: `Event "<b>${e.title}</b>" scheduled`, time: e.createdAt }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    if (logs.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:13px;">No activity yet.</p>';
      return;
    }
    container.innerHTML = logs.map(l => `
      <div class="log-item">
        <div class="log-icon" style="background:${l.color}">${l.icon}</div>
        <div>
          <div class="log-text">${l.text}</div>
          <div class="log-time">${UI.formatDateShort(l.time)}</div>
        </div>
      </div>
    `).join('');
  }

  // ─── Create Club ──────────────────────────────────────────────────────────
  document.getElementById('createClubForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const name = document.getElementById('newClubName').value.trim();
    const cat  = document.getElementById('newClubCat').value;
    const desc = document.getElementById('newClubDesc').value.trim();
    const btn  = document.getElementById('createClubBtn');

    let valid = true;
    ['newClubName', 'newClubCat', 'newClubDesc'].forEach(id => {
      const el = document.getElementById(id);
      if (!el.value.trim()) { el.style.borderColor = '#e74c3c'; valid = false; }
      else el.style.borderColor = '';
    });
    if (!valid) { UI.showToast('Please fill all fields.', 'error'); return; }

    UI.setButtonLoading(btn, true);
    setTimeout(() => {
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const colors = ['4a1c84','11a096','ff8c5f','e74c3c','27ae60','3498db','e84393','f39c12'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const newClub = DB.clubs.insert({
        name, category: cat, description: desc,
        logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&bold=true`,
        members: 0
      });
      UI.showToast(`Club "${newClub.name}" created successfully! 🎉`, 'success');
      this.reset();
      UI.setButtonLoading(btn, false);
      updateStats();
      renderActivityLog();
    }, 400);
  });

  // ─── Clubs Table ──────────────────────────────────────────────────────────
  let clubSearchQ = '', clubCatQ = '';

  function renderClubsTable() {
    let clubs = DB.clubs.getAll();
    if (clubCatQ) clubs = clubs.filter(c => c.category === clubCatQ);
    if (clubSearchQ) clubs = clubs.filter(c => c.name.toLowerCase().includes(clubSearchQ));
    clubs.sort((a, b) => a.name.localeCompare(b.name));

    document.getElementById('clubCountLabel').textContent = clubs.length;

    const tbody = document.getElementById('adminClubsTableBody');
    if (clubs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);">No clubs found.</td></tr>';
      return;
    }
    tbody.innerHTML = clubs.map(club => {
      const leader = club.leaderId ? DB.users.getById(club.leaderId) : null;
      const members = DB.users.getAll().filter(u => u.clubMemberships && u.clubMemberships.includes(club.id));
      const leaderOptions = [
        `<option value="">— Unassigned —</option>`,
        ...members.map(l => `<option value="${l.id}" ${club.leaderId === l.id ? 'selected' : ''}>${l.name}</option>`)
      ].join('');
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${club.logo}" class="club-table-logo" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(club.name.substring(0,2))}&background=4a1c84&color=fff'">
            <div>
              <div class="club-table-name">${club.name}</div>
              <div class="club-table-cat">${club.description.substring(0, 50)}...</div>
            </div>
          </div>
        </td>
        <td>${UI.badge(club.category, 'active')}</td>
        <td style="color:rgba(255,255,255,0.7);font-weight:600;">${club.members}</td>
        <td style="color:rgba(255,255,255,0.6);">${leader ? leader.name : '<span style="color:rgba(255,255,255,0.25);">Unassigned</span>'}</td>
        <td>
          <select class="s-select" style="min-width:160px;font-size:12px;" onchange="assignLeader(${club.id}, parseInt(this.value) || null)">
            ${leaderOptions}
          </select>
        </td>
        <td>
          <button onclick="deleteClub(${club.id}, '${club.name.replace(/'/g,"\\'")}') " class="btn-danger">Delete</button>
        </td>
      </tr>`;
    }).join('');
  }

  window.assignLeader = function(clubId, leaderId) {
    DB.clubs.update(clubId, { leaderId });
    const leader = leaderId ? DB.users.getById(leaderId) : null;
    const club = DB.clubs.getById(clubId);
    if (leader) {
      if (leader.role === 'student') DB.users.update(leaderId, { role: 'club-leader' });
      UI.showToast(`${leader.name} assigned as leader of ${club.name}`, 'success');
    } else {
      UI.showToast(`Leader removed from ${club.name}`, 'info');
    }
    renderClubsTable();
  };

  window.deleteClub = function(clubId, name) {
    UI.showConfirm('Delete Club', `Are you sure you want to delete "<b>${name}</b>"? This will also delete all its events, requests, and announcements.`, () => {
      DB.clubs.delete(clubId);
      UI.showToast(`Club "${name}" deleted.`, 'info');
      updateStats();
      renderClubsTable();
    });
  };

  document.getElementById('adminClubSearch').addEventListener('input', UI.debounce(function() {
    clubSearchQ = this.value.trim().toLowerCase();
    renderClubsTable();
  }, 250));
  document.getElementById('adminClubCat').addEventListener('change', function() {
    clubCatQ = this.value;
    renderClubsTable();
  });

  // ─── Users Table ──────────────────────────────────────────────────────────
  function renderUsersTable() {
    let users = DB.users.getAll();
    const q = (document.getElementById('userSearch').value || '').toLowerCase();
    if (q) users = users.filter(u => u.name.toLowerCase().includes(q) || u.email.includes(q));

    const tbody = document.getElementById('usersTableBody');
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:rgba(255,255,255,0.3);">No users found.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${u.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;" onerror="this.src='https://i.pravatar.cc/150'">
          <div style="font-weight:700;color:#fff;">${u.name}</div>
        </div>
      </td>
      <td style="color:rgba(255,255,255,0.5);font-size:13px;">${u.email}</td>
      <td>${UI.badge(u.role, u.role === 'superadmin' ? 'admin' : u.role === 'club-leader' ? 'leader' : 'student')}</td>
      <td style="color:rgba(255,255,255,0.5);">${(u.clubMemberships || []).length} clubs</td>
      <td>
        <select class="s-select" style="font-size:12px;" onchange="changeUserRole(${u.id}, this.value)" ${u.id === currentUser.id ? 'disabled' : ''}>
          <option value="student" ${u.role==='student'?'selected':''}>Student</option>
          <option value="club-leader" ${u.role==='club-leader'?'selected':''}>Club Leader</option>
          <option value="superadmin" ${u.role==='superadmin'?'selected':''}>SuperAdmin</option>
        </select>
      </td>
    </tr>`).join('');
  }

  window.changeUserRole = function(userId, newRole) {
    DB.users.update(userId, { role: newRole });
    const u = DB.users.getById(userId);
    UI.showToast(`${u.name}'s role changed to ${newRole}`, 'success');
    renderUsersTable();
  };

  document.getElementById('userSearch').addEventListener('input', UI.debounce(() => renderUsersTable(), 250));

  // ─── Settings ─────────────────────────────────────────────────────────────
  function renderSettings() {
    const s = DB.settings.get();
    document.getElementById('settingsContainer').innerHTML = `
      <div class="toggle-wrap">
        <div class="toggle-info">
          <h4>Allow Club Creation Requests</h4>
          <p>Let students submit club creation proposals.</p>
        </div>
        <label class="toggle">
          <input type="checkbox" id="togClubReq" ${s.allowClubCreation ? 'checked' : ''} onchange="saveSetting('allowClubCreation', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
      <div class="toggle-wrap">
        <div class="toggle-info">
          <h4>Maintenance Mode</h4>
          <p>Prevents student logins. Admin and leaders unaffected.</p>
        </div>
        <label class="toggle">
          <input type="checkbox" id="togMaintenance" ${s.maintenanceMode ? 'checked' : ''} onchange="saveSetting('maintenanceMode', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
      <div class="toggle-wrap">
        <div class="toggle-info">
          <h4>Public Club Directory</h4>
          <p>Show clubs on the landing page without login.</p>
        </div>
        <label class="toggle">
          <input type="checkbox" id="togPublic" ${s.publicDirectory !== false ? 'checked' : ''} onchange="saveSetting('publicDirectory', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
    `;

    // Storage usage
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('mits_')) total += localStorage[key].length;
    }
    document.getElementById('storageInfo').innerHTML = `
      <div style="font-size:13px;color:rgba(255,255,255,0.5);">localStorage used: <b style="color:#36c5bc;">${(total / 1024).toFixed(1)} KB</b></div>
      <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:8px;">Clubs: ${DB.clubs.getAll().length} · Events: ${DB.events.getAll().length} · Users: ${DB.users.getAll().length}</div>
    `;
  }

  window.saveSetting = function(key, value) {
    DB.settings.update({ [key]: value });
    const label = key === 'maintenanceMode' ? 'Maintenance Mode' : key === 'allowClubCreation' ? 'Club Requests' : 'Public Directory';
    UI.showToast(`${label} ${value ? 'enabled' : 'disabled'}.`, 'info');
  };

  window.resetData = function() {
    UI.showConfirm('Reset All Data', 'This will delete ALL changes and restore the original seed data. Are you absolutely sure?', () => {
      DB.reseed();
      UI.showToast('Data reset to seed state. Reloading...', 'warning', 2000);
      setTimeout(() => location.reload(), 1800);
    });
  };
});
