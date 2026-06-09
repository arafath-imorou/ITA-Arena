const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing list buckets...');
  const { data: buckets, error: bError } = await supabase.storage.listBuckets();
  console.log('listBuckets:', { data: buckets, error: bError });

  console.log('Testing getBucket...');
  const { data: bucket, error: getError } = await supabase.storage.getBucket('campaign_frames');
  console.log('getBucket campaign_frames:', { data: bucket, error: getError });
}

main().catch(console.error);
