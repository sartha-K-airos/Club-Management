// src/update-index.js
const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Update fillCred demo text for admin
html = html.replace(
  "fillCred('admin@mits.edu','password123')",
  "fillCred('admin@mits.edu','admin123')"
);
html = html.replace(
  "admin@mits.edu / password123",
  "admin@mits.edu / admin123"
);

// Update init block to await API.ready()
html = html.replace(
  "// ─── Init ─────────────────────────────────────────────────────────────\n    DB.seed();",
  "// ─── Init ─────────────────────────────────────────────────────────────\n    (async () => {\n      await API.ready();\n      renderLandingClubs();\n    })();"
);

// Update login submission to async
html = html.replace(
  `      UI.setButtonLoading(btn, true);
      setTimeout(() => {
        const result = Auth.login(email, pass);
        if (result.success) {
          UI.showToast(\`Welcome back, \${result.user.name}! 👋\`, 'success');
          setTimeout(() => Auth.redirectToDashboard(result.user.role), 600);
        } else {
          errBox.textContent = result.error;
          errBox.classList.add('show');
          UI.setButtonLoading(btn, false);
        }
      }, 400);`,
  `      UI.setButtonLoading(btn, true);
      try {
        const result = await Auth.login(email, pass);
        if (result.success) {
          UI.showToast(\`Welcome back, \${result.user.name}! 👋\`, 'success');
          setTimeout(() => Auth.redirectToDashboard(result.user.role), 600);
        } else {
          errBox.textContent = result.error;
          errBox.classList.add('show');
          UI.setButtonLoading(btn, false);
        }
      } catch (e) {
        errBox.textContent = 'Login failed. Please check your credentials.';
        errBox.classList.add('show');
        UI.setButtonLoading(btn, false);
      }`
);

// Make the submit listener async
html = html.replace(
  "document.getElementById('loginForm').addEventListener('submit', function (e) {",
  "document.getElementById('loginForm').addEventListener('submit', async function (e) {"
);

// Update register submission to async
html = html.replace(
  `      UI.setButtonLoading(btn, true);
      setTimeout(() => {
        const result = Auth.register(name, email, pass, 'student');
        if (result.success) {
          UI.showToast(\`Account created! Welcome to MITS StudentHub, \${result.user.name}! 🎉\`, 'success');
          setTimeout(() => Auth.redirectToDashboard(result.user.role), 600);
        } else {
          errBox.textContent = result.error;
          errBox.classList.add('show');
          UI.setButtonLoading(btn, false);
        }
      }, 400);`,
  `      UI.setButtonLoading(btn, true);
      try {
        const result = await Auth.register(name, email, pass, 'student');
        if (result.success) {
          UI.showToast(\`Account created! Welcome to MITS StudentHub, \${result.user.name}! 🎉\`, 'success');
          setTimeout(() => Auth.redirectToDashboard(result.user.role), 600);
        } else {
          errBox.textContent = result.error;
          errBox.classList.add('show');
          UI.setButtonLoading(btn, false);
        }
      } catch (e) {
        errBox.textContent = 'Registration failed. Please try again.';
        errBox.classList.add('show');
        UI.setButtonLoading(btn, false);
      }`
);

html = html.replace(
  "document.getElementById('registerForm').addEventListener('submit', function (e) {",
  "document.getElementById('registerForm').addEventListener('submit', async function (e) {"
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html updated successfully');

