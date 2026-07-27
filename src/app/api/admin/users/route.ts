import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');

    if (!adminEmail) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: adminUser } = await supabase.from('profiles').select('role').eq('email', adminEmail).single();
    if (!adminUser || (adminUser.role !== 'super_admin' && adminUser.role !== 'admin')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // List users
    const { data: users, error } = await supabase.from('profiles').select('*').in('role', ['super_admin', 'admin', 'organisateur', 'organizer', 'visualiseur']).eq('company_name', 'ITA_ARENA').order('created_at', { ascending: false });
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(users);
}

export async function POST(request: Request) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { adminEmail, email, password, role, fullName } = await request.json();

    if (!adminEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminUser } = await supabase.from('profiles').select('role').eq('email', adminEmail).single();
    if (!adminUser || adminUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized: Only Super Admins can create users' }, { status: 403 });
    }

    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });

    if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // 2. Insert into profiles
    const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: email,
        full_name: fullName || '',
        role: role || 'visualiseur',
        user_type: 'particulier',
        company_name: 'ITA_ARENA'
    });

    if (profileError) {
        // If profile creation fails, we might want to delete the auth user, but for now just return error
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: authData.user });
}

export async function PATCH(request: Request) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { adminEmail, userId, newRole } = await request.json();

    const { data: adminUser } = await supabase.from('profiles').select('role').eq('email', adminEmail).single();
    if (!adminUser || adminUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const adminEmail = searchParams.get('adminEmail');
    const userId = searchParams.get('userId');

    if (!adminEmail || !userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: adminUser } = await supabase.from('profiles').select('role').eq('email', adminEmail).single();
    if (!adminUser || adminUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Delete auth user (cascades to profile)
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
