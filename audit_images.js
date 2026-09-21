const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

// List all files in the candidates storage bucket
fetch(`${env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/object/list/vote-candidates`, {
    method: 'POST',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ limit: 100, offset: 0, prefix: '' })
})
.then(res => res.json())
.then(data => {
    if (data.error) {
        console.log('Error listing vote-candidates bucket:', data.error);
        return;
    }
    console.log('Files in vote-candidates bucket:');
    if (Array.isArray(data)) {
        data.forEach(f => {
            console.log(`  ${f.name} — size: ${f.metadata?.size || 'unknown'} — type: ${f.metadata?.mimetype || 'unknown'}`);
        });
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
})
.catch(err => console.error(err));
