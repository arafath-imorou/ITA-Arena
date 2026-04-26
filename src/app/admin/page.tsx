"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import styles from "./AdminDashboard.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { downloadTicket } from "@/lib/ticketUtils";

function AdminDashboardContent() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [rawEvents, setRawEvents] = useState<any[]>([]);
    const [rawProfiles, setRawProfiles] = useState<any[]>([]);
    const [rawTickets, setRawTickets] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'stats' | 'tickets'>('stats');

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
            const { data: eventsData } = await supabase.from('events_with_stats').select('*').order('created_at', { ascending: false });
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

        // 1. Prepare Events with computed stats (now simplified because of view)
        let events = rawEvents.map(e => {
            const eventTickets = rawTickets.filter(t => t.event_id === e.id);
            
            // For category breakdown, we still need to filter tickets
            let categoriesWithStats = [];
            if (Array.isArray(e.ticket_categories)) {
                categoriesWithStats = e.ticket_categories.map((cat: any) => {
                    const catTickets = eventTickets.filter(t => t.category === cat.name);
                    const catSold = catTickets.length;
                    const catRevenue = catTickets.reduce((acc, t) => acc + Number(t.amount), 0);
                    const catCapacity = Number(cat.capacity || 0);
                    return { ...cat, sold: catSold, revenue: catRevenue, capacity: catCapacity, remaining: catCapacity - catSold, percent: catCapacity > 0 ? Math.round((catSold / catCapacity) * 100) : 0 };
                });
            }

            return {
                ...e,
                profiles: profileMap[e.organizer_id] || null,
                percent: e.total_capacity > 0 ? Math.round((e.sold_count / e.total_capacity) * 100) : 0,
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
        if (!confirm("Voulez-vous supprimer définitivement ce projet ?")) return;
        try {
            await supabase.from('events').delete().eq('id', eventId);
            setRawEvents(rawEvents.filter(e => e.id !== eventId));
            if (selectedEvent?.id === eventId) setSelectedEvent(null);
        } catch (err) {
            alert("Erreur de suppression");
        }
    };

    if (loading) return <div className={styles.loadingContainer}><div className={styles.spinner}></div><p>Optimisation responsive...</p></div>;
    if (!isAdmin) return null;

    return (
        <div className={styles.adminWrapper}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Super Admin</h1>
                    <p className={styles.subtitle}>Plateforme ITA Arena</p>
                </div>
                <Link href="/" className={styles.badgeInfo}>Retour au site</Link>
            </div>

            {/* Filter Bar */}
            <div className={styles.section} style={{ marginBottom: '2rem' }}>
                <div className={styles.filterGrid}>
                    <div className={styles.filterItem}>
                        <label className={styles.filterLabel}>Projet</label>
                        <input 
                            type="text" 
                            placeholder="Nom..."
                            className={styles.filterInput}
                            value={filters.search}
                            onChange={e => setFilters({...filters, search: e.target.value})}
                        />
                    </div>
                    <div className={styles.filterItem}>
                        <label className={styles.filterLabel}>Type</label>
                        <select 
                            className={styles.filterInput}
                            value={filters.type}
                            onChange={e => setFilters({...filters, type: e.target.value})}
                        >
                            <option value="all">Tous</option>
                            <option value="event">Événements</option>
                            <option value="cotisation">Cotisations</option>
                        </select>
                    </div>
                    <div className={styles.filterItem}>
                        <label className={styles.filterLabel}>Organisateur</label>
                        <select 
                            className={styles.filterInput}
                            value={filters.organizerId}
                            onChange={e => setFilters({...filters, organizerId: e.target.value})}
                        >
                            <option value="all">Tous</option>
                            {organizersList.map(o => (
                                <option key={o.id} value={o.id}>{o.company_name || o.full_name || o.email}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterItem}>
                        <label className={styles.filterLabel}>Année</label>
                        <select 
                            className={styles.filterInput}
                            value={filters.year}
                            onChange={e => setFilters({...filters, year: e.target.value})}
                        >
                            <option value="all">Toutes</option>
                            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className={styles.filterItem}>
                        <label className={styles.filterLabel}>Mois</label>
                        <select 
                            className={styles.filterInput}
                            value={filters.month}
                            onChange={e => setFilters({...filters, month: e.target.value})}
                        >
                            <option value="all">Tous</option>
                            {["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"].map((m, i) => (
                                <option key={i} value={(i + 1).toString()}>{m}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterItem} style={{ justifyContent: 'flex-end' }}>
                        <button 
                            onClick={() => setFilters({search: '', type: 'all', organizerId: 'all', year: 'all', month: 'all'})}
                            className={styles.badge}
                            style={{ width: '100%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', height: '42px' }}
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Revenu</span>
                        <h2>{stats.totalRevenue.toLocaleString()} F</h2>
                    </div>
                    <div className={styles.statIcon}>💰</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Tickets</span>
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
                    <h3>Performances ({filteredEvents.length})</h3>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Projet</th>
                                    <th>Ventes</th>
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
                                            <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{e.profiles?.full_name || 'Inconnu'}</p>
                                        </td>
                                        <td>{e.sold_count} / {e.total_capacity}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ flex: 1, minWidth: '40px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(e.percent, 100)}%`, height: '100%', background: '#ff5a1f' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{e.percent}%</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 'bold', color: '#059669' }}>{Number(e.collected_amount || 0).toLocaleString()} F</td>
                                        <td><span className={`${styles.badge} ${e.is_published ? styles.badgeSuccess : styles.badgeInfo}`}>{e.is_published ? "Actif" : "Masqué"}</span></td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                <button onClick={() => { setSelectedEvent(e); setActiveModalTab('stats'); }} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#e0f2fe', color: '#0369a1' }} title="Statistiques">📊</button>
                                                <button onClick={() => { setSelectedEvent(e); setActiveModalTab('tickets'); }} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#fef3c7', color: '#92400e' }} title="Tickets">🎟️</button>
                                                <button onClick={() => togglePublish(e.id, e.is_published)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#f1f5f9' }} title={e.is_published ? "Masquer" : "Publier"}>{e.is_published ? "⏸️" : "▶️"}</button>
                                                <button onClick={() => deleteEvent(e.id)} className={styles.badge} style={{ border: 'none', cursor: 'pointer', background: '#fee2e2', color: '#991b1b' }} title="Supprimer">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Activité Récente</h3>
                    <div className={styles.activityFeed}>
                        {filteredTickets.slice(0, 8).map(t => (
                            <div key={t.id} className={styles.activityItem}>
                                <div className={styles.activityMain}>
                                    <div className={styles.activityCircle} style={{ background: t.events?.type === 'cotisation' ? '#e0f2fe' : '#fef3c7' }}>
                                        {t.events?.type === 'cotisation' ? '🤝' : '🎟️'}
                                    </div>
                                    <div className={styles.activityInfo}>
                                        <p><strong>{t.user_name || 'Client'}</strong></p>
                                        <span style={{ fontSize: '0.65rem' }}>{t.events?.title || 'Événement'}</span>
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
                <div className={styles.modalOverlay} onClick={() => setSelectedEvent(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{selectedEvent.title}</h2>
                        <span className={styles.badge} style={{ background: '#ff5a1f', color: 'white', marginBottom: '1.5rem', display: 'inline-block' }}>{selectedEvent.type === 'cotisation' ? 'Cotisation' : 'Événement'}</span>
                        
                        <div className={styles.modalTabs}>
                            <button 
                                className={`${styles.modalTab} ${activeModalTab === 'stats' ? styles.modalTabActive : ''}`}
                                onClick={() => setActiveModalTab('stats')}
                            >
                                Performances
                            </button>
                            <button 
                                className={`${styles.modalTab} ${activeModalTab === 'tickets' ? styles.modalTabActive : ''}`}
                                onClick={() => setActiveModalTab('tickets')}
                            >
                                Tickets ({selectedEvent.sold_count})
                            </button>
                        </div>
                        
                        {activeModalTab === 'stats' ? (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem' }}>Total Vendus</p><h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedEvent.sold_count}</h3></div>
                                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem' }}>Revenu</p><h3 style={{ margin: 0, fontSize: '1.2rem', color: '#059669' }}>{Number(selectedEvent.collected_amount || 0).toLocaleString()} F</h3></div>
                                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem' }}>Restants</p><h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedEvent.total_capacity - selectedEvent.sold_count}</h3></div>
                                    <div style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem' }}>Taux</p><h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedEvent.percent}%</h3></div>
                                </div>

                                <h3>Par Catégorie</h3>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table} style={{ fontSize: '0.75rem', minWidth: '400px' }}>
                                        <thead><tr><th>Cat</th><th>Prix</th><th>Ventes</th><th>Revenu</th><th>Taux</th></tr></thead>
                                        <tbody>
                                            {selectedEvent.categoriesWithStats.map((cat: any, idx: number) => (
                                                <tr key={idx}>
                                                    <td><strong>{cat.name}</strong></td>
                                                    <td>{Number(cat.price).toLocaleString()} F</td>
                                                    <td>{cat.sold} / {cat.capacity}</td>
                                                    <td>{Number(cat.revenue || 0).toLocaleString()} F</td>
                                                    <td>{cat.percent}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className={styles.ticketsList}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3>Liste des Tickets</h3>
                                    <button 
                                        onClick={async () => {
                                            const eventTickets = rawTickets.filter(t => t.event_id === selectedEvent.id);
                                            for (const t of eventTickets) {
                                                await downloadTicket(t, selectedEvent);
                                                await new Promise(r => setTimeout(r, 500));
                                            }
                                        }}
                                        className={styles.badge}
                                        style={{ background: '#ff5a1f', color: 'white', border: 'none', cursor: 'pointer' }}
                                    >
                                        📥 Télécharger Tout
                                    </button>
                                </div>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table} style={{ fontSize: '0.75rem' }}>
                                        <thead>
                                            <tr>
                                                <th>N°</th>
                                                <th>Client</th>
                                                <th>Catégorie</th>
                                                <th>Paiement</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rawTickets.filter(t => t.event_id === selectedEvent.id).map(t => (
                                                <tr key={t.id}>
                                                    <td><strong>#{t.ticket_number.toString().padStart(5, '0')}</strong></td>
                                                    <td>
                                                        <div>{t.user_name || 'Inconnu'}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{t.user_email}</div>
                                                    </td>
                                                    <td>{t.category}</td>
                                                    <td>
                                                        <div>{t.payment_phone || 'N/A'}</div>
                                                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{Number(t.amount).toLocaleString()} F</div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button 
                                                                onClick={() => downloadTicket(t, selectedEvent)}
                                                                className={styles.badge}
                                                                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer' }}
                                                                title="Télécharger PDF"
                                                            >
                                                                📥 PDF
                                                            </button>
                                                            <a 
                                                                href={`https://wa.me/${(t.payment_phone || t.user_phone || '').replace(/\+/g, '').replace(/\s/g, '')}?text=Bonjour ${t.user_name || ''}, voici votre ticket pour ${selectedEvent.title}.`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={styles.badge}
                                                                style={{ background: '#25D366', color: 'white', border: 'none', cursor: 'pointer', textDecoration: 'none' }}
                                                                title="Envoyer via WhatsApp"
                                                            >
                                                                💬
                                                            </a>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {rawTickets.filter(t => t.event_id === selectedEvent.id).length === 0 && (
                                                <tr>
                                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                                        Aucun ticket vendu pour le moment.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
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
