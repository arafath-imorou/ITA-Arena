import os
import re

filepath = 'src/app/api/admin/users/route.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_post = """export async function POST(request: Request) {
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
    const { error: profileError } = await supabase.from('profiles').upsert({
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
}"""

new_post = """export async function POST(request: Request) {
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
                return NextResponse.json({ error: 'L\\'utilisateur existe déjà mais son profil est introuvable.' }, { status: 500 });
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
}"""

content = content.replace(old_post, new_post)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated POST route to handle existing users')
