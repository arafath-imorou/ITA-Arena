import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import { useParams, useRouter } from "next/navigation";',
    'import { useParams, useRouter, useSearchParams } from "next/navigation";'
)

# 2. Add searchParams hook
content = content.replace(
    'const campaignId = params.id as string;',
    'const campaignId = params.id as string;\n    const searchParams = useSearchParams();\n    const autoCandidateId = searchParams.get("candidat");'
)

# 3. Add auto-select logic
old_fetch = """                    const candidatesWithScores = candsTemp.map(c => ({
                        ...c,
                        percentage: globalTotal > 0 ? ((c.totalVotes / globalTotal) * 100).toFixed(1) : 0
                    })).sort((a, b) => b.totalVotes - a.totalVotes);
                    setCandidates(candidatesWithScores);
                } else {
                    setCandidates(candsData || []);
                }"""

new_fetch = """                    const candidatesWithScores = candsTemp.map(c => ({
                        ...c,
                        percentage: globalTotal > 0 ? ((c.totalVotes / globalTotal) * 100).toFixed(1) : 0
                    })).sort((a, b) => b.totalVotes - a.totalVotes);
                    
                    const finalCands = candidatesWithScores;
                    setCandidates(finalCands);
                    if (autoCandidateId) {
                        const match = finalCands.find(c => c.id === autoCandidateId);
                        if (match) { setSelectedCandidate(match); setVoteCount(1); }
                    }
                } else {
                    const finalCands = candsData || [];
                    setCandidates(finalCands);
                    if (autoCandidateId) {
                        const match = finalCands.find(c => c.id === autoCandidateId);
                        if (match) { setSelectedCandidate(match); setVoteCount(1); }
                    }
                }"""

content = content.replace(old_fetch, new_fetch)

# 4. Add copy link function
content = content.replace(
    'const totalPrice = campaign.is_paid ? voteCount * campaign.price_per_vote : 0;',
    'const totalPrice = campaign.is_paid ? voteCount * campaign.price_per_vote : 0;\n\n    const copyLink = (candId: string) => {\n        const url = `${window.location.origin}/vote/${campaignId}?candidat=${candId}`;\n        navigator.clipboard.writeText(url);\n        alert("Lien direct copié dans le presse-papier !");\n    };'
)

# 5. Add copy button
old_button = """                                <button onClick={() => { setSelectedCandidate(cand); setVoteCount(1); }} className={styles.voteBtn}>
                                    🗳️ Voter pour ce candidat
                                </button>"""

new_button = """                                <button onClick={() => { setSelectedCandidate(cand); setVoteCount(1); }} className={styles.voteBtn}>
                                    🗳️ Voter pour ce candidat
                                </button>
                                <button onClick={() => copyLink(cand.id)} style={{ marginTop: '10px', fontSize: '0.8rem', background: 'transparent', border: '1px solid #ddd', padding: '5px', borderRadius: '4px', cursor: 'pointer', color: '#555', width: '100%' }}>
                                    🔗 Copier le lien direct
                                </button>"""

content = content.replace(old_button, new_button)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx')
