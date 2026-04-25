"use client";

import { useState, useEffect, Suspense } from "react";
import styles from "./AdminDashboard.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function AdminDashboardContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalTickets: 0,
        totalOrganizers: 0,
        totalEvents: 0,
        totalCotisations: 0
    });
    const [events, setEvents] = useState<any[]>([]);
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [recentTickets, setRecentTickets] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

            // 1. Fetch All Profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*');
            
            // 2. Fetch All Items (Events + Cotisations)
            const { data: eventsData } = await supabase
                .from('events')
                .select('*')
                .order('created_at', { ascending: false });

            // 3. Fetch Tickets
            const { data: ticketsData } = await supabase
                .from('tickets')
                .select('*')
                .eq('status', 'valid')
                .order('created_at', { ascending: false });

            // Create a map for easy profile lookup
            const profileMap = (profilesData || []).reduce((acc: any, p) => {
                acc[p.id] = p;
                return acc;
            }, {});

            // Create a map for easy event lookup
            const eventMap = (eventsData || []).reduce((acc: any, e) => {
                acc[e.id] = e;
                return acc;
            }, {});

            // Enrich events with their profiles
            const enrichedEvents = (eventsData || []).map(e => ({
                ...e,
                profiles: profileMap[e.organizer_id] || null
            }));

            // Enrich tickets with their events
            const enrichedTickets = (ticketsData || []).map(t => ({
                ...t,
                events: eventMap[t.event_id] || null
            }));

            const totalRev = (ticketsData || []).reduce((acc, t) => acc + Number(t.amount), 0);
            const evtsOnly = enrichedEvents.filter(i => i.type === 'event' || !i.type);
            const cotisOnly = enrichedEvents.filter(i => i.type === 'cotisation');

            setStats({
                totalRevenue: totalRev,
                totalTickets: (ticketsData || []).length,
                totalOrganizers: (profilesData || []).filter(p => p.role === 'organizer').length,
                totalEvents: evtsOnly.length,
                totalCotisations: cotisOnly.length
            });

            setEvents(enrichedEvents);
            setOrganizers((profilesData || []).filter(p => p.role === 'organizer' || enrichedEvents.some(e => e.organizer_id === p.id)));
            setRecentTickets(enrichedTickets.slice(0, 10));

        } catch (err) {
            console.error("Admin Data Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        async function verifyAdmin() {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user?.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push("/");
                return;
            }
            setIsAdmin(true);
            fetchAdminData();
        }

        verifyAdmin();
    }, [user, router]);

    const togglePublish = async (eventId: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .schema('ita_arena')
                .from('events')
                .update({ is_published: !currentStatus })
                .eq('id', eventId);

            if (error) throw error;
            setEvents(events.map(e => e.id === eventId ? { ...e, is_published: !currentStatus } : e));
        } catch (err) {
            alert("Erreur lors de la modification du statut");
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm("Voulez-vous vraiment supprimer définitivement cet événement ? Cette action est irréversible.")) return;

        try {
            const { error } = await supabase
                .schema('ita_arena')
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
            setEvents(events.filter(e => e.id !== eventId));
        } catch (err) {
            alert("Erreur lors de la suppression. Il se peut que des tickets y soient liés.");
        }
    };

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Initialisation de la tour de contrôle...</p>
        </div>
    );

    if (!isAdmin) return null;

    return (
        <div className={styles.adminWrapper}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Super Admin Dashboard</h1>
                    <p className={styles.subtitle}>Pilotez l'ensemble de la plateforme ITA Arena</p>
                </div>
                <Link href="/" className={styles.badgeInfo}>Retour au site</Link>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Chiffre d'Affaires Global</span>
                        <h2>{stats.totalRevenue.toLocaleString()} F CFA</h2>
                    </div>
                    <div className={styles.statIcon}>💰</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Tickets / Paiements</span>
                        <h2>{stats.totalTickets}</h2>
                    </div>
                    <div className={styles.statIcon}>🎫</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Événements Actifs</span>
                        <h2>{stats.totalEvents}</h2>
                    </div>
                    <div className={styles.statIcon}>📅</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Cotisations / Collectes</span>
                        <h2>{stats.totalCotisations}</h2>
                    </div>
                    <div className={styles.statIcon}>🤝</div>
                </div>
            </div>

            <div className={styles.dashboardContent}>
                {/* Main Section: Events & Items */}
                <div className={styles.section}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Tous les projets (Événements & Cotisations)</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nom du Projet</th>
                                    <th>Type</th>
                                    <th>Organisateur</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(e => (
                                    <tr key={e.id}>
                                        <td><strong>{e.title}</strong></td>
                                        <td>
                                            <span className={styles.badge} style={{ background: e.type === 'cotisation' ? '#e0f2fe' : '#f1f5f9' }}>
                                                {e.type === 'cotisation' ? '🤝 Cotisation' : '📅 Événement'}
                                            </span>
                                        </td>
                                        <td>{e.profiles?.full_name || e.profiles?.email || 'Inconnu'}</td>
                                        <td>
                                            <span className={`${styles.badge} ${e.is_published ? styles.badgeSuccess : styles.badgeInfo}`}>
                                                {e.is_published ? "Actif" : "Masqué"}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button 
                                                    onClick={() => togglePublish(e.id, e.is_published)}
                                                    className={styles.badge}
                                                    style={{ border: 'none', cursor: 'pointer', background: e.is_published ? '#fef3c7' : '#dcfce7', color: e.is_published ? '#92400e' : '#166534' }}
                                                    title={e.is_published ? "Masquer" : "Publier"}
                                                >
                                                    {e.is_published ? "⏸️" : "▶️"}
                                                </button>
                                                <button 
                                                    onClick={() => deleteEvent(e.id)}
                                                    className={styles.badge}
                                                    style={{ border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}
                                                    title="Supprimer"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar Section: Recent Sales */}
                <div className={styles.section}>
                    <h3>Ventes Récentes</h3>
                    <div className={styles.activityFeed}>
                        {recentTickets.length > 0 ? recentTickets.map(t => (
                            <div key={t.id} className={styles.activityItem}>
                                <div className={styles.activityMain}>
                                    <div className={styles.activityCircle} style={{ background: t.events?.type === 'cotisation' ? '#e0f2fe' : '#fef3c7' }}>
                                        {t.events?.type === 'cotisation' ? '🤝' : '🎟️'}
                                    </div>
                                    <div className={styles.activityInfo}>
                                        <p><strong>{t.user_name || 'Client'}</strong></p>
                                        <span>{t.events?.title || 'Événement'}</span>
                                    </div>
                                </div>
                                <div className={styles.activityAmount}>
                                    +{Number(t.amount).toLocaleString()} F
                                </div>
                            </div>
                        )) : (
                            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>Aucune vente récente</p>
                        )}
                    </div>

                    <h3 style={{ marginTop: '2rem' }}>Nouveaux Organisateurs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {organizers.slice(0, 5).map(o => (
                            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ width: '32px', height: '32px', background: '#ff5a1f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                    {o.email?.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ overflow: 'hidden' }}>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.875rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {o.company_name || o.full_name || o.email?.split('@')[0]}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{o.email}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <AdminDashboardContent />
        </Suspense>
    );
}
