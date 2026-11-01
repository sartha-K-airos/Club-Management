// js/auth.js — Authentication Service (Backend API)

const Auth = (() => {
  const SESSION_KEY = 'mits_session';
  let _currentUser = null;

  async function register(name, email, password, role = 'student') {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ name, email: email.trim().toLowerCase(), password, role })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Registration failed.' };
      _currentUser = data.user;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(_currentUser));
      return { success: true, user: _currentUser };
    } catch (e) {
      return { success: false, error: e.message || 'Network error.' };
    }
  }

  async function login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Login failed.' };
      _currentUser = data.user;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(_currentUser));
      return { success: true, user: _currentUser };
    } catch (e) {
      return { success: false, error: e.message || 'Network error.' };
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (e) { /* ignore */ }
    _currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  }

  function getCurrentUser() {
    if (_currentUser) return _currentUser;
    try {
      _currentUser = JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
      return _currentUser;
    } catch { return null; }
  }

  function isLoggedIn() {
    return getCurrentUser() !== null;
  }

  // Call at top of each dashboard page — redirects if wrong role
  function requireRole(...roles) {
    const user = getCurrentUser();
    if (!user || !roles.includes(user.role)) {
      window.location.href = 'index.html';
      return null;
    }
    return user;
  }

  // Route from login based on role
  function redirectToDashboard(role) {
    const routes = {
      'student':     'student.html',
      'club-leader': 'club-leader.html',
      'superadmin':  'superadmin.html'
    };
    window.location.href = routes[role] || 'index.html';
  }

  // Check server session on load (optional — validates JWT is still valid)
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (res.ok) {
        const data = await res.json();
        _currentUser = data.user;
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(_currentUser));
      } else {
        _currentUser = null;
        sessionStorage.removeItem(SESSION_KEY);
      }
    } catch (e) {
      // Keep sessionStorage state if server unreachable
    }
  }

  return { register, login, logout, getCurrentUser, isLoggedIn, requireRole, redirectToDashboard, checkSession };
})();

window.Auth = Auth;
