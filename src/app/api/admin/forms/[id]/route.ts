import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id: formId } = await context.params;
        if (!formId) {
            return NextResponse.json({ error: 'ID de formulaire manquant' }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // 1. Delete associated form fields & submissions if any
        await supabase.from('form_submissions').delete().eq('form_id', formId);
        await supabase.from('form_fields').delete().eq('form_id', formId);

        // 2. Delete form
        const { data, error } = await supabase.from('forms').delete().eq('id', formId).select();
        
        if (error) {
            console.error('Error deleting form:', error);
            return NextResponse.json({ error: error.message || 'Erreur lors de la suppression du formulaire' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('API Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
