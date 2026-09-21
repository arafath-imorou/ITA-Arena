const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const buckets = ['vote_uploads', 'event-images', 'products', 'students'];

async function listFiles(bucket) {
    const res = await fetch(`${env['NEXT_PUBLIC_SUPABASE_URL']}/storage/v1/object/list/${bucket}`, {
        method: 'POST',
        headers: {
            'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
            'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ limit: 100, offset: 0, prefix: '' })
    });
    const data = await res.json();
    console.log(`\n=== Bucket: ${bucket} ===`);
    if (Array.isArray(data)) {
        let total = 0;
        data.forEach(f => {
            const sizeKb = f.metadata?.size ? (f.metadata.size / 1024).toFixed(1) : 'unknown';
            const sizeMb = f.metadata?.size ? (f.metadata.size / 1048576).toFixed(2) : 'unknown';
            total += f.metadata?.size || 0;
            console.log(`  ${f.name} — ${sizeKb} KB (${sizeMb} MB) — ${f.metadata?.mimetype || 'unknown'}`);
        });
        console.log(`  TOTAL in ${bucket}: ${(total / 1048576).toFixed(2)} MB for ${data.length} files`);
    } else {
        console.log(JSON.stringify(data, null, 2));
    }
}

(async () => {
    for (const b of buckets) {
        await listFiles(b);
    }
})();
