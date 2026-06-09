const fs = require('fs');
const path = require('path');
const file = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\7b16f6db-61f9-4aa7-81d1-1c28715adcb6\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(file)) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line) => {
    if (!line) return;
    const obj = JSON.parse(line);
    if (obj.step_index >= 106 && obj.step_index <= 125) {
      const val = obj.content || obj.thinking || obj.tool_calls || '';
      const text = typeof val === 'object' ? JSON.stringify(val) : String(val);
      console.log(`Step ${obj.step_index} (${obj.type}):`, text.substring(0, 300));
    }
  });
} else {
  console.log('File does not exist');
}
