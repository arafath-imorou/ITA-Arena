'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminDashboard.module.css';
import { useAuth } from '@/context/AuthContext';

export default function UsersTab() {
    const { user } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    
    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('visualiseur');

    const fetchUsers = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users?adminEmail=${user.email}`);
            if (!res.ok) throw new Error('Failed to fetch users');
            const data = await res.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [user]);

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminEmail: user?.email,
                    email,
                    password,
                    fullName,
                    role
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Erreur lors de la création');
            
            setIsCreating(false);
            setEmail('');
            setPassword('');
            setFullName('');
            setRole('visualiseur');
            fetchUsers();
            alert("Utilisateur créé avec succès !");
        } catch (err: any) {
            setError(err.message);
            alert(err.message);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;
        try {
            const res = await fetch(`/api/admin/users?adminEmail=${user?.email}&userId=${userId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Erreur de suppression');
            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleResetPassword = async (userId: string) => {
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

    const handleChangeRole = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminEmail: user?.email,
                    userId,
                    newRole
                })
            });
            if (!res.ok) throw new Error('Erreur modification');
            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleToggleApproval = async (userId: string, currentApproved: boolean) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminEmail: user?.email,
                    userId,
                    is_approved: !currentApproved
                })
            });
            if (!res.ok) throw new Error('Erreur de modification du statut');
            fetchUsers();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) return <div>Chargement des utilisateurs...</div>;

    return (
        <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Gestion des Utilisateurs</h2>
                <button 
                    onClick={() => setIsCreating(true)}
                    className={styles.actionButton}
                    style={{ background: '#0a2e73', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + Nouvel Utilisateur
                </button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

            {isCreating && (
                <form onSubmit={handleCreateUser} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Nom Complet</label>
                        <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Mot de passe initial</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Rôle</label>
                        <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            <option value="super_admin">Super Admin</option>
                            <option value="admin">Admin</option>
                            <option value="organisateur">Organisateur</option>
                            <option value="visualiseur">Visualiseur</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer', background: 'white' }}>Annuler</button>
                        <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#ff5a1f', color: 'white' }}>Créer</button>
                    </div>
                </form>
            )}

            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Validation Compte</th>
                            <th>Date Création</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td>{u.full_name || '-'}</td>
                                <td>{u.email}</td>
                                <td>
                                    <select 
                                        value={u.role} 
                                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                        style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                        disabled={u.email === user?.email}
                                    >
                                        <option value="super_admin">Super Admin</option>
                                        <option value="admin">Admin</option>
                                        <option value="organisateur">Organisateur</option>
                                        <option value="organizer">Organizer</option>
                                        <option value="visualiseur">Visualiseur</option>
                                        <option value="user">User</option>
                                    </select>
                                </td>
                                <td>
                                    <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', background: u.is_approved !== false ? '#dcfce7' : '#fef9c3', color: u.is_approved !== false ? '#15803d' : '#a16207' }}>
                                        {u.is_approved !== false ? '✅ Validé' : '⏳ En attente'}
                                    </span>
                                </td>
                                <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            style={{
                                                background: '#e0f2fe',
                                                color: '#0369a1',
                                                border: 'none',
                                                padding: '0.35rem 0.6rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.78rem',
                                                fontWeight: 'bold'
                                            }}
                                            title="Voir les détails du compte"
                                        >
                                            👁️ Voir
                                        </button>
                                        <button
                                            onClick={() => handleResetPassword(u.id)}
                                            style={{
                                                background: '#fef3c7',
                                                color: '#d97706',
                                                border: '1px solid #fcd34d',
                                                padding: '0.35rem 0.6rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.78rem',
                                                fontWeight: 'bold'
                                            }}
                                            title="Changer le mot de passe"
                                        >
                                            🔑 Pass
                                        </button>
                                        {u.role !== 'super_admin' && (
                                            <button
                                                onClick={() => handleToggleApproval(u.id, u.is_approved !== false)}
                                                style={{
                                                    background: u.is_approved !== false ? '#fef3c7' : '#dcfce7',
                                                    color: u.is_approved !== false ? '#92400e' : '#166534',
                                                    border: 'none',
                                                    padding: '0.35rem 0.6rem',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.78rem',
                                                    fontWeight: 'bold'
                                                }}
                                                title={u.is_approved !== false ? "Suspendre l'autorisation" : "Valider le compte"}
                                            >
                                                {u.is_approved !== false ? '⏸️ Suspendre' : '✅ Valider'}
                                            </button>
                                        )}
                                        {u.email !== user?.email && (
                                            <button onClick={() => handleDeleteUser(u.id)} style={{ color: '#dc2626', background: '#fee2e2', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 'bold' }}>🗑️ Supprimer</button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Détails Utilisateur */}
            {selectedUser && (
                <div className={styles.modalOverlay} onClick={() => setSelectedUser(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <button 
                            onClick={() => setSelectedUser(null)} 
                            style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            ×
                        </button>

                        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0a2e73', margin: 0 }}>
                                👤 Fiche Utilisateur Complexe
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                                Compte ITA Arena #{selectedUser.id?.slice(0, 8)}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0a2e73' }}>Contact & Identité</h4>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Nom complet :</strong> {selectedUser.full_name || (selectedUser.first_name ? `${selectedUser.first_name} ${selectedUser.last_name || ''}` : 'Non renseigné')}</p>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Email :</strong> {selectedUser.email}</p>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Téléphone :</strong> {selectedUser.phone || 'Non renseigné'}</p>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Rôle :</strong> {selectedUser.role}</p>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Date d'inscription :</strong> {new Date(selectedUser.created_at).toLocaleDateString('fr-FR')}</p>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#0a2e73' }}>Profil & Organisation</h4>
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Type :</strong> {selectedUser.user_type === 'entreprise' ? '🏢 Entreprise' : '👤 Particulier'}</p>
                                {selectedUser.company_name && <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Entreprise :</strong> {selectedUser.company_name}</p>}
                                {selectedUser.founder_name && <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Dirigeant :</strong> {selectedUser.founder_name}</p>}
                                {selectedUser.profession && <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Profession :</strong> {selectedUser.profession}</p>}
                                <p style={{ margin: '0.3rem 0', fontSize: '0.85rem' }}><strong>Localisation :</strong> {[selectedUser.city, selectedUser.country].filter(Boolean).join(', ') || 'Non précisé'}</p>
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button 
                                onClick={() => { setSelectedUser(null); handleResetPassword(selectedUser.id); }}
                                style={{ padding: '0.5rem 1rem', background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                🔑 Mot de passe
                            </button>
                            {selectedUser.email !== user?.email && (
                                <button 
                                    onClick={() => { setSelectedUser(null); handleDeleteUser(selectedUser.id); }}
                                    style={{ padding: '0.5rem 1rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    🗑️ Supprimer
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedUser(null)}
                                style={{ padding: '0.5rem 1rem', background: '#0a2e73', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
