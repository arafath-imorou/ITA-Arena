
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchemas() {
    const { data, error } = await supabase.rpc('get_schemas'); // If such a function exists
    if (error) {
        // Fallback: try to query a common table in a different schema if I knew it
        console.error('Error fetching schemas:', error);
    } else {
        console.log('Schemas:', data);
    }
}

// Or try to query information_schema.tables if RPC is not available
async function checkTables() {
    const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_schema, table_name')
        .eq('table_name', 'events');
    
    if (error) {
        console.error('Error fetching tables from info schema:', error);
    } else {
        console.log('Tables found:', data);
    }
}

checkTables();
