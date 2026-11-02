// scripts/apply-fixes.js — High-performance patches for fast login/logout, logo uploads, and dummy data cleanup
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

function patchFile(relPath, fn) {
  const filePath = path.join(rootDir, relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${relPath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  const isCRLF = content.includes('\r\n');
  const normalized = content.replace(/\r\n/g, '\n');
  const updated = fn(normalized);
  if (updated === normalized) {
    console.log(`No changes made to ${relPath}`);
    return;
  }
  const finalContent = isCRLF ? updated.replace(/\n/g, '\r\n') : updated;
  fs.writeFileSync(filePath, finalContent, 'utf8');
  console.log(`✅ Successfully patched ${relPath}`);
}

// 1. Patch student.html
patchFile('student.html', (content) => {
  let res = content;
  // Replace hardcoded Priya Sharma in header chip
  res = res.replace(
    /<span id="userName" class="user-name">Priya Sharma<\/span>/g,
    '<span id="userName" class="user-name">Student</span>'
  );
  // Replace hardcoded avatar
  res = res.replace(
    /src="https:\/\/images\.unsplash\.com\/photo-1494790108377-be9c29b29330\?w=150"/g,
    'src="https://ui-avatars.com/api/?name=Student&background=4a1c84&color=fff"'
  );
  // Replace welcome banner
  res = res.replace(
    /<h1>Welcome back, <span id="welcomeName">Priya<\/span>! 👋<\/h1>/g,
    '<h1>Welcome back, <span id="welcomeName">Student</span>! 👋</h1>'
  );
  // Insert immediate synchronous hydration script after welcome banner if not present
  if (!res.includes('mits_session_hydration_student')) {
    const target = '</div>\n        </div>\n\n        <!-- Quick Actions';
    const script = `</div>
        </div>

        <script id="mits_session_hydration_student">
          (function() {
            try {
              var s = JSON.parse(sessionStorage.getItem('mits_session'));
              if (s && s.name) {
                var un = document.getElementById('userName');
                var wn = document.getElementById('welcomeName');
                var ua = document.getElementById('userAvatar');
                if (un) un.textContent = s.name;
                if (wn) wn.textContent = s.name.split(' ')[0];
                if (ua) {
                  ua.src = s.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=4a1c84&color=fff');
                }
              }
            } catch(e) {}
          })();
        </script>

        <!-- Quick Actions`;
    res = res.replace(target, script);
  }
  return res;
});

// 2. Patch js/student.js
patchFile('js/student.js', (content) => {
  let res = content;
  // Change await API.init() to instant header render and API.ready()
  const oldTop = `document.addEventListener('DOMContentLoaded', async () => {
  await API.init();

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  const currentUser = Auth.requireRole('student');
  if (!currentUser) return;

  // Get full user from API for fresh data
  let user = API.users.getById(currentUser.id);

  // ─── Header ──────────────────────────────────────────────────────────────
  document.getElementById('userName').textContent = user.name;
  document.getElementById('welcomeName').textContent = user.name.split(' ')[0];
  document.getElementById('userAvatar').src = user.avatar;
  document.getElementById('todayDate').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });`;

  const newTop = `document.addEventListener('DOMContentLoaded', async () => {
  // ─── Auth Guard (synchronous, 0ms redirect if unauthorized) ───────────────
  const currentUser = Auth.requireRole('student');
  if (!currentUser) return;

  // Render header immediately from session storage (0ms instant display)
  const userEl = document.getElementById('userName');
  const welcomeEl = document.getElementById('welcomeName');
  const avatarEl = document.getElementById('userAvatar');
  const dateEl = document.getElementById('todayDate');
  if (userEl) userEl.textContent = currentUser.name;
  if (welcomeEl) welcomeEl.textContent = currentUser.name.split(' ')[0];
  if (avatarEl) avatarEl.src = currentUser.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=4a1c84&color=fff');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // Await cache ready (resolves in 0ms from sessionStorage fast cache)
  await API.ready();

  let user = API.users.getById(currentUser.id) || currentUser;`;

  res = res.replace(oldTop, newTop);

  // Fallback for refreshUser
  res = res.replace(
    /function refreshUser\(\) \{ user = API\.users\.getById\(currentUser\.id\); \}/g,
    'function refreshUser() { user = API.users.getById(currentUser.id) || currentUser; }'
  );

  // Fix club.logo -> club.icon || club.logo || fallback in myClubs
  res = res.replace(
    /<img src="\${club\.logo}" class="my-club-logo" alt="\${club\.name}" onerror="this\.src='https:\/\/ui-avatars\.com\/api\/\?name=\${encodeURIComponent\(club\.name\.substring\(0, 2\)\)}&background=4a1c84&color=fff'">/g,
    `<img src="\${club.icon || club.logo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent((club.name || 'CL').substring(0, 2)) + '&background=4a1c84&color=fff')}" class="my-club-logo" alt="\${club.name}" onerror="this.src='https://ui-avatars.com/api/?name=\${encodeURIComponent((club.name || 'CL').substring(0, 2))}&background=4a1c84&color=fff'">`
  );

  return res;
});

// 3. Patch club-leader.html
patchFile('club-leader.html', (content) => {
  let res = content;
  // Replace hardcoded Arjun Mehta
  res = res.replace(
    /<span id="userName" class="user-name">Arjun Mehta<\/span>/g,
    '<span id="userName" class="user-name">Club Leader</span>'
  );
  res = res.replace(
    /src="https:\/\/images\.unsplash\.com\/photo-1539571696357-5a69c17a67c6\?w=150"/g,
    'src="https://ui-avatars.com/api/?name=Leader&background=4a1c84&color=fff"'
  );
  // Replace default club name
  res = res.replace(
    /<h1 id="clubName">The AI Club<\/h1>/g,
    '<h1 id="clubName">Loading Club...</h1>'
  );

  // Replace banner logo with uploadable logo container & camera icon
  const oldBannerLogo = `<div class="club-banner" data-aos="fade-down">\n            <img id="clubLogo" src="" alt="Club Logo" class="cb-logo">`;
  const newBannerLogo = `<div class="club-banner" data-aos="fade-down">
            <div class="cb-logo-wrap" style="position:relative;display:inline-block;flex-shrink:0;">
                <img id="clubLogo" src="https://ui-avatars.com/api/?name=Club&background=4a1c84&color=fff&bold=true" alt="Club Logo" class="cb-logo" style="width:72px;height:72px;border-radius:18px;object-fit:cover;border:2px solid rgba(255,255,255,0.4);background:#fff;display:block;">
                <button type="button" onclick="triggerClubLogoUpload()" style="position:absolute;bottom:-6px;right:-6px;background:#4a1c84;color:#fff;border:2px solid #fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.3);transition:all 0.2s;" title="Upload or Change Club Logo">📷</button>
            </div>`;
  res = res.replace(oldBannerLogo, newBannerLogo);

  // Add immediate hydration script after header
  if (!res.includes('mits_session_hydration_leader')) {
    const target = '</header>\n\n    <main class="page-body">';
    const script = `</header>

    <script id="mits_session_hydration_leader">
      (function() {
        try {
          var s = JSON.parse(sessionStorage.getItem('mits_session'));
          if (s && s.name) {
            var un = document.getElementById('userName');
            var ua = document.getElementById('userAvatar');
            if (un) un.textContent = s.name;
            if (ua) {
              ua.src = s.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=4a1c84&color=fff');
            }
          }
        } catch(e) {}
      })();
    </script>

    <main class="page-body">`;
    res = res.replace(target, script);
  }

  // Replace Club Profile & Bio panel with upload controls
  const oldBioPanel = `                <!-- Update Club Info -->
                <div class="panel full-col">
                    <div class="panel-title"><span>✏️ Club Profile & Bio</span></div>
                    <div class="form-group">
                        <label class="form-label">Club Description / Mission</label>
                        <textarea id="clubDescEdit" class="form-textarea" rows="2"></textarea>
                    </div>
                    <button onclick="saveClubInfo()" class="btn-secondary">Save Updates</button>
                </div>`;

  const newBioPanel = `                <!-- Update Club Info & Branding -->
                <div class="panel full-col">
                    <div class="panel-title"><span>✏️ Club Profile & Branding</span></div>
                    <div style="display:grid;grid-template-columns:1fr;gap:16px;margin-bottom:14px;">
                        <div class="form-group">
                            <label class="form-label">Club Description / Mission</label>
                            <textarea id="clubDescEdit" class="form-textarea" rows="2" placeholder="Describe the club mission and domain..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Club Logo Image</label>
                            <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
                                <img id="clubLogoPreview" src="" alt="Preview" style="width:56px;height:56px;border-radius:14px;object-fit:cover;border:1.5px solid #ede8f8;background:#fff;display:none;">
                                <div style="flex:1;min-width:200px;">
                                    <input type="text" id="clubLogoUrlEdit" class="form-input" placeholder="Paste image URL (e.g. https://... or upload below)">
                                </div>
                                <label class="btn-secondary" style="margin:0;cursor:pointer;padding:10px 18px;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;white-space:nowrap;">
                                    📁 Upload Logo
                                    <input type="file" id="clubLogoFileInput" accept="image/*" onchange="handleClubLogoFile(event)" style="display:none;">
                                </label>
                            </div>
                            <div style="font-size:11.5px;color:#777;margin-top:6px;">Upload a square image (PNG, JPG, SVG, WebP) or enter an external image URL. Max file size: 2MB.</div>
                        </div>
                    </div>
                    <button onclick="saveClubInfo()" class="btn-secondary" id="saveClubInfoBtn" style="font-weight:800;padding:10px 24px;">💾 Save Club Profile & Logo</button>
                </div>`;

  res = res.replace(oldBioPanel, newBioPanel);

  return res;
});

// 4. Patch js/club-leader.js
patchFile('js/club-leader.js', (content) => {
  let res = content;

  // Immediate auth guard, safe managedClub lookup, no Priya/Arjun fallback
  const oldTop = `document.addEventListener('DOMContentLoaded', async () => {
  await API.ready();

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  const currentUser = Auth.requireRole('club-leader');
  if (!currentUser) return;

  // ─── Header ──────────────────────────────────────────────────────────────
  const userEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  if (userEl) userEl.textContent = currentUser.name;
  if (avatarEl && currentUser.avatar) avatarEl.src = currentUser.avatar;

  // ─── Find Managed Club ────────────────────────────────────────────────────
  let managedClub = DB.clubs.query(c => c.leaderId === currentUser.id)[0];
  if (!managedClub) {
    // Fallback to first club if test leader
    managedClub = DB.clubs.getAll()[0];
  }
  if (!managedClub) {
    document.querySelector('.club-banner').innerHTML = \`<div style="color:#fff;padding:20px;"><h2>No Club Assigned</h2><p>You are not assigned as leader of any club. Contact the Super Admin.</p></div>\`;
    return;
  }`;

  const newTop = `document.addEventListener('DOMContentLoaded', async () => {
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
      banner.innerHTML = \`
        <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(8px);border-radius:18px;padding:36px 24px;text-align:center;width:100%;border:1px solid rgba(255,255,255,0.2);">
          <div style="font-size:3rem;margin-bottom:12px;">⏳</div>
          <h2 style="font-family:'Playfair Display',serif;color:#fff;margin:0 0 10px;font-size:1.6rem;">Leadership Assignment Pending</h2>
          <p style="color:rgba(255,255,255,0.9);font-size:14.5px;max-width:540px;margin:0 auto 12px;line-height:1.6;">
            Welcome, <strong>\${currentUser.name}</strong>! Your account has Club Leader privileges.
            The Super Admin has not assigned you to lead a specific club charter yet.
          </p>
          <p style="color:rgba(255,255,255,0.65);font-size:12.5px;margin:0;">Once assigned from the Super Admin portal, your full club dashboard and operations will activate automatically.</p>
        </div>\`;
    }
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    return;
  }`;

  res = res.replace(oldTop, newTop);

  // Update refreshBanner to populate logo & edit input
  const oldRefreshBanner = `  function refreshBanner() {
    const club = DB.clubs.getById(managedClub.id);
    if (!club) return;
    document.getElementById('clubName').textContent = club.name;
    document.getElementById('clubDesc').textContent = \`\${club.category} · \${(club.description || '').substring(0, 95)}...\`;
    if (club.logo) document.getElementById('clubLogo').src = club.logo;
    const descEdit = document.getElementById('clubDescEdit');
    if (descEdit) descEdit.value = club.description || '';`;

  const newRefreshBanner = `  function refreshBanner() {
    const club = DB.clubs.getById(managedClub.id) || managedClub;
    if (!club) return;
    document.getElementById('clubName').textContent = club.name;
    document.getElementById('clubDesc').textContent = \`\${club.category || 'General'} · \${(club.description || '').substring(0, 95)}...\`;

    const logoUrl = club.icon || club.logo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent((club.name || 'CL').substring(0, 2)) + '&background=4a1c84&color=fff&bold=true');
    const logoEl = document.getElementById('clubLogo');
    if (logoEl) logoEl.src = logoUrl;
    const previewEl = document.getElementById('clubLogoPreview');
    if (previewEl) { previewEl.src = logoUrl; previewEl.style.display = 'block'; }
    const urlInput = document.getElementById('clubLogoUrlEdit');
    if (urlInput) urlInput.value = club.icon || club.logo || '';

    const descEdit = document.getElementById('clubDescEdit');
    if (descEdit) descEdit.value = club.description || '';`;

  res = res.replace(oldRefreshBanner, newRefreshBanner);

  // Add logo upload handlers and replace saveClubInfo
  const oldSaveClub = `  window.saveClubInfo = function () {
    const desc = document.getElementById('clubDescEdit').value.trim();
    DB.clubs.update(managedClub.id, { description: desc });
    UI.showToast('Club description updated.', 'success');
    refreshBanner();
  };`;

  const newSaveClub = `  // ─── Club Logo Upload & Profile Update ────────────────────────────────────
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
  };`;

  res = res.replace(oldSaveClub, newSaveClub);

  return res;
});

// 5. Patch superadmin.html and js/superadmin.js
patchFile('superadmin.html', (content) => {
  let res = content;
  res = res.replace(
    /<span id="userName" class="user-name">Dr\. Admin<\/span>/g,
    '<span id="userName" class="user-name">Super Admin</span>'
  );
  if (!res.includes('mits_session_hydration_admin')) {
    const target = '</header>\n\n    <main class="page-body">';
    const script = `</header>

    <script id="mits_session_hydration_admin">
      (function() {
        try {
          var s = JSON.parse(sessionStorage.getItem('mits_session'));
          if (s && s.name) {
            var un = document.getElementById('userName');
            var ua = document.getElementById('userAvatar');
            if (un) un.textContent = s.name;
            if (ua && s.avatar) ua.src = s.avatar;
          }
        } catch(e) {}
      })();
    </script>

    <main class="page-body">`;
    res = res.replace(target, script);
  }
  return res;
});

patchFile('js/superadmin.js', (content) => {
  let res = content;
  const oldTop = `document.addEventListener('DOMContentLoaded', async () => {
  await API.init();

  // ─── Auth Guard ──────────────────────────────────────────────────────────
  const currentUser = Auth.requireRole('superadmin');
  if (!currentUser) return;

  // ─── Header ──────────────────────────────────────────────────────────────
  const userEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  if (userEl) userEl.textContent = currentUser.name;
  if (avatarEl && currentUser.avatar) avatarEl.src = currentUser.avatar;`;

  const newTop = `document.addEventListener('DOMContentLoaded', async () => {
  // ─── Auth Guard (synchronous, 0ms redirect if unauthorized) ───────────────
  const currentUser = Auth.requireRole('superadmin');
  if (!currentUser) return;

  // ─── Header Instant Render ───────────────────────────────────────────────
  const userEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  if (userEl) userEl.textContent = currentUser.name;
  if (avatarEl) avatarEl.src = currentUser.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=4a1c84&color=fff');

  await API.ready();`;

  res = res.replace(oldTop, newTop);
  return res;
});

// 6. Patch event-register.html
patchFile('event-register.html', (content) => {
  let res = content;
  res = res.replace(/placeholder="e\.g\. Priya Sharma"/g, 'placeholder="Enter your full name"');
  res = res.replace(/<div class="pass-field-val" id="passAttendee">Priya Sharma<\/div>/g, '<div class="pass-field-val" id="passAttendee">Student Attendee</div>');
  res = res.replace(/value="Priya Sharma"/g, 'value=""');
  return res;
});

// 7. Patch event-feedback.html
patchFile('event-feedback.html', (content) => {
  let res = content;
  res = res.replace(/placeholder="e\.g\. Priya Sharma"/g, 'placeholder="Enter your full name"');
  return res;
});

console.log('🎉 All fix patches applied!');
