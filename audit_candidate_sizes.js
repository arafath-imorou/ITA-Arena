const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

// List all files in vote_uploads/candidates subfolder
fetch(`${env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/object/list/vote_uploads`, {
    method: 'POST',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ limit: 100, offset: 0, prefix: 'candidates/' })
})
.then(res => res.json())
.then(data => {
    console.log('Files in vote_uploads/candidates/:');
    let totalBytes = 0;
    if (Array.isArray(data)) {
        data.forEach(f => {
            const sizeKb = f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) : 'unknown';
            const sizeMb = f.metadata?.size ? (f.metadata.size / 1048576).toFixed(2) : 'unknown';
            totalBytes += f.metadata?.size || 0;
            console.log(`  ${f.name} — ${sizeKb} KB (${sizeMb} MB) — ${f.metadata?.mimetype || 'unknown'}`);
        });
        console.log(`\nTOTAL: ${(totalBytes / 1048576).toFixed(2)} MB across ${data.length} files`);
        console.log(`Average per file: ${(totalBytes / data.length / 1024).toFixed(0)} KB`);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
})
.catch(err => console.error(err));
