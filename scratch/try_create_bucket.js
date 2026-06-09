const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Trying to create bucket campaign_frames...');
  const { data, error } = await supabase.storage.createBucket('campaign_frames', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/png']
  });
  console.log('Result:', { data, error });
}

main().catch(console.error);
