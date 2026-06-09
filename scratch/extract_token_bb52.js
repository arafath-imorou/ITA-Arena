const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\bb52dbd0-ea08-466e-b05a-d3532b5ba540';

if (fs.existsSync(dir)) {
  console.log(`Scanning: ${dir}`);
  function scan(currentDir) {
    const files = fs.readdirSync(currentDir);
    files.forEach(file => {
      const fullPath = path.join(currentDir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== '.git' && file !== 'node_modules' && file !== '.next') {
            scan(fullPath);
          }
        } else {
          if (stat.size < 5000000) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('eyJ')) {
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                const match = line.match(/eyJ[a-zA-Z0-9_\-\.]+/g);
                if (match) {
                  match.forEach(token => {
                    if (token.length > 80) {
                      try {
                        const base64Url = token.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = Buffer.from(base64, 'base64').toString();
                        if (jsonPayload.includes('service_role')) {
                          console.log(`FOUND IN FILE: ${fullPath} (Line ${idx + 1})`);
                          console.log(`JWT Payload: ${jsonPayload}`);
                          console.log(`JWT Token: ${token}`);
                        }
                      } catch (e) {}
                    }
                  });
                }
              });
            }
          }
        }
      } catch (e) {}
    });
  }
  scan(dir);
} else {
  console.log('Dir does not exist');
}
