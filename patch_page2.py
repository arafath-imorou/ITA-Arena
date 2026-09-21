import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the misplaced handleResetPassword from the top
bad_insertion = """    const handleResetPassword = async (userId: string) => {
        const newPassword = window.prompt("Nouveau mot de passe pour cet utilisateur :");
        if (!newPassword) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminEmail: user?.email, userId, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors du changement de mot de passe');
            alert('Mot de passe mis à jour avec succès !');
        } catch (err: any) {
            alert(err.message);
        }
    };

const deleteTicket = async (ticketId: string) => {"""
content = content.replace(bad_insertion, "const deleteTicket = async (ticketId: string) => {")


# 2. Insert handleResetPassword properly after deleteVote
good_insertion_point = """    const deleteVote = async (voteId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette campagne de vote ? Tous les candidats et les paiements associés pourraient être affectés.")) return;
        try {
            const { data, error } = await supabase.from('votes_campaigns').delete().eq('id', voteId).select();
            if (error) throw error;
            if (!data || data.length === 0) throw new Error("Permission refusée.");

            setRawVotes(rawVotes.filter(v => v.id !== voteId));
            alert("Campagne de vote supprimée avec succès.");
        } catch (err: any) {
            console.error(err);
            alert("Erreur de suppression: " + (err.message || "Erreur inconnue"));
        }
    };"""

good_reset_pwd_func = """    const handleResetPassword = async (userId: string) => {
        const newPassword = window.prompt("Nouveau mot de passe pour cet utilisateur :");
        if (!newPassword) return;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminEmail: user?.email, userId, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors du changement de mot de passe');
            alert('Mot de passe mis à jour avec succès !');
        } catch (err: any) {
            alert(err.message);
        }
    };

"""

content = content.replace(good_insertion_point, good_insertion_point + "\n\n" + good_reset_pwd_func)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Fixed page.tsx function placement')
