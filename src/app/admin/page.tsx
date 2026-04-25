"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import styles from "./AdminDashboard.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

function AdminDashboardContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [rawEvents, setRawEvents] = useState<any[]>([]);
    const [rawProfiles, setRawProfiles] = useState<any[]>([]);
    const [rawTickets, setRawTickets] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        type: 'all',
        organizerId: 'all',
        year: 'all',
        month: 'all'
    });

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const { data: profilesData } = await supabase.from('profiles').select('*');
            const { data: eventsData } = await supabase.from('events').select('*').order('created_at', { ascending: false });
            const { data: ticketsData } = await supabase.from('tickets').select('*').eq('status', 'valid').order('created_at', { ascending: false });

            setRawProfiles(profilesData || []);
            setRawEvents(eventsData || []);
            setRawTickets(ticketsData || []);
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

    // Computed Data based on filters
    const { filteredEvents, filteredTickets, stats, organizersList, yearsList } = useMemo(() => {
        const profileMap = rawProfiles.reduce((acc: any, p) => { acc[p.id] = p; return acc; }, {});
        const eventMap = rawEvents.reduce((acc: any, e) => { acc[e.id] = e; return acc; }, {});

        // 1. Filter Events
        let events = rawEvents.map(e => {
            const eventTickets = rawTickets.filter(t => t.event_id === e.id);
            const soldCount = eventTickets.length;
            const revenue = eventTickets.reduce((acc, t) => acc + Number(t.amount), 0);
            
            let totalCapacity = 0;
            let categoriesWithStats = [];
            if (Array.isArray(e.ticket_categories)) {
                totalCapacity = e.ticket_categories.reduce((acc: number, cat: any) => acc + Number(cat.capacity || 0), 0);
                categoriesWithStats = e.ticket_categories.map((cat: any) => {
                    const catTickets = eventTickets.filter(t => t.category === cat.name);
                    const catSold = catTickets.length;
                    const catRevenue = catTickets.reduce((acc, t) => acc + Number(t.amount), 0);
                    const catCapacity = Number(cat.capacity || 0);
                    return { ...cat, sold: catSold, revenue: catRevenue, capacity: catCapacity, remaining: catCapacity - catSold, percent: catCapacity > 0 ? Math.round((catSold / catCapacity) * 100) : 0 };
                });
            } else if (e.target_amount) {
                totalCapacity = Number(e.target_amount);
            }

            return {
                ...e,
                profiles: profileMap[e.organizer_id] || null,
                soldCount,
                revenue,
                totalCapacity,
                remaining: totalCapacity - soldCount,
                percent: totalCapacity > 0 ? Math.round((soldCount / totalCapacity) * 100) : 0,
                categoriesWithStats,
                createdDate: new Date(e.created_at)
            };
        });

        // Apply filters
        if (filters.search) {
            const s = filters.search.toLowerCase();
            events = events.filter(e => e.title.toLowerCase().includes(s));
        }
        if (filters.type !== 'all') {
            events = events.filter(e => e.type === filters.type || (filters.type === 'event' && !e.type));
        }
        if (filters.organizerId !== 'all') {
            events = events.filter(e => e.organizer_id === filters.organizerId);
        }
        if (filters.year !== 'all') {
            events = events.filter(e => e.createdDate.getFullYear().toString() === filters.year);
        }
        if (filters.month !== 'all') {
            events = events.filter(e => (e.createdDate.getMonth() + 1).toString() === filters.month);
        }

        const filteredEventIds = new Set(events.map(e => e.id));
        const tickets = rawTickets.filter(t => filteredEventIds.has(t.event_id)).map(t => ({
            ...t,
            events: eventMap[t.event_id] || null
        }));

        const totalRev = tickets.reduce((acc, t) => acc + Number(t.amount), 0);
        const evtsOnly = events.filter(i => i.type === 'event' || !i.type);
        const cotisOnly = events.filter(i => i.type === 'cotisation');

        // Lists for filters
        const organizers = rawProfiles.filter(p => p.role === 'organizer' || rawEvents.some(e => e.organizer_id === p.id));
        const years = Array.from(new Set(rawEvents.map(e => new Date(e.created_at).getFullYear()))).sort((a, b) => b - a);

        return {
            filteredEvents: events,
            filteredTickets: tickets,
            stats: {
                totalRevenue: totalRev,
                totalTickets: tickets.length,
                totalEvents: evtsOnly.length,
                totalCotisations: cotisOnly.length
            },
            organizersList: organizers,
            yearsList: years
        };
    }, [rawEvents, rawProfiles, rawTickets, filters]);

    const togglePublish = async (eventId: string, currentStatus: boolean) => {
        try {
            await supabase.from('events').update({ is_published: !currentStatus }).eq('id', eventId);
            setRawEvents(rawEvents.map(e => e.id === eventId ? { ...e, is_published: !currentStatus } : e));
        } catch (err) {
            alert("Erreur");
        }
    };

    const deleteEvent = async (eventId: string) => {
        if (!confirm("Supprimer ?")) return;
        try {
            await supabase.from('events').delete().eq('id', eventId);
            setRawEvents(rawEvents.filter(e => e.id !== eventId));
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
        } catch (err) {
            alert("Erreur");
        }
    };

    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div><p>Analyse des filtres...</p></div>;
    if (!isAdmin) return null;

    return (
        <div className={styles.adminWrapper}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Super Admin Dashboard</h1>
                    <p className={styles.subtitle}>Pilotage stratégique de la plateforme</p>
                </div>
                <Link href="/" className={styles.badgeInfo}>Retour au site</Link>
            </div>

            {/* Filter Bar */}
            <div className={styles.section} style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Rechercher un projet</label>
                        <input 
                            type="text" 
                            placeholder="Nom du projet..."
                            className={styles.badge}
                            style={{ width: '100%', border: '1px solid #e2e8f0', background: 'white', padding: '0.5rem' }}
                            value={filters.search}
                            onChange={e => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Type</label>
                        <select 
                            className={styles.badge}
                            style={{ width: '100%', border: '1px solid #e2e8f0', background: 'white', padding: '0.5rem' }}
                            value={filters.type}
                            onChange={e => setFilters({...filters, type: e.target.value})}
                        >
                            <option value="all">Tous les types</option>
                            <option value="event">Événements</option>
                            <option value="cotisation">Cotisations</option>
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Organisateur</label>
                        <select 
                            className={styles.badge}
                            style={{ width: '100%', border: '1px solid #e2e8f0', background: 'white', padding: '0.5rem' }}
                            value={filters.organizerId}
                            onChange={e => setFilters({...filters, organizerId: e.target.value})}
                        >
                            <option value="all">Tous les organisateurs</option>
                            {organizersList.map(o => (
                                <option key={o.id} value={o.id}>{o.company_name || o.full_name || o.email}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Année</label>
                        <select 
                            className={styles.badge}
                            style={{ width: '100%', border: '1px solid #e2e8f0', background: 'white', padding: '0.5rem' }}
                            value={filters.year}
                            onChange={e => setFilters({...filters, year: e.target.value})}
                        >
                            <option value="all">Toutes les années</option>
                            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>Mois</label>
                        <select 
                            className={styles.badge}
                            style={{ width: '100%', border: '1px solid #e2e8f0', background: 'white', padding: '0.5rem' }}
                            value={filters.month}
                            onChange={e => setFilters({...filters, month: e.target.value})}
                        >
                            <option value="all">Tous les mois</option>
                            {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                                <option key={i} value={(i + 1).toString()}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button 
                            onClick={() => setFilters({search: '', type: 'all', organizerId: 'all', year: 'all', month: 'all'})}
                            className={styles.badge}
                            style={{ width: '100%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', padding: '0.5rem' }}
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Revenu (Filtre)</span>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ margin: 0 }}>Résultats filtrés ({filteredEvents.length})</h3>
                    </div>
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
                                {filteredEvents.map(e => (
                                    <tr key={e.id}>
                                        <td>
                                            <strong>{e.title}</strong>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Par {e.profiles?.full_name || 'Inconnu'}</p>
                                        </td>
                                        <td>{e.soldCount} / {e.totalCapacity}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(e.percent, 100)}%`, height: '100%', background: '#ff5a1f' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{e.percent}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: '#059669' }}>{e.revenue.toLocaleString()} F</td>
                                        <td><span className={`${styles.badge} ${e.is_published ? styles.badgeSuccess : styles.badgeInfo}`}>{e.is_published ? "Actif" : "Masqué"}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button onClick={() => setSelectedEvent(e)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#e0f2fe', color: '#0369a1' }}>📊</button>
                                                <button onClick={() => togglePublish(e.id, e.is_published)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#f1f5f9' }}>{e.is_published ? "⏸️" : "▶️"}</button>
                                                <button onClick={() => deleteEvent(e.id)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredEvents.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Aucun résultat correspondant aux filtres</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Activité Récente</h3>
                    <div className={styles.activityFeed}>
                        {filteredTickets.slice(0, 10).map(t => (
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
                                <div className={styles.activityAmount}>+{Number(t.amount).toLocaleString()} F</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Détails Modal Overlay */}
            {selectedEvent && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1.5rem', maxWidth: '800px', width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        <h2 style={{ marginBottom: '0.5rem' }}>{selectedEvent.title}</h2>
                        <span className={styles.badge} style={{ background: '#ff5a1f', color: 'white', marginBottom: '1.5rem', display: 'inline-block' }}>{selectedEvent.type === 'cotisation' ? 'Cotisation' : 'Événement'}</span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Total Vendus</p><h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedEvent.soldCount}</h3></div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Chiffre d'Affaire</p><h3 style={{ margin: 0, fontSize: '1.5rem', color: '#059669' }}>{selectedEvent.revenue.toLocaleString()} F</h3></div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Places Restantes</p><h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedEvent.remaining}</h3></div>
                            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '1rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>Taux de Vente</p><h3 style={{ margin: 0, fontSize: '1.5rem' }}>{selectedEvent.percent}%</h3></div>
                        </div>
                        <h3>Statistiques par Catégorie</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table className={styles.table} style={{ fontSize: '0.875rem' }}>
                                <thead><tr><th>Catégorie</th><th>Prix</th><th>Vendus</th><th>Restant</th><th>Revenu</th><th>Taux</th></tr></thead>
                                <tbody>
                                    {selectedEvent.categoriesWithStats.map((cat: any, idx: number) => (
                                        <tr key={idx}><td><strong>{cat.name}</strong></td><td>{Number(cat.price).toLocaleString()} F</td><td>{cat.sold} / {cat.capacity}</td><td>{cat.remaining}</td><td style={{ fontWeight: 'bold' }}>{cat.revenue.toLocaleString()} F</td><td><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: '40px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: `${cat.percent}%`, height: '100%', background: '#ff5a1f' }}></div></div><span>{cat.percent}%</span></div></td></tr>
                                    ))}
                                </tbody>
                            </table>
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
