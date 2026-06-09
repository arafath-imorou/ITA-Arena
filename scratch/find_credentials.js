const fs = require('fs');
const path = require('path');
const bDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain';
const currentId = 'a8e46b6c-7351-4ab2-84aa-6256bd7b4ac9';

fs.readdirSync(bDir).forEach(d => {
  if (d === currentId) return;
  const file = path.join(bDir, d, '.system_generated', 'logs', 'transcript.jsonl');
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('sadathimorou') || content.includes('groupita25')) {
      console.log('--- Match in:', file, '---');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('sadathimorou') || line.includes('groupita25')) {
          console.log(`\nLine ${idx+1}:`);
          for (let i = Math.max(0, idx - 2); i <= Math.min(lines.length - 1, idx + 5); i++) {
            console.log(`[Line ${i+1}]:`, lines[i].substring(0, 300));
          }
        }
      });
    }
  }
});
