const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseKey = 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestEvent() {
    const email = 'orga_test_' + Date.now() + '@example.com';
    const { data: signUpData } = await supabase.auth.signUp({ email, password: 'password123' });
    const userId = signUpData.user.id;
    
    const eventData = {
        title: "Campagne de Vaccination Polio",
        category_id: "847bc07d-73d0-4194-ac11-4d645f7fb499", // Sport & Bien-être
        description: "Je soutiens la campagne de vaccination contre la poliomyélite ! Le vaccin est sûr, efficace et gratuit. Il protège nos enfants contre la paralysie.",
        location: "Tous les départements (Alibori, Atacora, Borgou, Collines, Donga, Plateau)",
        date: "Du 12 au 15 Juin 2026",
        time: "08:00",
        price: "Gratuit",
        image_url: "/events/POLIO CAMPAGNE SOUTIEN.jpg",
        type: "event",
        organizer_id: userId,
        country: "Bénin",
        is_published: true,
        ticket_categories: [
            { id: 1, name: "Participation Libre", price: "0", stock: "1000", description: "Accès gratuit pour faire vacciner vos enfants" }
        ]
    };
    
    const { data, error } = await supabase.from('events').insert([eventData]).select();
    if (error) {
        console.error("Error creating test event:", error);
    } else {
        console.log("Test event created successfully:", data[0].title);
    }
}
createTestEvent();
