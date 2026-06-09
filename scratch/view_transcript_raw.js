const fs = require('fs');
const logPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0261154f-6dd2-4a30-a822-7717244779c5\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist at', logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Lines 1 to 24:');
lines.slice(0, 24).forEach((line, index) => {
  console.log(`Line ${index + 1}:`, line.substring(0, 300));
});
