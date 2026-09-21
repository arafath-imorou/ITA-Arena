const fs = require('fs');

const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

const url = `${env['NEXT_PUBLIC_SUPABASE_URL']}/rest/v1/votes_cast`;

const missingVotes = [
  {
    candidate_id: '2cfe8387-e4b7-4cd2-a669-b6dbf7cf071a',
    campaign_id: 'ade08110-7e64-4d4a-844e-284fadefd4f4',
    vote_count: 5,
    amount_paid: 500,
    voter_email: 'judicaelfroid@gmail.com',
    status: 'valid'
  },
  {
    candidate_id: '9dad5eb9-134a-4b60-b858-0ad65e40fa68',
    campaign_id: 'ade08110-7e64-4d4a-844e-284fadefd4f4',
    vote_count: 1,
    amount_paid: 100,
    voter_email: 'boukenarsaire@gmail.com',
    status: 'valid'
  },
  {
    candidate_id: '9dad5eb9-134a-4b60-b858-0ad65e40fa68',
    campaign_id: 'ade08110-7e64-4d4a-844e-284fadefd4f4',
    vote_count: 1,
    amount_paid: 100,
    voter_email: 'anonyme@itaarena.com',
    status: 'valid'
  },
  {
    candidate_id: '2cfe8387-e4b7-4cd2-a669-b6dbf7cf071a',
    campaign_id: 'ade08110-7e64-4d4a-844e-284fadefd4f4',
    vote_count: 50,
    amount_paid: 5000,
    voter_email: 'anonyme@itaarena.com',
    status: 'valid'
  }
];

fetch(url, {
    method: 'POST',
    headers: {
        'apikey': env['SUPABASE_SERVICE_ROLE_KEY'],
        'Authorization': `Bearer ${env['SUPABASE_SERVICE_ROLE_KEY']}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },
    body: JSON.stringify(missingVotes)
})
.then(res => res.json())
.then(data => console.log('Inserted missing votes:', data.length))
.catch(err => console.error(err));
