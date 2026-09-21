import os

filepath = 'src/app/organizer/votes/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix select
old_select = ".select('*, vote_candidates(count), votes_cast(count, amount_paid)')"
new_select = ".select('*, vote_candidates(count), votes_cast(status, vote_count, amount_paid)')"
content = content.replace(old_select, new_select)

# Fix reduction
old_reduce = """                    const totalVotes = campaign.votes_cast[0]?.count || 0;
                    const totalRevenue = campaign.votes_cast.reduce((acc: number, v: any) => acc + (v.amount_paid || 0), 0);"""

new_reduce = """                    const validVotes = (campaign.votes_cast || []).filter((v: any) => v.status === 'valid');
                    const totalVotes = validVotes.reduce((acc: number, v: any) => acc + (v.vote_count || 1), 0);
                    const totalRevenue = validVotes.reduce((acc: number, v: any) => acc + (v.amount_paid || 0), 0);"""

content = content.replace(old_reduce, new_reduce)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated org votes page.tsx')
