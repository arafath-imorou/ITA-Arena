const fs = require('fs');

const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast?id=not.is.null`;

fetch(url, {
    method: 'DELETE',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`
    }
})
.then(async res => {
    if (res.ok) {
        console.log('Successfully deleted all votes. Counters are reset.');
    } else {
        const text = await res.text();
        console.error('Failed to delete:', text);
    }
})
.catch(err => console.error(err));
