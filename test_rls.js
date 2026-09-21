const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

// Fetch using anon key (simulating visitor)
const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast?campaign_id=eq.ade08110-7e64-4d4a-844e-284fadefd4f4&status=eq.valid`;

fetch(url, {
    method: 'GET',
    headers: {
        'apikey': env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
        'Authorization': `Bearer ${env['NEXT_PUBLIC_SUPABASE_ANON_KEY']}`
    }
})
.then(res => res.json())
.then(data => console.log('Visitor votes:', data))
.catch(err => console.error(err));
