const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateCampaign() {
    const email = 'orga_test_' + Date.now() + '@example.com';
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password: 'password123' });
    if(signUpErr) { console.log('Signup err:', signUpErr.message); return; }
    
    const userId = signUpData.user.id;
    
    const buffer = fs.readFileSync('scratch/polio_transparent.png');
    
    const fileName = `${userId}/polio_frame_${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage.from('campaign_frames').upload(fileName, buffer, { contentType: 'image/png' });
    if (uploadError) { console.log('Upload err:', uploadError.message); return; }
    
    const { data: publicUrlData } = supabase.storage.from('campaign_frames').getPublicUrl(fileName);
    const frameImageUrl = publicUrlData.publicUrl;
    
    const slug = 'campagne-vaccination-polio-' + Math.floor(Math.random() * 1000);
    
    const { data: campaignData, error: insertError } = await supabase
        .from('support_campaigns')
        .insert({
            title: "Campagne de Vaccination contre la Poliomyélite",
            slug: slug,
            description: "Je soutiens la campagne de vaccination contre la poliomyélite ! Protégeons nos enfants, construisons leur avenir. Le vaccin est sûr, efficace et gratuit.",
            category: "Santé",
            frame_image: frameImageUrl,
            allow_download: true,
            allow_share: true,
            show_counter: true,
            show_logo: true,
            created_by: userId,
            status: 'active'
        })
        .select()
        .single();
        
    if (insertError) {
        console.log('Insert err:', insertError.message);
    } else {
        console.log('Campaign created! Slug:', slug);
    }
}

generateCampaign();
