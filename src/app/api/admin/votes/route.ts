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

        // 2. Paginated fetch to retrieve 100% of all valid votes_cast rows (bypassing 1000 row PostgREST limit)
        let validVotes: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error: vErr } = await supabase
                .from('votes_cast')
                .select('campaign_id, vote_count, amount_paid')
                .eq('status', 'valid')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (vErr) throw vErr;

            if (pageData && pageData.length > 0) {
                validVotes = validVotes.concat(pageData);
                if (pageData.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }

        // 3. Compute exact totals per campaign
        const votesWithStats = (campaigns || []).map(camp => {
            const campVotes = validVotes.filter(v => v.campaign_id === camp.id);
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
