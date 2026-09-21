import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_scores = """                    const candidatesWithScores = (candsData || []).map(cand => {
                        const candVotes = (votesData || []).filter(v => v.candidate_id === cand.id);
                        const totalVotes = candVotes.reduce((sum, v) => sum + (v.vote_count || 1), 0);
                        return { ...cand, totalVotes };
                    }).sort((a, b) => b.totalVotes - a.totalVotes);
                    setCandidates(candidatesWithScores);"""

new_scores = """                    let globalTotal = 0;
                    const candsTemp = (candsData || []).map(cand => {
                        const candVotes = (votesData || []).filter(v => v.candidate_id === cand.id);
                        const totalVotes = candVotes.reduce((sum, v) => sum + (v.vote_count || 1), 0);
                        globalTotal += totalVotes;
                        return { ...cand, totalVotes };
                    });
                    const candidatesWithScores = candsTemp.map(c => ({
                        ...c,
                        percentage: globalTotal > 0 ? ((c.totalVotes / globalTotal) * 100).toFixed(1) : 0
                    })).sort((a, b) => b.totalVotes - a.totalVotes);
                    setCandidates(candidatesWithScores);"""

content = content.replace(old_scores, new_scores)

old_ui = """                                {campaign.show_results && cand.totalVotes !== undefined && (
                                    <div className={styles.candScore}>
                                        <strong>{cand.totalVotes}</strong> votes
                                    </div>
                                )}"""

new_ui = """                                {campaign.show_results && cand.totalVotes !== undefined && (
                                    <div className={styles.candScore}>
                                        <strong>{cand.totalVotes}</strong> votes
                                        <span style={{ marginLeft: '8px', fontSize: '0.9em', color: '#666', fontWeight: 'bold' }}>
                                            {cand.percentage}%
                                        </span>
                                    </div>
                                )}"""

content = content.replace(old_ui, new_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx')
