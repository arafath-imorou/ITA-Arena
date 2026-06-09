const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
};

const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

console.log('Supabase URL:', supabaseUrl);

async function main() {
  const url = `${supabaseUrl}/rest/v1/events?select=*&order=created_at.asc`;
  const response = await fetch(url, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });

  if (!response.ok) {
    console.error('Error fetching events:', response.status, await response.text());
    return;
  }

  const events = await response.json();
  console.log('Events in chronological order:');
  events.forEach((event, index) => {
    console.log(`\n[Event ${index + 1}]`);
    console.log('ID:', event.id);
    console.log('Title:', event.title);
    console.log('Description:', event.description);
    console.log('Date:', event.date);
    console.log('Time:', event.time);
    console.log('Location:', event.location);
    console.log('Created At:', event.created_at);
  });
}

main().catch(console.error);
