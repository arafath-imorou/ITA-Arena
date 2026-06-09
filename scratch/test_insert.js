const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing insert into support_campaigns...');
  
  const slug = 'test-campaign-' + Date.now();
  const { data, error } = await supabase
    .from('support_campaigns')
    .insert({
      title: 'Campagne de test',
      slug: slug,
      description: 'Ceci est une description de test',
      category: 'Sensibilisation',
      frame_image: 'https://ampktfwcpopkomrsckjm.supabase.co/storage/v1/object/public/campaign_frames/test.png',
      status: 'active'
    })
    .select();

  if (error) {
    console.error('Insert failed:', error);
  } else {
    console.log('Insert succeeded!', data);
    
    // Clean up
    console.log('Cleaning up...');
    const { error: delError } = await supabase
      .from('support_campaigns')
      .delete()
      .eq('slug', slug);
    console.log('Cleanup status:', delError ? delError : 'Success');
  }
}

main().catch(console.error);
