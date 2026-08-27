import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Fetch all vote campaigns
        const { data: campaigns, error: cErr } = await supabase
            .from('votes_campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (cErr) throw cErr;

        // 2. Fetch all valid votes cast directly (bypassing PostgREST embedded relation limits)
        const { data: validVotes, error: vErr } = await supabase
            .from('votes_cast')
            .select('campaign_id, vote_count, amount_paid')
            .eq('status', 'valid');

        if (vErr) throw vErr;

        // 3. Compute exact totals per campaign
        const votesWithStats = (campaigns || []).map(camp => {
            const campVotes = (validVotes || []).filter(v => v.campaign_id === camp.id);
            const totalVotes = campVotes.reduce((sum, v) => sum + (Number(v.vote_count) || 1), 0);
            const totalRevenue = campVotes.reduce((sum, v) => sum + (Number(v.amount_paid) || 0), 0);
            
            return {
                ...camp,
                votes_cast: campVotes,
                computedTotalVotes: totalVotes,
                computedTotalRevenue: totalRevenue
            };
        });

        return NextResponse.json(votesWithStats, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
