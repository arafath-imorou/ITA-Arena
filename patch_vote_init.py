import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_insert = """                // 1.5 INSERT VOTE AS PENDING BEFORE PAYMENT
                const { data: pendingVote, error: pendingError } = await supabase.from('votes_cast').insert({
                    campaign_id: campaignId,
                    candidate_id: selectedCandidate.id,
                    voter_email: email,
                    voter_phone: phone,
                    vote_count: voteCount,
                    amount_paid: amount,
                    transaction_id: null,
                    status: 'pending' // pending status to save the vote intent
                }).select().single();

                if (pendingError) {
                    alert("Erreur lors de l'initialisation du vote. Veuillez réessayer.");
                    setProcessing(false);
                    return;
                }"""

new_insert = """                // 1.5 INSERT VOTE AS PENDING BEFORE PAYMENT VIA API (to bypass RLS)
                const initRes = await fetch('/api/votes/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campaign_id: campaignId,
                        candidate_id: selectedCandidate.id,
                        voter_email: email,
                        voter_phone: phone,
                        vote_count: voteCount,
                        amount_paid: amount
                    })
                });

                const initData = await initRes.json();

                if (!initRes.ok || initData.error) {
                    console.error("Init Error:", initData.error);
                    alert("Erreur lors de l'initialisation du vote. Veuillez réessayer.");
                    setProcessing(false);
                    return;
                }

                const pendingVote = initData.pendingVote;"""

content = content.replace(old_insert, new_insert)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx')
