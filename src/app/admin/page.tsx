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
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
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

            // Create maps
            const profileMap = (profilesData || []).reduce((acc: any, p) => {
                acc[p.id] = p;
                return acc;
            }, {});

            const eventMap = (eventsData || []).reduce((acc: any, e) => {
                acc[e.id] = e;
                return acc;
            }, {});

            // Enrich events with sales data
            const enrichedEvents = (eventsData || []).map(e => {
                const eventTickets = (ticketsData || []).filter(t => t.event_id === e.id);
                const soldCount = eventTickets.length;
                const revenue = eventTickets.reduce((acc, t) => acc + Number(t.amount), 0);
                
                // Calculate capacity
                let totalCapacity = 0;
                if (Array.isArray(e.ticket_categories)) {
                    totalCapacity = e.ticket_categories.reduce((acc: number, cat: any) => acc + Number(cat.capacity || 0), 0);
                } else if (e.target_amount) {
                    // For cotisations, capacity is the target amount
                    totalCapacity = Number(e.target_amount);
                }

                return {
                    ...e,
                    profiles: profileMap[e.organizer_id] || null,
                    soldCount,
                    revenue,
                    totalCapacity,
                    remaining: totalCapacity - soldCount,
                    percent: totalCapacity > 0 ? Math.round((soldCount / totalCapacity) * 100) : 0
                };
            });

            // Enrich tickets
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
                totalOrganizers: (profilesData || []).filter(p => p.role === 'organizer' || p.role === 'admin').length,
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
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;
            setEvents(events.filter(e => e.id !== eventId));
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
        } catch (err) {
            alert("Erreur lors de la suppression.");
        }
    };

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement des statistiques détaillées...</p>
        </div>
    );

    if (!isAdmin) return null;

    return (
        <div className={styles.adminWrapper}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Super Admin Dashboard</h1>
                    <p className={styles.subtitle}>Analyse et pilotage de la plateforme</p>
                </div>
                <Link href="/" className={styles.badgeInfo}>Retour au site</Link>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Revenu Global</span>
                        <h2>{stats.totalRevenue.toLocaleString()} F CFA</h2>
                    </div>
                    <div className={styles.statIcon}>💰</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Total Ventes</span>
                        <h2>{stats.totalTickets}</h2>
                    </div>
                    <div className={styles.statIcon}>🎫</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Événements</span>
                        <h2>{stats.totalEvents}</h2>
                    </div>
                    <div className={styles.statIcon}>📅</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Cotisations</span>
                        <h2>{stats.totalCotisations}</h2>
                    </div>
                    <div className={styles.statIcon}>🤝</div>
                </div>
            </div>

            <div className={styles.dashboardContent}>
                <div className={styles.section}>
                    <h3>Projets & Performances</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Projet</th>
                                    <th>Ventes / Capacité</th>
                                    <th>Progression</th>
                                    <th>Revenu</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(e => (
                                    <tr key={e.id}>
                                        <td>
                                            <strong>{e.title}</strong>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                                                Par {e.profiles?.full_name || 'Inconnu'}
                                            </p>
                                        </td>
                                        <td>
                                            {e.soldCount} / {e.totalCapacity}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(e.percent, 100)}%`, height: '100%', background: '#ff5a1f' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{e.percent}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: '#059669' }}>
                                            {e.revenue.toLocaleString()} F
                                        </td>
                                        <td>
                                            <span className={`${styles.badge} ${e.is_published ? styles.badgeSuccess : styles.badgeInfo}`}>
                                                {e.is_published ? "Actif" : "Masqué"}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button onClick={() => setSelectedEvent(e)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#e0f2fe', color: '#0369a1' }}>📊</button>
                                                <button onClick={() => togglePublish(e.id, e.is_published)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#f1f5f9' }}>{e.is_published ? "⏸️" : "▶️"}</button>
                                                <button onClick={() => deleteEvent(e.id)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Ventes Récentes</h3>
                    <div className={styles.activityFeed}>
                        {recentTickets.map(t => (
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
                        ))}
                    </div>
                </div>
            </div>

            {/* Détails Modal Overlay */}
            {selectedEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', maxWidth: '600px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        
                        <h2 style={{ marginBottom: '0.5rem' }}>{selectedEvent.title}</h2>
                        <span className={styles.badge} style={{ background: '#ff5a1f', color: 'white', marginBottom: '1.5rem', display: 'inline-block' }}>
                            {selectedEvent.type === 'cotisation' ? 'Cotisation' : 'Événement'}
                        </span>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Tickets Vendus</p>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedEvent.soldCount}</h3>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Chiffre d'Affaire</p>
                                <h3 style={{ margin: 0, fontSize: '1.5rem', color: '#059669' }}>{selectedEvent.revenue.toLocaleString()} F</h3>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Places Restantes</p>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedEvent.remaining}</h3>
                            </div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Taux de Vente</p>
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedEvent.percent}%</h3>
                            </div>
                        </div>

                        <h3>Détails par Catégorie</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {Array.isArray(selectedEvent.ticket_categories) ? selectedEvent.ticket_categories.map((cat: any, idx: number) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold' }}>{cat.name}</p>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Prix: {Number(cat.price).toLocaleString()} F</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0 }}>Capacité: <strong>{cat.capacity}</strong></p>
                                    </div>
                                </div>
                            )) : <p>Aucune catégorie de ticket définie</p>}
                        </div>

                        <div style={{ marginTop: '2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.875rem' }}><strong>Organisateur:</strong> {selectedEvent.profiles?.full_name} ({selectedEvent.profiles?.email})</p>
                            <p style={{ fontSize: '0.875rem' }}><strong>Date:</strong> {new Date(selectedEvent.date).toLocaleDateString()} à {selectedEvent.time}</p>
                        </div>
                    </div>
                </div>
            )}
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
