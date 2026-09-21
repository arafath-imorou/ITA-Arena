const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}
const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast?select=*`;
fetch(url, {
    method: 'GET',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`
    }
})
.then(res => res.json())
.then(data => console.log('Total votes in DB:', data.length))
.catch(err => console.error(err));
