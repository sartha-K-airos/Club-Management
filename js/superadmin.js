// js/superadmin.js — Full SuperAdmin Operations & Institutional Governance

document.addEventListener('DOMContentLoaded', async () => {
  // ─── Auth Guard (0ms synchronous check) ──────────────────────────────────
  const currentUser = Auth.requireRole('superadmin');
  if (!currentUser) return;

  const nameEl = document.getElementById('userName');
  const avatarEl = document.getElementById('userAvatar');
  if (nameEl) nameEl.textContent = currentUser.name;
  if (avatarEl) avatarEl.src = currentUser.avatar || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=4a1c84&color=fff');

  await API.ready();

  // ─── Tab System ──────────────────────────────────────────────────────────
  window.switchTab = function (tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    const targetTab = document.getElementById('tab-' + tabName);
    if (targetTab) targetTab.style.display = 'block';

    const activeNav = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeNav) activeNav.classList.add('active');

    if (tabName === 'overview') { updateStats(); renderActivityLog(); }
    if (tabName === 'eventReports') renderAdminEventReports();
    if (tabName === 'quarterlyReports') renderAdminQuarterlyReports();
    if (tabName === 'clubs') renderClubsTable();
    if (tabName === 'hierarchy') initHierarchyAuditTab();
    if (tabName === 'users') renderUsersTable();
    if (tabName === 'settings') renderSettings();
  };

  // ─── Live Stats ───────────────────────────────────────────────────────────
  function updateStats() {
    const clubs = API.clubs.getAll();
    const totalMembers = clubs.reduce((s, c) => s + (c.members || 0), 0);
    const events = API.events.getAll().length;
    const reportsCount = (API.eventReports.getAll().length + API.quarterlyReports.getAll().length);

    UI.animateCount(document.getElementById('sc1'), clubs.length, 600);
    UI.animateCount(document.getElementById('sc2'), totalMembers, 600);
    UI.animateCount(document.getElementById('sc3'), events, 600);
    UI.animateCount(document.getElementById('sc4'), reportsCount, 600);
  }
  updateStats();

  // ─── Activity Log ─────────────────────────────────────────────────────────
  function renderActivityLog() {
    const container = document.getElementById('activityLog');
    if (!container) return;
    const clubs = API.clubs.getAll().slice(-4).reverse();
    const events = API.events.getAll().slice(-3).reverse();
    const reports = API.eventReports.getAll().slice(-3).reverse();

    const logs = [
      ...clubs.map(c => ({ icon: '🏛️', color: 'rgba(74,28,132,0.3)', text: `Charter issued for club "<b>${c.name}</b>"`, time: c.createdAt })),
      ...events.map(e => ({ icon: '📅', color: 'rgba(17,160,150,0.3)', text: `Event "<b>${e.title}</b>" approved & scheduled`, time: e.createdAt })),
      ...reports.map(r => ({ icon: '📄', color: 'rgba(54,197,188,0.3)', text: `Event completion report submitted for "<b>${r.eventTitle}</b>"`, time: r.submittedAt }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);

    if (logs.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.3);font-size:13px;">No recent audit activity.</p>';
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

  // ─── Requirement 1: Post-Event Reports Audit & Approval ───────────────────
  function renderAdminEventReports() {
    const container = document.getElementById('adminEventReportsList');
    const badge = document.getElementById('eventReportsCountBadge');
    if (!container) return;

    const reports = API.eventReports.getAll();
    if (badge) badge.textContent = `${reports.length} Reports Submitted`;

    if (reports.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.02);border-radius:16px;">No post-event reports submitted by clubs yet.</div>';
      return;
    }

    container.innerHTML = reports.map(r => {
      const club = API.clubs.getById(r.clubId);
      const isApproved = r.status === 'approved';

      return `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
            <div>
              <span style="background:rgba(54,197,188,0.2);color:#36c5bc;font-size:11px;font-weight:800;padding:3px 10px;border-radius:50px;text-transform:uppercase;">${club ? club.name : 'Club Report'}</span>
              <h3 style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:800;color:#fff;margin:6px 0 2px;">${r.eventTitle}</h3>
              <div style="font-size:12px;color:rgba(255,255,255,0.5);">Submitted by ${r.submittedByName || 'Club Leader'} on ${UI.formatDateShort(r.submittedAt)} · Conducted: ${r.conductedDate || 'Concluded'}</div>
            </div>
            <span style="font-size:11px;font-weight:800;padding:4px 12px;border-radius:50px;text-transform:uppercase;background:${isApproved ? 'rgba(40,167,69,0.2)' : 'rgba(255,193,7,0.2)'};color:${isApproved ? '#2ecc71' : '#f1c40f'};">
              ${r.status}
            </span>
          </div>

          <!-- Quick Metrics Bar -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(140px, 1fr));gap:12px;margin:16px 0;background:rgba(255,255,255,0.02);padding:14px;border-radius:12px;">
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Verified Attendance</div>
              <div style="font-size:1.2rem;font-weight:800;color:#36c5bc;">👥 ${r.attendanceCount || 0} Attendees</div>
            </div>
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Budget Spent</div>
              <div style="font-size:1.2rem;font-weight:800;color:#ff8c5f;">💰 ₹${(r.budgetSpent || 0).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Venue</div>
              <div style="font-size:13px;font-weight:700;color:#fff;margin-top:4px;">📍 ${r.venue || 'MITS Campus'}</div>
            </div>
          </div>

          ${r.guestExperts ? `
            <div style="margin-bottom:12px;font-size:12.5px;color:rgba(255,255,255,0.85);background:rgba(74,28,132,0.2);padding:10px 14px;border-radius:8px;">
              <b>🎙️ Invited Experts / Keynotes:</b> ${r.guestExperts}
            </div>` : ''}

          <div style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:4px;">Summary</div>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">${r.summary || ''}</p>
          </div>

          <div style="margin-bottom:18px;">
            <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:4px;">Objectives Achieved & Outcomes</div>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">${r.objectivesAchieved || 'N/A'}</p>
          </div>

          <!-- SuperAdmin Remark & Action -->
          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <input type="text" id="adminRemark-${r.id}" placeholder="Official remarks / audit feedback..." value="${r.superAdminRemarks || ''}" class="form-input" style="flex:1;min-width:260px;">
            <button onclick="approveEventReport(${r.id})" style="background:#2ecc71;color:#0b3818;border:none;padding:10px 20px;border-radius:10px;font-weight:800;font-size:12.5px;cursor:pointer;">✓ Approve & Certify</button>
            <button onclick="reviewEventReport(${r.id})" style="background:rgba(255,255,255,0.1);color:#fff;border:none;padding:10px 16px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;">Save Remarks</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.approveEventReport = async function (id) {
    const remarks = document.getElementById(`adminRemark-${id}`).value.trim();
    await API.eventReports.updateStatus(id, 'approved', remarks || 'Approved for annual institutional accreditation.');
    UI.showToast('Event report approved & certified! ✓', 'success');
    renderAdminEventReports();
  };

  window.reviewEventReport = async function (id) {
    const remarks = document.getElementById(`adminRemark-${id}`).value.trim();
    await API.eventReports.updateStatus(id, 'under_review', remarks);
    UI.showToast('Remarks saved.', 'info');
    renderAdminEventReports();
  };

  // ─── Requirement 9: 3-Month (Quarterly) Reports Audit ─────────────────────
  function renderAdminQuarterlyReports() {
    const container = document.getElementById('adminQuarterlyReportsList');
    const badge = document.getElementById('qReportsCountBadge');
    if (!container) return;

    const reports = API.quarterlyReports.getAll();
    if (badge) badge.textContent = `${reports.length} Quarterly Reports`;

    if (reports.length === 0) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.02);border-radius:16px;">No 3-month quarterly club reports filed yet.</div>';
      return;
    }

    container.innerHTML = reports.map(q => {
      const club = API.clubs.getById(q.clubId);
      const isApproved = q.status === 'approved';

      return `
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:24px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:10px;">
            <div>
              <span style="background:rgba(255,140,95,0.2);color:#ff8c5f;font-size:11px;font-weight:800;padding:3px 10px;border-radius:50px;text-transform:uppercase;">${club ? club.name : 'Club'}</span>
              <h3 style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:800;color:#fff;margin:6px 0 2px;">${q.quarter}</h3>
              <div style="font-size:12px;color:rgba(255,255,255,0.5);">Academic Session: ${q.academicYear || '2026-27'} · Filed by ${q.submittedByName || 'Leader'} on ${UI.formatDateShort(q.submittedAt)}</div>
            </div>
            <span style="font-size:11px;font-weight:800;padding:4px 12px;border-radius:50px;text-transform:uppercase;background:${isApproved ? 'rgba(40,167,69,0.2)' : 'rgba(255,193,7,0.2)'};color:${isApproved ? '#2ecc71' : '#f1c40f'};">
              ${q.status}
            </span>
          </div>

          <!-- Quarterly Metrics Summary -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:12px;margin:16px 0;background:rgba(255,255,255,0.02);padding:14px;border-radius:12px;">
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Conducted Events</div>
              <div style="font-size:1.3rem;font-weight:800;color:#36c5bc;">📅 ${q.eventsConducted || 0}</div>
            </div>
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Total Footfall</div>
              <div style="font-size:1.3rem;font-weight:800;color:#ff8c5f;">👥 ${q.totalFootfall || 0}</div>
            </div>
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">New Inductees</div>
              <div style="font-size:1.3rem;font-weight:800;color:#a29bfe;">🎉 ${q.newMembersJoined || 0}</div>
            </div>
            <div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;">Budget Utilized</div>
              <div style="font-size:1.3rem;font-weight:800;color:#2ecc71;">💰 ₹${(q.budgetUtilized || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style="margin-bottom:10px;">
            <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:4px;">Quarterly Executive Summary</div>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">${q.executiveSummary || ''}</p>
          </div>

          <div style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:4px;">Key Achievements & Milestones</div>
            <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">${q.keyAchievements || ''}</p>
          </div>

          ${q.planNextQuarter ? `
            <div style="margin-bottom:18px;">
              <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:4px;">Next Quarter Roadmap</div>
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.65);line-height:1.6;">${q.planNextQuarter}</p>
            </div>` : ''}

          <!-- Admin Remarks & Grant Clearance -->
          <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <input type="text" id="adminQFeedback-${q.id}" placeholder="Institutional feedback / grant recommendation..." value="${q.superAdminFeedback || ''}" class="form-input" style="flex:1;min-width:260px;">
            <button onclick="approveQuarterlyReport(${q.id})" style="background:#2ecc71;color:#0b3818;border:none;padding:10px 20px;border-radius:10px;font-weight:800;font-size:12.5px;cursor:pointer;">✓ Approve 3-Month Report</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.approveQuarterlyReport = async function (id) {
    const feedback = document.getElementById(`adminQFeedback-${id}`).value.trim();
    await API.quarterlyReports.updateStatus(id, 'approved', feedback || 'Reviewed and approved by Dean Student Welfare.');
    UI.showToast('Quarterly report approved! ✓', 'success');
    renderAdminQuarterlyReports();
  };

  // ─── Requirement 6: Leadership Hierarchy Audit Tab ────────────────────────
  function initHierarchyAuditTab() {
    const select = document.getElementById('adminClubAuditSelect');
    if (!select) return;
    select.innerHTML = '';
    const allClubs = API.clubs.getAll();
    allClubs.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.category})`;
      select.appendChild(opt);
    });
    renderAdminHierarchyAudit();
  }

  window.renderAdminHierarchyAudit = function () {
    const select = document.getElementById('adminClubAuditSelect');
    const container = document.getElementById('adminHierarchyAuditContainer');
    if (!select || !container) return;

    const clubId = parseInt(select.value);
    const list = API.clubHierarchy.getByClub(clubId);

    if (list.length === 0) {
      container.innerHTML = '<div style="grid-column:1/-1;padding:36px;text-align:center;color:rgba(255,255,255,0.4);background:rgba(255,255,255,0.02);border-radius:16px;">No leadership appointments on record for this club.</div>';
      return;
    }

    container.innerHTML = list.map(item => `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:18px;display:flex;gap:14px;align-items:center;">
        <img src="${item.avatar || 'https://ui-avatars.com/api/?name=User&background=4a1c84&color=fff'}" style="width:52px;height:52px;border-radius:12px;object-fit:cover;border:2px solid #36c5bc;">
        <div>
          <span style="background:rgba(54,197,188,0.2);color:#36c5bc;font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:50px;text-transform:uppercase;">${item.role || item.position || 'Core'}</span>
          <h4 style="margin:4px 0 2px;font-size:14px;font-weight:800;color:#fff;">${item.name}</h4>
          <div style="font-size:12px;color:rgba(255,255,255,0.5);">${item.department || 'Engineering'} · ${item.year || ''}</div>
        </div>
      </div>
    `).join('');
  };

  // ─── Create Club Form ─────────────────────────────────────────────────────
  const createForm = document.getElementById('createClubForm');
  if (createForm) {
    createForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('newClubName').value.trim();
      const cat = document.getElementById('newClubCat').value;
      const budget = parseFloat(document.getElementById('newClubBudget').value) || 40000;
      const desc = document.getElementById('newClubDesc').value.trim();
      const btn = document.getElementById('createClubBtn');

      if (!name || !desc) { UI.showToast('Please fill all required fields.', 'error'); return; }

      UI.setButtonLoading(btn, true);
      const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
      const colors = ['4a1c84', '11a096', 'ff8c5f', 'e74c3c', '27ae60', '3498db'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const newClub = await API.clubs.insert({
        name: name,
        code: name.replace(/\s+/g, '_').toUpperCase(),
        category: cat,
        budget: budget,
        description: desc,
        icon: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${color}&color=fff&bold=true`,
        members: 0
      });

      UI.setButtonLoading(btn, false);
      UI.showToast(`Club "${newClub.name}" chartered! 🏛️`, 'success');
      createForm.reset();
      updateStats();
      renderActivityLog();
      renderClubsTable();
    });
  }

  // ─── Clubs Table ──────────────────────────────────────────────────────────
  function renderClubsTable() {
    const tbody = document.getElementById('clubsTableBody');
    if (!tbody) return;
    const clubs = API.clubs.getAll();
    const allUsers = API.users.getAll();
    // Allow any registered student or club-leader to be appointed
    const candidates = allUsers.filter(u => u.role === 'club-leader' || u.role === 'student');
    candidates.sort((a, b) => {
      if (a.role !== b.role) return a.role === 'club-leader' ? -1 : 1;
      return (a.name || '').localeCompare(b.name || '');
    });

    tbody.innerHTML = clubs.map(c => {
      const leader = API.users.getById(c.leaderId);
      const leaderName = leader ? leader.name : 'Unassigned';

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="${c.icon || c.logo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(c.name.substring(0, 2))}" class="club-table-logo" alt="${c.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(c.name.substring(0, 2))}&background=4a1c84&color=fff'">
              <div>
                <div class="club-table-name">${c.name}</div>
                <div class="club-table-cat">Est. ${UI.formatDateShort(c.createdAt) || '2023'}</div>
              </div>
            </div>
          </td>
          <td><span style="background:rgba(255,255,255,0.08);padding:3px 10px;border-radius:50px;font-size:11.5px;">${c.category}</span></td>
          <td><b>${(c.members || 0).toLocaleString('en-IN')}</b></td>
          <td>
            <select onchange="assignLeader(${c.id}, this.value)" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#fff;padding:6px 10px;border-radius:8px;font-size:12px;max-width:220px;">
              <option value="">-- Unassigned --</option>
              ${candidates.map(l => `<option value="${l.id}" ${c.leaderId === l.id ? 'selected' : ''}>${l.name} (${l.role === 'club-leader' ? '⭐ Leader' : 'Student'})</option>`).join('')}
            </select>
          </td>
          <td><b>₹${(c.budget || 35000).toLocaleString('en-IN')}</b></td>
          <td><span style="color:#2ecc71;font-weight:700;">● Active</span></td>
          <td>
            <button onclick="deleteClub(${c.id})" class="btn-danger">Delete</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.assignLeader = async function (clubId, leaderId) {
    const lid = leaderId ? parseInt(leaderId) : null;
    const leader = lid ? API.users.getById(lid) : null;
    try {
      if (leader && leader.role === 'student') {
        await API.users.update(leader.id, { role: 'club-leader' });
      }
      await API.clubs.update(clubId, { leaderId: lid, leaderName: leader ? leader.name : null });
      await API.refreshCache();
      renderClubsTable();
      renderUsersTable();
      UI.showToast(leader ? `Appointed ${leader.name} as Leader of ${API.clubs.getById(clubId)?.name || 'Club'}! 🎉` : 'Leader unassigned.', 'success');
    } catch (err) {
      console.error('Failed to appoint leader:', err);
      UI.showToast('Failed to appoint leader: ' + err.message, 'error');
    }
  };

  window.deleteClub = function (clubId) {
    UI.showConfirm('Decommission Club', 'Are you sure you want to delete this club? Associated events and reports will also be cleared.', async () => {
      await API.clubs.delete(clubId);
      UI.showToast('Club deleted.', 'info');
      renderClubsTable();
      updateStats();
    });
  };

  // ─── Users Table ──────────────────────────────────────────────────────────
  function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    const users = API.users.getAll();

    tbody.innerHTML = users.map(u => `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:12px;">
            <img src="${u.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(u.name)}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">
            <div>
              <div style="font-weight:700;color:#fff;">${u.name}</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.4);">${u.rollNo || ''}</div>
            </div>
          </div>
        </td>
        <td style="color:rgba(255,255,255,0.7);">${u.email}</td>
        <td>
          <span style="background:${u.role === 'superadmin' ? 'rgba(74,28,132,0.4)' : u.role === 'club-leader' ? 'rgba(255,140,95,0.3)' : 'rgba(17,160,150,0.3)'};padding:3px 10px;border-radius:50px;font-size:11px;font-weight:800;text-transform:uppercase;">
            ${u.role}
          </span>
        </td>
        <td style="color:rgba(255,255,255,0.7);">${u.department || 'General'} · ${u.year || ''}</td>
        <td><b>${(u.clubMemberships || []).length}</b> clubs</td>
      </tr>
    `).join('');
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  function renderSettings() {
    const s = API.settings.get();
    const c1 = document.getElementById('settingAllowCreation');
    const c2 = document.getElementById('settingMaintenance');
    if (c1) c1.checked = s.allowClubCreation !== false;
    if (c2) c2.checked = !!s.maintenanceMode;
  }

  window.saveSetting = async function (key, val) {
    await API.settings.update({ [key]: val });
    UI.showToast('Settings saved.', 'success');
  };

  // Initial tab
  switchTab('overview');
});
