const fs = require('fs');
const path = require('path');

const tasksDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0261154f-6dd2-4a30-a822-7717244779c5\\.system_generated\\tasks';

if (fs.existsSync(tasksDir)) {
  const files = fs.readdirSync(tasksDir);
  console.log('Task files:', files);
  files.forEach(file => {
    if (file.endsWith('.log')) {
      const fullPath = path.join(tasksDir, file);
      console.log(`\n--- Log File: ${file} ---`);
      console.log(fs.readFileSync(fullPath, 'utf8'));
    }
  });
} else {
  console.log('Tasks directory does not exist at', tasksDir);
  // Let's check other directories in the brain
  const brainDir = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\0261154f-6dd2-4a30-a822-7717244779c5';
  if (fs.existsSync(brainDir)) {
    console.log('Brain files:', fs.readdirSync(brainDir));
    // Check if there is a .system_generated folder
    const sgDir = path.join(brainDir, '.system_generated');
    if (fs.existsSync(sgDir)) {
      console.log('.system_generated files:', fs.readdirSync(sgDir));
    }
  }
}
