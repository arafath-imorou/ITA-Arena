const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing events_with_stats...');
  const res1 = await supabase.from('events_with_stats').select('*');
  console.log('Events with stats error:', res1.error);
  console.log('Events with stats length:', res1.data?.length);
  if (res1.data && res1.data.length > 0) {
    res1.data.forEach((e, idx) => {
      console.log(`[Event ${idx + 1}] ID: ${e.id} | Title: ${e.title} | Type: ${e.type} | Date: ${e.date} | Location: ${e.location}`);
    });
  }
}

main().catch(console.error);
