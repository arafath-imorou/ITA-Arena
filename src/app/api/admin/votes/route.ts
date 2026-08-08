import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
    try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: votesData, error } = await supabase
            .from('votes_campaigns')
            .select('*, votes_cast(status, vote_count, amount_paid)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        return NextResponse.json(votesData || []);
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
