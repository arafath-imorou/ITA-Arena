import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: campaignId } = await context.params;
        if (!campaignId) {
            return NextResponse.json({ error: 'ID de campagne manquant' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Delete associated support_participations
        await supabase.from('support_participations').delete().eq('campaign_id', campaignId);

        // 2. Delete campaign
        const { data, error } = await supabase.from('support_campaigns').delete().eq('id', campaignId).select();
        
        if (error) {
            console.error('Error deleting support campaign:', error);
            return NextResponse.json({ error: error.message || 'Erreur lors de la suppression de la campagne' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
