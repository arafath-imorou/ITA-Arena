import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: campaignId } = await context.params;
        if (!campaignId) {
            return NextResponse.json({ error: 'Missing campaign ID' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: votesData, error } = await supabase
            .from('votes_cast')
            .select('candidate_id, vote_count')
            .eq('campaign_id', campaignId)
            .eq('status', 'valid');

        if (error) {
            console.error('Error fetching vote stats:', error);
            return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 });
        }

        return NextResponse.json(votesData || [], {
            headers: {
                'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10'
            }
        });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
