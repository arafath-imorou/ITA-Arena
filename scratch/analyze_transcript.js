const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0261154f-6dd2-4a30-a822-7717244779c5\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist at', logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n').filter(Boolean);

console.log('Total lines in transcript:', lines.length);
if (lines.length > 0) {
  console.log('First line index:', JSON.parse(lines[0]).step_index);
  console.log('Last line index:', JSON.parse(lines[lines.length - 1]).step_index);
  
  // Find a line that has tool_calls and print its keys
  for (let i = 0; i < lines.length; i++) {
    const obj = JSON.parse(lines[i]);
    if (obj.tool_calls && obj.tool_calls.length > 0) {
      console.log(`\nTool call keys in Step ${obj.step_index}:`, Object.keys(obj.tool_calls[0]));
      console.log('Tool call object:', JSON.stringify(obj.tool_calls[0], null, 2));
      break;
    }
  }
}
