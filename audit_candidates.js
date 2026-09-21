const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

// List all candidates from the database and see their photo_url
fetch(`${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/vote_candidates?select=id,name,photo_url&order=name.asc`, {
    method: 'GET',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`
    }
})
.then(res => res.json())
.then(data => {
    console.log('All candidates and their photo_url:');
    data.forEach(c => {
        console.log(`  ${c.name}: ${c.photo_url}`);
    });
})
.catch(err => console.error(err));
