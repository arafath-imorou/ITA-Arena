const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0261154f-6dd2-4a30-a822-7717244779c5\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist at', logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Searching in transcript...');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('list_projects') || line.includes('eqqdjqdbbwmshllqesdt')) {
    try {
      const obj = JSON.parse(line);
      // Let's print any steps with step_index between 15 and 35
      if (obj.step_index >= 15 && obj.step_index <= 35) {
        console.log(`\n--- STEP ${obj.step_index} ---`);
        console.log('type:', obj.type);
        console.log('source:', obj.source);
        if (obj.content) console.log('content:', obj.content.substring(0, 300));
        if (obj.tool_calls) console.log('tool_calls:', JSON.stringify(obj.tool_calls));
        if (obj.tool_responses) console.log('tool_responses:', JSON.stringify(obj.tool_responses).substring(0, 1000));
      }
    } catch (e) {
      // Ignored
    }
  }
}
