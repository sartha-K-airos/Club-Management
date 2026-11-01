// src/middleware/auth.js — JWT authentication & role-based authorization
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mits-studenthub-jwt-secret-change-in-production-2026';

/**
 * Authenticate — verifies JWT from cookie or Authorization header.
 * Sets req.user = { id, email, role, name } on success.
 * Returns 401 if token is missing or invalid.
 */
function authenticate(req, res, next) {
  const token = req.cookies?.mits_token || extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * requireRole — returns middleware that checks req.user.role is in allowed roles.
 * Must be used AFTER authenticate.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * optionalAuth — like authenticate but doesn't fail if no token.
 * Sets req.user to null if no valid token found.
 */
function optionalAuth(req, res, next) {
  const token = req.cookies?.mits_token || extractBearerToken(req);

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
  } catch {
    req.user = null;
  }
  next();
}

/** Extract bearer token from Authorization header */
function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

module.exports = { authenticate, requireRole, optionalAuth };
