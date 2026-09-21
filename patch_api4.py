import os

filepath = 'src/app/api/admin/users/route.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_patch = """export async function PATCH(request: Request) {
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
}"""

new_patch = """export async function PATCH(request: Request) {
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
}"""

content = content.replace(old_patch, new_patch)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated PATCH in route.ts')
