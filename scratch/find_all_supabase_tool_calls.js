const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0261154f-6dd2-4a30-a822-7717244779c5\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist at', logPath);
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Searching all tool calls in transcript...');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  try {
    const obj = JSON.parse(line);
    const lineStr = JSON.stringify(obj);
    
    // Check if it has any tool calls or is from the previous run
    if (lineStr.includes('execute_sql') || lineStr.includes('eqqdjqdbbwmshllqesdt') || lineStr.includes('supabase-mcp-server') || lineStr.includes('update') || lineStr.includes('events')) {
      if (obj.tool_calls && obj.tool_calls.length > 0) {
        console.log(`\n--- STEP ${obj.step_index} (${obj.type}) ---`);
        obj.tool_calls.forEach(tc => {
          console.log(`Tool Call Name: ${tc.name || tc.ToolName || tc.method}`);
          console.log(`Arguments: ${JSON.stringify(tc.arguments || tc.Arguments || tc.params)}`);
        });
        if (obj.tool_responses) {
          console.log('Tool Responses:');
          obj.tool_responses.forEach(tr => {
            console.log(`  Status: ${tr.status}`);
            console.log(`  Response: ${JSON.stringify(tr.content || tr.output).substring(0, 500)}`);
          });
        }
      }
    }
  } catch (e) {
  }
}
