import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the missing brace
content = content.replace('{userRole !== "visualiseur" && <Link href="/" className={styles.badgeInfo}>Retour au site</Link>', '{userRole !== "visualiseur" && <Link href="/" className={styles.badgeInfo}>Retour au site</Link>}')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed syntax error in page.tsx')
