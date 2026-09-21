import os

filepath = 'src/app/vote/[id]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

old_update = """            if (pendingVoteId) {
                // Update existing pending vote
                const { error } = await supabase.from('votes_cast')
                    .update({
                        transaction_id: transactionId,
                        status: 'valid'
                    })
                    .eq('id', pendingVoteId);

                if (error) throw error;
            } else {"""

new_update = """            if (pendingVoteId) {
                // Update existing pending vote via server-side API to bypass RLS
                const updateRes = await fetch('/api/votes/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vote_id: pendingVoteId,
                        transaction_id: transactionId
                    })
                });
                
                const updateData = await updateRes.json();
                if (!updateRes.ok || updateData.error) {
                    throw new Error(updateData.error || "Erreur lors de la confirmation du vote.");
                }
            } else {"""

content = content.replace(old_update, new_update)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx')
