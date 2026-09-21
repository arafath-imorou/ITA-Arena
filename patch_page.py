import os

filepath = 'src/app/admin/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleResetPassword function
insertion_point = "const deleteTicket = async (ticketId: string) => {"
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

# 2. Add button under email
old_email_td = """                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>📧 {org.email}</div>
                                            {org.phone && <div style={{ fontSize: '0.85rem' }}>📱 {org.phone}</div>}
                                        </td>"""
new_email_td = """                                        <td>
                                            <div style={{ fontSize: '0.85rem' }}>📧 {org.email}</div>
                                            {org.phone && <div style={{ fontSize: '0.85rem' }}>📱 {org.phone}</div>}
                                            {userRole !== 'visualiseur' && (
                                                <button 
                                                    onClick={() => handleResetPassword(org.id)}
                                                    style={{ marginTop: '0.5rem', fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: '#fef3c7', color: '#d97706', border: '1px solid #fcd34d', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    🔑 Changer mot de passe
                                                </button>
                                            )}
                                        </td>"""
content = content.replace(old_email_td, new_email_td)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated page.tsx')
