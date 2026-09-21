const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast?id=eq.04eb2b9e-17b7-452d-97e7-9f5ba1373a20`;

fetch(url, {
    method: 'GET',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`
    }
})
.then(res => res.json())
.then(data => console.log('Vote:', JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
