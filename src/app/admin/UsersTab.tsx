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
                                <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                                <td>
                                    {u.email !== user?.email && (
                                        <button onClick={() => handleDeleteUser(u.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Supprimer</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
