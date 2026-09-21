import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_fetch_votes = """            const { data: formsData } = await supabase.from('forms').select('*').order('created_at', { ascending: false });
            const { data: votesData } = await supabase.from('votes_campaigns').select('*, votes_cast(status, vote_count, amount_paid)').order('created_at', { ascending: false });"""

new_fetch_votes = """            const { data: formsData } = await supabase.from('forms').select('*').order('created_at', { ascending: false });
            
            // On utilise l'API pour contourner le RLS et obtenir les votes_cast pour le super admin
            const resVotes = await fetch('/api/admin/votes');
            const votesData = resVotes.ok ? await resVotes.json() : [];"""

content = content.replace(old_fetch_votes, new_fetch_votes)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated admin page.tsx to use API for votes')
