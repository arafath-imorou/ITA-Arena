import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { campaign_id, candidate_id, voter_email, voter_phone, vote_count, amount_paid } = await request.json();

        if (!campaign_id || !candidate_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: pendingVote, error } = await supabase.from('votes_cast').insert({
            campaign_id,
            candidate_id,
            voter_email,
            voter_phone,
            vote_count,
            amount_paid,
            transaction_id: null,
            status: 'pending'
        }).select().single();

        if (error) {
            console.error('Insert vote error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ pendingVote });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
