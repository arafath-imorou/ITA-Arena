const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing support_campaigns query...');
  const { data: cData, error: cError } = await supabase.from('support_campaigns').select('*').limit(1);
  console.log('support_campaigns query status:', { error: cError, dataLength: cData?.length });

  console.log('Testing storage list...');
  const { data: sData, error: sError } = await supabase.storage.from('campaign_frames').list();
  console.log('storage list status:', { error: sError, dataLength: sData?.length });
}

main().catch(console.error);
