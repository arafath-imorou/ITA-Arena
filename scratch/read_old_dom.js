const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\173dd927-c207-4423-ba0d-e0a74b955597\\.tempmediaStorage\\dom_1778209221259.txt';

if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  console.log('Lines 150 to 220:');
  for (let i = 149; i < Math.min(220, lines.length); i++) {
    console.log(`${i + 1}: ${lines[i].trim()}`);
  }
} else {
  console.log('File does not exist');
}
