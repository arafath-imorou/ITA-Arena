import os

def replace_in_file(filepath, old, new):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace(old, new)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file(
    'src/components/Navbar/Navbar.tsx',
    "{role === 'admin' && (",
    "{['admin', 'super_admin', 'organisateur', 'organizer', 'visualiseur'].includes(role || '') && ("
)

replace_in_file(
    'src/app/organizer/layout.tsx',
    "role === 'admin' && (",
    "['admin', 'super_admin', 'organisateur', 'organizer', 'visualiseur'].includes(role || '') && ("
)

print('Fixed role checks in Navbar and layout')
