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
        
        let allVotes: any[] = [];
        let page = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data: pageData, error } = await supabase
                .from('votes_cast')
                .select('candidate_id, vote_count')
                .eq('campaign_id', campaignId)
                .eq('status', 'valid')
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) {
                console.error('Error fetching vote stats chunk:', error);
                break;
            }

            if (pageData && pageData.length > 0) {
                allVotes = allVotes.concat(pageData);
                if (pageData.length < pageSize) {
                    hasMore = false;
                } else {
                    page++;
                }
            } else {
                hasMore = false;
            }
        }

        return NextResponse.json(allVotes, {
            headers: {
                'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=10'
            }
        });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
