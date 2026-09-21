import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_fetch_stats = """                if (campData.show_results) {
                    // Fetch Votes to compute current standings
                    const { data: votesData } = await supabase
                        .from('votes_cast')
                        .select('candidate_id, vote_count')
                        .eq('campaign_id', campaignId)
                        .eq('status', 'valid');"""

new_fetch_stats = """                if (campData.show_results) {
                    // Fetch Votes to compute current standings
                    const statsRes = await fetch(`/api/votes/${campaignId}/stats`);
                    const votesData = statsRes.ok ? await statsRes.json() : [];"""

content = content.replace(old_fetch_stats, new_fetch_stats)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated vote page.tsx')
