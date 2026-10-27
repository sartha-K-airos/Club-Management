// js/ui.js — Shared UI Helpers (Toast, Modal, Skeleton, Formatters)

const UI = (() => {

  // ─── Toast Notification ──────────────────────────────────────────────────
  let _toastContainer = null;

  function _getToastContainer() {
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.id = 'toast-container';
      _toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
      document.body.appendChild(_toastContainer);
    }
    return _toastContainer;
  }

  function showToast(message, type = 'success', duration = 3500) {
    const container = _getToastContainer();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const colors = {
      success: 'linear-gradient(135deg,#00b894,#00cec9)',
      error:   'linear-gradient(135deg,#e74c3c,#c0392b)',
      info:    'linear-gradient(135deg,#4a1c84,#7a349c)',
      warning: 'linear-gradient(135deg,#f39c12,#e67e22)'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      background:${colors[type]};color:#fff;padding:14px 20px;border-radius:14px;
      font-size:14px;font-weight:600;font-family:Inter,sans-serif;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);pointer-events:all;
      display:flex;align-items:center;gap:10px;min-width:280px;max-width:380px;
      transform:translateX(120%);transition:transform 0.35s cubic-bezier(.34,1.56,.64,1);
    `;
    toast.innerHTML = `<span style="font-size:18px">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    });

    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // ─── Confirm Modal ───────────────────────────────────────────────────────
  function showConfirm(title, body, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);z-index:8000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s ease;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px;padding:36px;max-width:420px;width:90%;box-shadow:0 25px 80px rgba(0,0,0,0.25);transform:scale(1);animation:popIn 0.25s cubic-bezier(.34,1.56,.64,1);">
        <h3 style="font-size:1.3rem;font-weight:700;color:#2d0c5a;margin:0 0 12px 0;font-family:'Playfair Display',serif;">${title}</h3>
        <p style="color:#555;font-size:14px;margin:0 0 28px 0;line-height:1.6;">${body}</p>
        <div style="display:flex;gap:12px;">
          <button id="confirm-cancel" style="flex:1;padding:12px;border:2px solid #e0e0e0;background:#fff;border-radius:12px;font-weight:600;cursor:pointer;color:#555;font-family:Inter,sans-serif;">Cancel</button>
          <button id="confirm-ok" style="flex:1;padding:12px;background:linear-gradient(135deg,#4a1c84,#7a349c);color:#fff;border:none;border-radius:12px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#confirm-ok').onclick = () => { close(); if (onConfirm) onConfirm(); };
    overlay.querySelector('#confirm-cancel').onclick = () => { close(); if (onCancel) onCancel(); };
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
  }

  // ─── Skeleton Loader ─────────────────────────────────────────────────────
  function showSkeleton(containerId, count = 6, type = 'card') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      if (type === 'card') {
        el.className = 'skeleton-card';
        el.innerHTML = `
          <div class="skeleton-img"></div>
          <div style="padding:20px;">
            <div class="skeleton-line" style="width:60%;margin-bottom:10px;"></div>
            <div class="skeleton-line" style="width:90%;margin-bottom:8px;"></div>
            <div class="skeleton-line" style="width:75%;"></div>
          </div>
        `;
      } else if (type === 'row') {
        el.className = 'skeleton-row';
        el.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;padding:16px;">
            <div class="skeleton-avatar"></div>
            <div style="flex:1;">
              <div class="skeleton-line" style="width:50%;margin-bottom:8px;"></div>
              <div class="skeleton-line" style="width:80%;"></div>
            </div>
          </div>
        `;
      }
      container.appendChild(el);
    }
  }

  function hideSkeleton(containerId) {
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';
  }

  // ─── Empty State ──────────────────────────────────────────────────────────
  function showEmptyState(containerId, message = 'Nothing here yet.', icon = '🔍') {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#aaa;">
        <div style="font-size:3.5rem;margin-bottom:16px;">${icon}</div>
        <p style="font-size:1rem;font-weight:600;color:#888;font-family:Inter,sans-serif;">${message}</p>
      </div>
    `;
  }

  // ─── Button Loading State ─────────────────────────────────────────────────
  function setButtonLoading(btn, loading, originalText = '') {
    if (loading) {
      btn._originalText = btn.textContent;
      btn.textContent = 'Loading...';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      btn.textContent = originalText || btn._originalText || 'Submit';
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  // ─── Formatters ───────────────────────────────────────────────────────────
  function formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  function formatDateShort(isoString) {
    return new Date(isoString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  function timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function debounce(fn, ms) {
    let timer;
    return function(...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); };
  }

  // ─── Badge HTML ────────────────────────────────────────────────────────────
  function badge(text, type) {
    const colors = {
      pending:  'background:#fff3cd;color:#856404;border:1px solid #ffc107;',
      approved: 'background:#d1e7dd;color:#155724;border:1px solid #28a745;',
      rejected: 'background:#f8d7da;color:#721c24;border:1px solid #dc3545;',
      active:   'background:#d1ecf1;color:#0c5460;border:1px solid #17a2b8;',
      leader:   'background:#cce5ff;color:#004085;border:1px solid #007bff;',
      student:  'background:#e2e3e5;color:#383d41;border:1px solid #6c757d;',
      admin:    'background:#e8d5f5;color:#4a1c84;border:1px solid #7a349c;',
    };
    const style = colors[type] || colors.active;
    return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;${style}">${text}</span>`;
  }

  // ─── Category color mapping ───────────────────────────────────────────────
  function categoryColor(cat) {
    const map = {
      'Technology': '#4a1c84', 'Arts': '#e84393', 'Academic': '#11a096',
      'Sports': '#27ae60', 'Social': '#ff8c5f'
    };
    return map[cat] || '#888';
  }

  // ─── Animate counting numbers ─────────────────────────────────────────────
  function animateCount(el, target, duration = 1200) {
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.floor(eased * target).toLocaleString('en-IN');
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  return {
    showToast, showConfirm, showSkeleton, hideSkeleton, showEmptyState,
    setButtonLoading, formatDate, formatDateShort, timeAgo, debounce,
    badge, categoryColor, animateCount
  };
})();

window.UI = UI;
