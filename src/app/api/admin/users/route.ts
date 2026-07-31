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
    let userId;
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true
    });

    if (authError) {
        if (authError.message.includes('already been registered') || authError.status === 422) {
            // User already exists. Fetch their profile ID.
            const { data: existingProfile } = await supabase.from('profiles').select('id').eq('email', email).single();
            if (existingProfile) {
                userId = existingProfile.id;
            } else {
                return NextResponse.json({ error: 'L\'utilisateur existe déjà mais son profil est introuvable.' }, { status: 500 });
            }
        } else {
            return NextResponse.json({ error: authError.message }, { status: 500 });
        }
    } else {
        userId = authData.user.id;
    }

    // 2. Insert or update into profiles
    const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        full_name: fullName || '',
        role: role || 'visualiseur',
        user_type: 'particulier',
        company_name: 'ITA_ARENA'
    });

    if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: { id: userId, email: email } });
}

export async function PATCH(request: Request) {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { adminEmail, userId, newRole, newPassword } = await request.json();

    const { data: adminUser } = await supabase.from('profiles').select('role').eq('email', adminEmail).single();
    if (!adminUser || adminUser.role !== 'super_admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (newPassword) {
        const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, message: 'Mot de passe mis à jour' });
    }

    if (newRole) {
        const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, message: 'Rôle mis à jour' });
    }

    return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
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
