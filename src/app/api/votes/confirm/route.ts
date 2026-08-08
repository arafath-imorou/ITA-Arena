import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { vote_id, transaction_id } = await request.json();

        if (!vote_id) {
            return NextResponse.json({ error: 'Missing vote_id' }, { status: 400 });
        }

        const { data: updatedVote, error } = await supabase.from('votes_cast')
            .update({
                transaction_id: transaction_id,
                status: 'valid'
            })
            .eq('id', vote_id)
            .select()
            .single();

        if (error) {
            console.error('Update vote error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, updatedVote });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
