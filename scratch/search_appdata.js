const fs = require('fs');
const path = require('path');

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
          // Check size first, don't read huge binary files
          if (stat.size < 1000000) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.toLowerCase().includes('service_role') || content.toLowerCase().includes('service-role') || content.includes('sb_service_role')) {
              console.log('Match found in:', fullPath);
              // Print lines containing matching text
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                if (line.toLowerCase().includes('service_role') || line.toLowerCase().includes('service-role') || line.includes('sb_service_role')) {
                  console.log(`  Line ${idx + 1}: ${line.trim().substring(0, 150)}`);
                }
              });
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

searchDir('C:\\Users\\HP\\.gemini\\antigravity');
