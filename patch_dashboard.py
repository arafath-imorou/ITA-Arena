import os

filepath = 'src/app/organizer/votes/[id]/results/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the votes query to only include valid votes
old_query = """                const { data: votesData, error: votesError } = await supabase
                    .from('votes_cast')
                    .select('*')
                    .eq('campaign_id', campaignId);"""

new_query = """                const { data: votesData, error: votesError } = await supabase
                    .from('votes_cast')
                    .select('*')
                    .eq('campaign_id', campaignId)
                    .eq('status', 'valid')
                    .order('created_at', { ascending: false });"""

content = content.replace(old_query, new_query)

# Add Recent Payments Section
old_ui = """            </div>
        </div>
    );
}"""

new_ui = """            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: '3rem' }}>Derniers paiements (Historique)</h2>
            <div className={styles.recentVotes}>
                {votes.slice(0, 50).map(v => {
                    const cand = candidates.find(c => c.id === v.candidate_id);
                    return (
                        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eaeaea', background: '#fff', borderRadius: '8px', marginBottom: '0.5rem' }}>
                            <div>
                                <strong style={{ color: '#2b5a41' }}>{v.vote_count} votes</strong> pour {cand?.name || "Candidat supprimé"}
                                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.2rem' }}>
                                    Par: {v.voter_email || v.voter_phone || 'Anonyme'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold' }}>{v.amount_paid} {campaign.currency}</div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(v.created_at).toLocaleString()}</div>
                            </div>
                        </div>
                    )
                })}
                {votes.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: '#777' }}>Aucun paiement reçu pour le moment.</div>}
            </div>
        </div>
    );
}"""

content = content.replace(old_ui, new_ui)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated results page.tsx')
