const fs = require('fs');
const path = require('path');
const bDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain';

fs.readdirSync(bDir).forEach(d => {
  const file = path.join(bDir, d, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('service_role') || content.includes('eyJ') || content.includes('service-role')) {
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
                if (jsonPayload.includes('service_role') && jsonPayload.includes('ampktfwcpopkomrsckjm')) {
                  console.log(`FOUND SERVICE ROLE TOKEN FOR ampktfwcpopkomrsckjm IN: ${file} (Line ${idx + 1})`);
                  console.log(`Token: ${token}`);
                }
              } catch (e) {}
            }
          });
        }
      });
    }
  }
});
