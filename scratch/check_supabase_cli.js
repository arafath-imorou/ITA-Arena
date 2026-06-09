const fs = require('fs');
const path = require('path');

const homeDir = 'C:\\Users\\HP';
const supabaseDir = path.join(homeDir, '.supabase');

if (fs.existsSync(supabaseDir)) {
  console.log('.supabase directory exists!');
  try {
    const files = fs.readdirSync(supabaseDir);
    console.log('Files inside .supabase:', files);
    
    // Look inside any subdirectories or config files
    files.forEach(file => {
      const fullPath = path.join(supabaseDir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        console.log(`File: ${file}`);
        if (file.endsWith('.toml') || file.endsWith('.json') || file.endsWith('.ini')) {
          console.log(fs.readFileSync(fullPath, 'utf8').substring(0, 1000));
        }
      } else if (stat.isDirectory()) {
        console.log(`Dir: ${file}`);
        try {
          console.log(`  Files in ${file}:`, fs.readdirSync(fullPath));
        } catch(e) {}
      }
    });
  } catch (e) {
    console.error(e);
  }
} else {
  console.log('.supabase directory does not exist.');
}
