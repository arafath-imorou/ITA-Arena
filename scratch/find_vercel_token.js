const fs = require('fs');
const path = require('path');

// Search for vercel token or config
const homeDir = 'C:\\Users\\HP';
const possiblePaths = [
  path.join(homeDir, '.vercel', 'credentials.json'),
  path.join(homeDir, '.config', 'vercel', 'credentials.json'),
  path.join(homeDir, '.config', 'vercel', 'auth.json'),
  path.join(homeDir, 'AppData', 'Roaming', 'vercel', 'credentials.json'),
  path.join(homeDir, 'AppData', 'Local', 'vercel', 'credentials.json'),
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    console.log('Found:', p);
    console.log(fs.readFileSync(p, 'utf8').substring(0, 500));
  } else {
    console.log('Not found:', p);
  }
}

// Also check for npm global config
const npmrc = path.join(homeDir, '.npmrc');
if (fs.existsSync(npmrc)) {
  console.log('\n.npmrc contents:');
  console.log(fs.readFileSync(npmrc, 'utf8'));
}
