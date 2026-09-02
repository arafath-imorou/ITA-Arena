import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: eventId } = await context.params;
        if (!eventId) {
            return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Supprimer d'abord les tickets liés
        const { error: ticketsError } = await supabase.from('tickets').delete().eq('event_id', eventId);
        if (ticketsError) {
            console.error('Error deleting tickets:', ticketsError);
            return NextResponse.json({ error: 'Erreur lors de la suppression des tickets liés' }, { status: 500 });
        }

        // Supprimer l'événement
        const { data, error } = await supabase.from('events').delete().eq('id', eventId).select();
        
        if (error) {
            console.error('Error deleting event:', error);
            return NextResponse.json({ error: 'Erreur lors de la suppression de l\'événement' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: eventId } = await context.params;
        if (!eventId) {
            return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
        }

        const body = await request.json();
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data, error } = await supabase.from('events').update(body).eq('id', eventId).select();
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
        const { id: eventId } = await context.params;
        if (!eventId) {
            return NextResponse.json({ error: 'Missing event ID' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: eventData, error: eErr } = await supabase
            .from('events')
            .select('*, organizer:profiles(full_name, email, phone)')
            .eq('id', eventId)
            .single();

        if (eErr) throw eErr;

        const { data: ticketsData, error: tErr } = await supabase
            .from('tickets')
            .select('*')
            .eq('event_id', eventId)
            .eq('status', 'valid')
            .order('created_at', { ascending: false });

        if (tErr) throw tErr;

        return NextResponse.json({
            event: eventData,
            tickets: ticketsData || []
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
            }
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
