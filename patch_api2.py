import os

filepath = 'src/app/api/admin/users/route.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Update GET
old_get = ".in('role', ['super_admin', 'admin', 'organisateur', 'organizer', 'visualiseur']).order('created_at', { ascending: false });"
new_get = ".in('role', ['super_admin', 'admin', 'organisateur', 'organizer', 'visualiseur']).eq('company_name', 'ITA_ARENA').order('created_at', { ascending: false });"
content = content.replace(old_get, new_get)

# Update POST
old_post = """        role: role || 'visualiseur',
        user_type: 'particulier'
    });"""
new_post = """        role: role || 'visualiseur',
        user_type: 'particulier',
        company_name: 'ITA_ARENA'
    });"""
content = content.replace(old_post, new_post)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated API route for ITA ARENA users')
