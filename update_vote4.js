const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const voteId = 'b59bea8f-2ae5-447f-987c-5262b4480109';
const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast?id=eq.${voteId}`;

fetch(url, {
    method: 'PATCH',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        status: 'valid',
        transaction_id: 112408052
    })
})
.then(async res => {
    if (res.ok) console.log('Successfully updated vote ' + voteId + ' to valid.');
    else console.error(await res.text());
})
.catch(err => console.error(err));
