import fs from 'fs';

async function run() {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    const env = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }));

    const fedapayKey = env.FEDAPAY_SECRET_KEY;
    
    console.log("Fetching FedaPay transactions...");
    const response = await fetch("https://api.fedapay.com/v1/transactions/search", {
        headers: {
            "Authorization": `Bearer ${fedapayKey}`
        }
    });

    const data = await response.json();
    if (data.v1_transactions) {
        console.log(`Found ${data.v1_transactions.length} approved transactions.`);
        for (const tx of data.v1_transactions.slice(0, 5)) {
            console.log(`TX: ${tx.id} - ${tx.amount} CFA - ${tx.description}`);
            console.log("Customer ID:", tx.customer_id);
            console.log("Metadata:", JSON.stringify(tx.metadata, null, 2));
            console.log("Custom Metadata:", JSON.stringify(tx.custom_metadata, null, 2));
        }
    } else {
        console.log("Response:", data);
    }
}
run().catch(console.error);
