const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseKey);

async function generateCampaign() {
    const email = 'orga_test_' + Date.now() + '@example.com';
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password: 'password123' });
    if(signUpErr) { console.log('Signup err:', signUpErr.message); return; }

    const userId = signUpData.user.id;
    console.log('User created:', userId);

    // 1. Upload a dummy frame
    const dummyImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="; 
    const buffer = Buffer.from(dummyImageBase64, 'base64');
    
    const fileName = `${userId}/dummy_frame.png`;
    const { error: uploadError } = await supabase.storage.from('campaign_frames').upload(fileName, buffer, { contentType: 'image/png' });
    if (uploadError) { console.log('Upload err:', uploadError.message); return; }

    const { data: publicUrlData } = supabase.storage.from('campaign_frames').getPublicUrl(fileName);
    const frameImageUrl = publicUrlData.publicUrl;

    const slug = 'test-campaign-' + Date.now();

    const { data: campaignData, error: insertError } = await supabase
        .from('support_campaigns')
        .insert({
            title: "Campagne Test Automatique",
            slug: slug,
            description: "Ceci est une campagne générée automatiquement pour tester le fonctionnement du système.",
            category: "Evénement",
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
