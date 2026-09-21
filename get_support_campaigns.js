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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/support_campaigns?select=*&order=created_at.desc`, {
        headers: {
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        }
    });
    const data = await res.json();
    console.log('Support campaigns count:', data.length);
    data.forEach(c => {
        console.log(`- ID: ${c.id}`);
        console.log(`  Title: ${c.title}`);
        console.log(`  Slug: ${c.slug}`);
        console.log(`  Status: ${c.status}`);
        console.log(`  Frame Image: ${c.frame_image}`);
        console.log(`  Created At: ${c.created_at}`);
        console.log('-----------------------------------');
    });
}

main().catch(console.error);
