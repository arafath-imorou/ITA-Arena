const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: 'storage' } });

async function main() {
  console.log('Querying storage buckets...');
  const { data, error } = await supabase.from('buckets').select('*');
  console.log('buckets:', data, error);
}

main().catch(console.error);
