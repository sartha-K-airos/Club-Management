// js/db.js — Compatibility bridge redirecting to modern API layer
if (typeof API !== 'undefined') {
  window.DB = API;
}
