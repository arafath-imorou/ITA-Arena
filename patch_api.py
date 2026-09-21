import os

filepath = 'src/app/api/admin/users/route.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_query = "const { data: users, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });"
new_query = "const { data: users, error } = await supabase.from('profiles').select('*').in('role', ['super_admin', 'admin', 'organisateur', 'organizer', 'visualiseur']).order('created_at', { ascending: false });"

content = content.replace(old_query, new_query)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated API route to filter users')
