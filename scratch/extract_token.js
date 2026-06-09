const fs = require('fs');
const path = require('path');

const dirs = [
  'C:\\Users\\HP\\.gemini\\antigravity\\brain\\a458e20d-ff57-44f6-95d0-399e03f6ed9c',
  'C:\\Users\\HP\\.gemini\\antigravity\\brain\\173dd927-c207-4423-ba0d-e0a74b955597',
  'C:\\Users\\HP\\.gemini\\antigravity\\brain\\52aff94a-c533-4609-a2d6-3fe3f8c216fb'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  console.log(`\nScanning directory: ${dir}`);
  
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
            if (content.includes('eyJ') && (content.toLowerCase().includes('service_role') || content.toLowerCase().includes('service-role'))) {
              console.log(`Found candidate in file: ${fullPath}`);
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                const match = line.match(/eyJ[a-zA-Z0-9_\-\.]+/g);
                if (match) {
                  match.forEach(token => {
                    if (token.length > 80) {
                      console.log(`  Line ${idx + 1}: JWT of length ${token.length}`);
                      try {
                        const base64Url = token.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = Buffer.from(base64, 'base64').toString();
                        console.log(`    Payload: ${jsonPayload}`);
                        if (jsonPayload.includes('service_role')) {
                          console.log(`    [SERVICE ROLE TOKEN FOUND!]: ${token}`);
                        }
                      } catch (e) {
                        // ignore parsing errors
                      }
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
});
