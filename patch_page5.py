import os
import re

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix unclosed JSX for "Voir l'évènement" Link which should not be restricted anyway
content = content.replace('{userRole !== "visualiseur" && <Link href={`/events/${e.slug || e.id}`} target="_blank" className={styles.badge} style={{ textDecoration: \'none\', background: \'#f8fafc\', color: \'#64748b\' }} title="Voir l\'évènement">🔗</Link>', '<Link href={`/events/${e.slug || e.id}`} target="_blank" className={styles.badge} style={{ textDecoration: \'none\', background: \'#f8fafc\', color: \'#64748b\' }} title="Voir l\'évènement">🔗</Link>')

# Let's also use regex to find any `{userRole !== "visualiseur" && <Link` that doesn't end with `}`
lines = content.split('\\n')
for i, line in enumerate(lines):
    if '{userRole !== "visualiseur" && <Link' in line and not line.rstrip().endswith('}'):
        # Add } at the end
        lines[i] = line.rstrip() + '}'
    # Also check if any `Voir l'évènement` got wrapped
    if 'title="Voir l\'évènement">🔗</Link>' in line and '{userRole !=="visualiseur"' in line:
        lines[i] = line.replace('{userRole !=="visualiseur" && ', '').replace('}', '')

content = '\\n'.join(lines)
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed unclosed JSX tags')
