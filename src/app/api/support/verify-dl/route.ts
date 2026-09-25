import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const { dl } = await request.json();
        
        if (!dl) {
            return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { data, error } = await supabase
            .from('support_participations')
            .select('*')
            .eq('id', dl)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
        }
        
        if (data.statut_paiement !== 'SUCCESS') {
            return NextResponse.json({ error: 'Payment not successful' }, { status: 403 });
        }

        const currentCount = data.recovery_count || 0;
        
        if (currentCount >= 2) {
            return NextResponse.json({ error: 'EXPIRED' }, { status: 403 });
        }

        // Increment the count
        await supabase
            .from('support_participations')
            .update({ recovery_count: currentCount + 1 })
            .eq('id', dl);

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
