const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const voteId = '1d3eec9c-b0cf-4055-93f8-b859102bec3e';
const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast?id=eq.${voteId}`;

fetch(url, {
    method: 'GET',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`
    }
})
.then(res => res.json())
.then(data => console.log('Vote status:', data[0].status, 'Transaction ID:', data[0].transaction_id))
.catch(err => console.error(err));
