import os

filepath = 'src/app/admin/UsersTab.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleResetPassword
insertion_point = "    const handleChangeRole = async (userId: string, newRole: string) => {"
reset_pwd_func = """    const handleResetPassword = async (userId: string) => {
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
content = content.replace(insertion_point, reset_pwd_func + insertion_point)

# 2. Add button in the table cell (where delete button is)
old_td = """                                            {userRole !== 'visualiseur' && (
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    style={{ padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Supprimer
                                                </button>
                                            )}"""
new_td = """                                            {userRole !== 'visualiseur' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button 
                                                        onClick={() => handleResetPassword(u.id)}
                                                        style={{ padding: '0.2rem 0.5rem', background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        🔑 Mdp
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        style={{ padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer' }}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            )}"""
content = content.replace(old_td, new_td)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated UsersTab.tsx')
