import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(envFile.split('\n').filter(line => line && !line.startsWith('#')).map(line => {
    const idx = line.indexOf('=');
    return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
}));

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const EVENT_ID = '9c1aaf1d-07e8-491b-8e99-938322342f32';

import crypto from 'crypto';

async function fixTickets() {
    // 1. Delete incorrect tickets I generated
    const { error: delErr } = await supabase
        .from('tickets')
        .delete()
        .eq('event_id', EVENT_ID)
        .in('user_email', ['Fridaosi@yahoo.fr', 'dlorougnon@laborex-healthcare.com', 'Inconnu']);
    
    if (delErr) {
        console.log("Delete error:", delErr);
    } else {
        console.log("Deleted old incorrect tickets");
    }

    const ticketsToCreate = [];

    // --- Desiree LOROUGNON ---
    const desEmail = 'dlorougnon@laborex-healthcare.com';
    const desName = 'Desiree LOROUGNON';
    const desPhone = '2290195618890';
    for (let i = 0; i < 3; i++) {
        ticketsToCreate.push({
            event_id: EVENT_ID,
            user_email: desEmail,
            user_phone: desPhone,
            user_name: desName,
            payment_phone: desPhone,
            category: 'LA BUSINESS CLASS',
            amount: 70000,
            qr_code_key: `recovered-Desiree-${Date.now()}-${i}`,
            status: 'valid',
            checkout_session_id: crypto.randomUUID()
        });
    }

    // --- Frida Frida ---
    const fridaEmail = 'Fridaosi@yahoo.fr';
    const fridaName = 'Frida Frida';
    const fridaPhone = '2290167535858';
    for (let i = 0; i < 2; i++) {
        ticketsToCreate.push({
            event_id: EVENT_ID,
            user_email: fridaEmail,
            user_phone: fridaPhone,
            user_name: fridaName,
            payment_phone: fridaPhone,
            category: 'LA BUSINESS CLASS',
            amount: 70000,
            qr_code_key: `recovered-Frida-${Date.now()}-${i}`,
            status: 'valid',
            checkout_session_id: crypto.randomUUID()
        });
    }

    const { error: insErr } = await supabase.from('tickets').insert(ticketsToCreate);
    if (insErr) {
        console.log("Insert error:", insErr);
    } else {
        console.log("Successfully inserted 5 correct tickets!");
    }
}

fixTickets().catch(console.error);
