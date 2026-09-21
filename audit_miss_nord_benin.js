const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

async function main() {
    const campaignId = '615a4a4b-c237-4f3f-9141-c5de824f0927';
    const res = await fetch(`${SUPABASE_URL}/rest/v1/vote_candidates?campaign_id=eq.${campaignId}&select=*&order=number.asc`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    const candidates = await res.json();
    console.log(`Found ${candidates.length} candidates for Miss Nord Bénin:\n`);

    let totalSize = 0;
    for (const c of candidates) {
        if (!c.photo_url) continue;
        try {
            const imgRes = await fetch(c.photo_url, { method: 'HEAD' });
            const size = parseInt(imgRes.headers.get('content-length') || '0', 10);
            totalSize += size;
            console.log(`- N°${c.number || '?'} ${c.name}: ${(size / 1024).toFixed(1)} KB — URL: ${c.photo_url}`);
        } catch (e) {
            console.log(`- N°${c.number || '?'} ${c.name}: Error fetching HEAD — ${c.photo_url}`);
        }
    }
    console.log(`\nTOTAL size for Miss Nord Bénin candidate photos: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
