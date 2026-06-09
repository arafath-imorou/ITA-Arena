const fs = require('fs');
const path = require('path');

const brainsDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain';

function searchDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.next' && file !== '.git' && file !== 'logs') {
            searchDir(fullPath);
          }
        } else {
          if (stat.size < 5000000) { // Check files up to 5MB
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('eyJ') && (content.includes('service_role') || content.includes('service-role') || content.includes('ampktfwcpopkomrsckjm'))) {
              console.log('Match found in:', fullPath);
              // Find matches of eyJ... that are long and print them
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                const match = line.match(/eyJ[a-zA-Z0-9_\-\.]+/);
                if (match) {
                  // JWT tokens are usually very long (> 100 chars)
                  if (match[0].length > 50) {
                    console.log(`  Line ${idx + 1}: JWT token length: ${match[0].length}`);
                    console.log(`  Token: ${match[0].substring(0, 80)}...`);
                    // Check if it contains service_role
                    try {
                      const base64Url = match[0].split('.')[1];
                      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                      }).join(''));
                      console.log(`  Payload: ${jsonPayload}`);
                      if (jsonPayload.includes('service_role')) {
                        console.log(`  [FOUND SERVICE ROLE TOKEN!] Full Token: ${match[0]}`);
                      }
                    } catch (e) {
                      // Not a standard JWT or parsing error
                    }
                  }
                }
              });
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

searchDir(brainsDir);
