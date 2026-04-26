
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEvents() {
    const { data: events, error } = await supabase
        .from('events')
        .select('*');

    if (error) {
        console.error('Error fetching events:', error);
        return;
    }

    console.log('--- ALL EVENTS ---');
    events.forEach(e => {
        console.log(`ID: ${e.id} | Title: ${e.title} | Type: ${e.type} | Published: ${e.is_published} | Country: ${e.country}`);
    });
}

checkEvents();
