const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Testing upload to campaign_frames...');
  
  // Create a small dummy file or buffer
  const fileBuffer = Buffer.from('hello world from test_upload');
  
  // Try uploading it
  const { data, error } = await supabase.storage
    .from('campaign_frames')
    .upload('test_folder/test_file.txt', fileBuffer, {
      contentType: 'text/plain',
      upsert: true
    });

  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload succeeded!', data);
  }
}

main().catch(console.error);
