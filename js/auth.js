// js/auth.js — Session Management Service

const Auth = (() => {
  const SESSION_KEY = 'mits_session';

  function register(name, email, password, role = 'student') {
    const existing = DB.users.getByEmail(email.trim().toLowerCase());
    if (existing) return { success: false, error: 'Account already exists with that email.' };

    const newUser = DB.users.insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      role: role
    });

    if (!newUser) return { success: false, error: 'Registration failed.' };

    return login(email, password);
  }

  function login(email, password) {
    const user = DB.users.getByEmail(email.trim().toLowerCase());
    if (!user) return { success: false, error: 'No account found with that email.' };
    if (user.password !== password) return { success: false, error: 'Incorrect password.' };

    // Check maintenance mode (students blocked)
    const s = DB.settings.get();
    if (s.maintenanceMode && user.role === 'student') {
      return { success: false, error: 'System is in maintenance mode. Please try again later.' };
    }

    // Store session (without password)
    const session = { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  }

  function getCurrentUser() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; }
    catch { return null; }
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

  return { register, login, logout, getCurrentUser, isLoggedIn, requireRole, redirectToDashboard };
})();

window.Auth = Auth;
