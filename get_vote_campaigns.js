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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/votes_campaigns?select=*&order=created_at.desc&limit=5`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    const data = await res.json();
    console.log('Vote campaigns count:', data.length);
    for (const c of data) {
        console.log(`- ID: ${c.id}`);
        console.log(`  Title: ${c.title}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Created At: ${c.created_at}`);

        // Fetch candidates
        const candsRes = await fetch(`${SUPABASE_URL}/rest/v1/vote_candidates?campaign_id=eq.${c.id}&select=*&order=number.asc`, {
            headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
        });
        const cands = await candsRes.json();
        console.log(`  Candidates (${cands.length}):`);
        cands.slice(0, 5).forEach(cand => {
            console.log(`    * [N°${cand.number}] ${cand.name} (ID: ${cand.id})`);
        });
        console.log('-----------------------------------');
    }
}

main().catch(console.error);
