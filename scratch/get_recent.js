const fs = require('fs');
const logFile = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\a8e46b6c-7351-4ab2-84aa-6256bd7b4ac9\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
lines.slice(-60).forEach(l => {
  try {
    const j = JSON.parse(l);
    if (j.type === 'PLANNER_RESPONSE' || j.type === 'USER_INPUT') {
      if (j.content) console.log(`[${j.type}]:\n${j.content.substring(0, 500)}\n`);
      if (j.thinking) console.log(`[THINKING]:\n${j.thinking.substring(0, 500)}\n`);
    }
  } catch (e) {}
});
