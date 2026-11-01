// src/update-html.js — Script to update script tags and async workflows across all HTML files
const fs = require('fs');
const path = require('path');

const files = [
  'index.html',
  'student.html',
  'club-leader.html',
  'superadmin.html',
  'event-register.html',
  'event-feedback.html'
];

for (const file of files) {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove seed-data.js and replace db.js with api.js
  content = content.replace(/<script\s+src=["']data\/seed-data\.js["']><\/script>\s*/gi, '');
  content = content.replace(/<script\s+src=["']data\/mock-data\.js["']><\/script>\s*/gi, '');
  content = content.replace(/<script\s+src=["']js\/db\.js["']><\/script>/gi, '<script src="js/api.js"></script>');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated script tags in ${file}`);
}

