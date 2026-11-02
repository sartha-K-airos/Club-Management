// scripts/sync-public.js — Syncs static assets to public/ for Vercel CDN hosting
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
}

function copyDirRecursive(srcDir, destDir) {
  ensureDir(destDir);
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// 1. Ensure public/ exists
ensureDir(publicDir);

// 2. Copy all HTML files in root
const files = fs.readdirSync(rootDir);
for (const file of files) {
  if (file.endsWith('.html')) {
    copyFile(path.join(rootDir, file), path.join(publicDir, file));
  }
}

// 3. Copy js, css, data folders
const foldersToCopy = ['js', 'css', 'data'];
for (const folder of foldersToCopy) {
  const src = path.join(rootDir, folder);
  const dest = path.join(publicDir, folder);
  if (fs.existsSync(src)) {
    copyDirRecursive(src, dest);
  }
}

console.log('✅ Public directory successfully synced for Vercel CDN deployment.');

