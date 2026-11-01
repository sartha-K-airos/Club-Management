const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(
`        <div class="demo-creds">
          <h4>Administrator Access</h4>
          <div class="demo-cred-item" onclick="fillCred('admin@mits.edu','admin123')">
            ⚙️ SuperAdmin &nbsp;&nbsp;<span>admin@mits.edu / admin123</span>
          </div>
        </div>
      </div>
      </div>`,
`        <div class="demo-creds">
          <h4>Administrator Access</h4>
          <div class="demo-cred-item" onclick="fillCred('admin@mits.edu','admin123')">
            ⚙️ SuperAdmin &nbsp;&nbsp;<span>admin@mits.edu / admin123</span>
          </div>
        </div>
      </div>`
);

fs.writeFileSync('index.html', html, 'utf8');
console.log('Fixed closing tags in index.html');
