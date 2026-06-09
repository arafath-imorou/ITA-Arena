const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0261154f-6dd2-4a30-a822-7717244779c5\\.system_generated\\logs\\overview.txt';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist at', logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Searching in logs...');
lines.forEach((line, index) => {
  if (line.includes('list_projects') || line.includes('eqqdjqdbbwmshllqesdt') || line.includes('ampktfwcpopkomrsckjm')) {
    console.log(`\nLine ${index + 1}:`);
    console.log(line.substring(0, 1000));
  }
});
