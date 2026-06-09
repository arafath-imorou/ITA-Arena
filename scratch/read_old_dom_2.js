const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\a458e20d-ff57-44f6-95d0-399e03f6ed9c\\.tempmediaStorage\\dom_1777166047347.txt';

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
