import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: voteId } = await context.params;
        if (!voteId) {
            return NextResponse.json({ error: 'ID de campagne manquant' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Delete associated votes_cast
        await supabase.from('votes_cast').delete().eq('campaign_id', voteId);

        // 2. Delete candidates
        await supabase.from('vote_candidates').delete().eq('campaign_id', voteId);

        // 3. Delete campaign
        const { data, error } = await supabase.from('votes_campaigns').delete().eq('id', voteId).select();
        
        if (error) {
            console.error('Error deleting vote campaign:', error);
            return NextResponse.json({ error: error.message || 'Erreur lors de la suppression de la campagne' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: voteId } = await context.params;
        if (!voteId) {
            return NextResponse.json({ error: 'ID de campagne manquant' }, { status: 400 });
        }

        const body = await request.json();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data, error } = await supabase.from('votes_campaigns').update(body).eq('id', voteId).select();
        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: voteId } = await context.params;
        if (!voteId) {
            return NextResponse.json({ error: 'ID de campagne manquant' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: campaign, error: cErr } = await supabase.from('votes_campaigns').select('*').eq('id', voteId).single();
        if (cErr) throw cErr;

        const { data: candidates, error: candErr } = await supabase.from('vote_candidates').select('*').eq('campaign_id', voteId);
        if (candErr) throw candErr;

        const { data: votes, error: vErr } = await supabase.from('votes_cast').select('*').eq('campaign_id', voteId).eq('status', 'valid').order('created_at', { ascending: false });
        if (vErr) throw vErr;

        return NextResponse.json({ campaign, candidates: candidates || [], votes: votes || [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
