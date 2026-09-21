const fs = require('fs');
const env = {};
const lines = fs.readFileSync('.env.local', 'utf-8').split('\n');
for (const line of lines) {
    if (line.includes('=')) {
        const parts = line.split('=');
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
}

fetch('https://api.fedapay.com/v1/transactions/112409701', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${env['FEDAPAY_SECRET_KEY']}`,
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log(JSON.stringify(data, null, 2));
})
.catch(err => console.error(err));
