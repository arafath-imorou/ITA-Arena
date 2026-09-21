import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# First, undo the stray '}' added to the delete buttons
content = content.replace('title="Supprimer">🗑️</button>}', 'title="Supprimer">🗑️</button>')
content = content.replace('title="Modifier">✏️</button>}', 'title="Modifier">✏️</button>')

# The button functions are actually deleteEvent, deleteForm, deleteVote, deleteCategory, etc.
# Also the modify links are <Link href=... title="Modifier">✏️</Link>

# Let's hide the entire actions div or the individual buttons properly.
# e.g., <button onClick={() => deleteEvent(e.id)}
content = content.replace('<button onClick={() => deleteEvent(e.id)}', '{userRole !== "visualiseur" && <button onClick={() => deleteEvent(e.id)}')
content = content.replace('<button onClick={() => deleteForm(f.id)}', '{userRole !== "visualiseur" && <button onClick={() => deleteForm(f.id)}')
content = content.replace('<button onClick={() => deleteVote(v.id)}', '{userRole !== "visualiseur" && <button onClick={() => deleteVote(v.id)}')
content = content.replace('<button onClick={() => deleteCategory(c.id)}', '{userRole !== "visualiseur" && <button onClick={() => deleteCategory(c.id)}')

# Now add the closing } for the ones we actually wrapped
# We need to be careful. Let's just do it directly for each line that has fee2e2 and 🗑️
lines = content.split('\\n')
for i in range(len(lines)):
    if 'title="Supprimer">🗑️</button>' in lines[i] and '{userRole !=="visualiseur"' not in lines[i]:
        # If it was wrapped by the previous step, it will be on the same line, but wait, the `{userRole...}` is on the same line.
        if '{userRole !== "visualiseur" &&' in lines[i]:
            lines[i] = lines[i].replace('title="Supprimer">🗑️</button>', 'title="Supprimer">🗑️</button>}')
            
    if 'title="Modifier">✏️</Link>' in lines[i]:
        lines[i] = lines[i].replace('<Link href=', '{userRole !== "visualiseur" && <Link href=')
        lines[i] = lines[i].replace('title="Modifier">✏️</Link>', 'title="Modifier">✏️</Link>}')
        
content = '\\n'.join(lines)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed syntax errors in page.tsx')
