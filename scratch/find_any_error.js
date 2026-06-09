const fs = require('fs');
const path = require('path');
const file = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\7b16f6db-61f9-4aa7-81d1-1c28715adcb6\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  for (let i = 360; i < 380 && i < lines.length; i++) {
    if (!lines[i]) continue;
    const obj = JSON.parse(lines[i]);
    console.log(`Step ${obj.step_index} (${obj.type}):`, JSON.stringify(obj.content || obj.thinking || '').substring(0, 500));
  }
} else {
  console.log('File does not exist');
}
