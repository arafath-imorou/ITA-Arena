import os

filepath = 'src/app/api/votes/init/route.ts'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("!campaign_id || !candidate_id || !voter_email", "!campaign_id || !candidate_id")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated route.ts')
