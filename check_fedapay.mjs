import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const idx = line.indexOf('=');
    return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
}));

const fedapayKey = env.FEDAPAY_SECRET_KEY;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const EVENT_ID = '9c1aaf1d-07e8-491b-8e99-938322342f32';

async function generateMissingTickets() {
    console.log("Fetching recent transactions from FedaPay...");
    
    // Fetch last 100 transactions
    const response = await fetch("https://api.fedapay.com/v1/transactions/search?per_page=100", {
        headers: { "Authorization": `Bearer ${fedapayKey}` }
    });

    const data = await response.json();
    const transactions = data['v1/transactions'];
    if (!transactions) {
        console.log("Failed to fetch transactions");
        return;
    }

    const eventTxs = transactions.filter(tx => 
        tx.description && 
        tx.description.toUpperCase().includes('SILLAGE COUTURE')
    );

    console.log(`Found ${eventTxs.length} TOTAL transactions for SILLAGE COUTURE.`);
    
    const validStatuses = ['approved', 'transferred', 'successful', 'success'];
    const validTxs = eventTxs.filter(tx => validStatuses.includes(tx.status));
    console.log(`Found ${validTxs.length} SUCCESSFUL transactions for SILLAGE COUTURE.`);

    for (const tx of validTxs) {
        let email = 'Inconnu';
        let firstname = 'Client';
        let lastname = '';
        let phone = '';

        try {
            const cusRes = await fetch(`https://api.fedapay.com/v1/customers/${tx.customer_id}`, {
                headers: { "Authorization": `Bearer ${fedapayKey}` }
            });
            const cusData = await cusRes.json();
            if (cusData.customer) {
                email = cusData.customer.email || email;
                firstname = cusData.customer.firstname || firstname;
                lastname = cusData.customer.lastname || lastname;
                phone = cusData.customer.phone_number?.number || phone;
            }
        } catch (e) {
            console.log(`Error fetching customer ${tx.customer_id}`);
        }

        const fullName = `${firstname} ${lastname}`.trim();

        const { data: existingTickets, error: checkErr } = await supabase
            .from('tickets')
            .select('*')
            .eq('event_id', EVENT_ID)
            .ilike('user_email', email);
        
        if (checkErr) {
            console.log("Supabase error:", checkErr);
            continue;
        }

        if (existingTickets && existingTickets.length > 0) {
            console.log(`[SKIP] Ticket already exists for ${email}`);
            continue;
        }

        const { data: eventData } = await supabase.from('events').select('tickets').eq('id', EVENT_ID).single();
        let ticketsConfig = [];
        if (eventData && typeof eventData.tickets === 'string') {
            ticketsConfig = JSON.parse(eventData.tickets);
        } else if (eventData && eventData.tickets) {
            ticketsConfig = eventData.tickets;
        }

        let category = 'Standard';
        let price = tx.amount;
        let qty = 1;

        if (ticketsConfig && ticketsConfig.length > 0) {
            const possibleTickets = ticketsConfig.filter(t => t.price <= tx.amount).sort((a, b) => b.price - a.price);
            if (possibleTickets.length > 0) {
                const matched = possibleTickets[0];
                category = matched.name;
                price = matched.price;
                qty = Math.floor(tx.amount / matched.price);
                if (qty === 0) qty = 1;
            }
        }

        console.log(`[CREATE] Generating ${qty}x ${category} for ${fullName} (${email}) - Paid: ${tx.amount}`);

        const ticketsToCreate = [];
        for (let j = 0; j < qty; j++) {
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 10);
            const qrKey = `${timestamp}-${randomStr}-recovered-${tx.id}`;
            const checkoutSessionId = `recovered_${tx.id}_${j}`;

            ticketsToCreate.push({
                event_id: EVENT_ID,
                user_email: email,
                user_phone: phone, 
                user_name: fullName, 
                payment_phone: phone, 
                category: category,
                amount: price,
                qr_code_key: qrKey,
                status: 'valid'
            });
        }

        const { error: insertErr } = await supabase.from('tickets').insert(ticketsToCreate);
        if (insertErr) {
            console.log(`[ERROR] Failed to insert for ${email}:`, insertErr.message);
        } else {
            console.log(`[SUCCESS] Inserted ${qty} tickets for ${email}`);
        }
    }
    
    console.log("Recovery complete.");
}

generateMissingTickets().catch(console.error);
