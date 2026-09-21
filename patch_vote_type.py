import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old = "const votesData = statsRes.ok ? await statsRes.json() : [];"
new = "const votesData: any[] = statsRes.ok ? await statsRes.json() : [];"

content = content.replace(old, new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
