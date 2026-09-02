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

        // 1. Verify campaign status and strict end_date deadline
        const { data: campaign, error: cErr } = await supabase
            .from('votes_campaigns')
            .select('status, end_date, title')
            .eq('id', campaign_id)
            .single();

        if (cErr || !campaign) {
            return NextResponse.json({ error: 'Campagne de vote introuvable' }, { status: 404 });
        }

        if (campaign.status !== 'active') {
            return NextResponse.json({ error: 'Cette campagne de vote est actuellement inactive ou fermée.' }, { status: 400 });
        }

        if (campaign.end_date && new Date() > new Date(campaign.end_date)) {
            // Automatically mark campaign as closed in database if end_date has passed
            await supabase.from('votes_campaigns').update({ status: 'closed' }).eq('id', campaign_id);
            return NextResponse.json({ 
                error: `La période de vote pour "${campaign.title}" est officiellement terminée. Les votes ne sont plus acceptés.` 
            }, { status: 400 });
        }

        // 2. Insert pending vote record
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
