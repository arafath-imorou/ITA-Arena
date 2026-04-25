"use client";

import { useState, useEffect } from "react";
import styles from "./Organizer.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function OrganizerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ tickets: 0, revenue: 0, views: 0, eventsCount: 0 });
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;
            setLoading(true);

            // Fetch all events for this organizer
            const { data: eventsData, error: eventsError } = await supabase
                .schema('ita_arena')
                .from('events')
                .select('*')
                .eq('organizer_id', user.id)
                .order('created_at', { ascending: false });

            if (eventsData) {
                setEvents(eventsData);
                const totalEvents = eventsData.length;

                // Here we initialize real stats at 0. 
                // They will be updated once we have a real 'orders' table
                setStats({
                    tickets: 0, 
                    revenue: 0, 
                    views: 0, 
                    eventsCount: totalEvents
                });
            }

            setLoading(false);
        }

        fetchDashboardData();
    }, [user]);

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement de vos statistiques...</p>
        </div>
    );

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Tableau de bord</h1>
                    <p className={styles.subtitle}>Aperçu global de votre activité d'organisateur</p>
                </div>
                <Link href="/organizer/create" className={styles.createBtn}>
                    <span>+</span> Créer un nouvel évènement
                </Link>
            </div>

            <div className={styles.overviewGrid}>
                <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                    <div className={styles.statInfo}>
                        <span>Événements en cours</span>
                        <h2>{stats.eventsCount}</h2>
                    </div>
                    <div className={styles.statIcon}>📅</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                    <div className={styles.statInfo}>
                        <span>Tickets vendus</span>
                        <h2>{new Intl.NumberFormat('fr-FR').format(stats.tickets)}</h2>
                    </div>
                    <div className={styles.statIcon}>🎫</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardSky}`}>
                    <div className={styles.statInfo}>
                        <span>Abonnés</span>
                        <h2>{new Intl.NumberFormat('fr-FR').format(stats.views)}</h2>
                    </div>
                    <div className={styles.statIcon}>👥</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardGold}`}>
                    <div className={styles.statInfo}>
                        <span>Tickets achetés</span>
                        <h2>0</h2>
                    </div>
                    <div className={styles.statIcon}>🛒</div>
                </div>
            </div>

            <div className={styles.quickActions}>
                <Link href="/organizer/create" className={styles.actionBtnActive}>
                    <span>+</span> Créer un événement
                </Link>
                <Link href="/organizer/tickets" className={styles.actionBtn}>
                    🎫 Gérer les tickets
                </Link>
                <Link href="/organizer/favorites" className={styles.actionBtn}>
                    ❤️ Voir les favoris
                </Link>
                <Link href="/organizer/events-upcoming" className={styles.actionBtn}>
                    📅 Événements à venir
                </Link>
                <Link href="/organizer/account" className={styles.actionBtn}>
                    👤 Mon profil
                </Link>
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.eventsSection}>
                    <div className={styles.sectionHeader}>
                        <h3>Mes événements récents</h3>
                        <Link href="/organizer/events" className={styles.linkAll}>Voir tout →</Link>
                    </div>

                    <div className={styles.eventsList}>
                        {events.length > 0 ? events.map((event) => {
                            // Mocking progress for sales
                            const sold = Math.floor(Math.random() * 80) + 10;
                            return (
                                <div key={event.id} className={styles.eventRow}>
                                    <img src={event.image_url || "/placeholder-event.jpg"} alt={event.title} className={styles.eventImage} />
                                    <div className={styles.eventData}>
                                        <h4 className={styles.eventTitle}>{event.title}</h4>
                                        <div className={styles.eventSales}>
                                            <div className={styles.salesInfo}>
                                                <span>0% des tickets vendus</span>
                                                <span>0/{event.total_tickets || 100}</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div className={styles.progress} style={{ width: `0%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={styles.eventActions}>
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>En vente</span>
                                        <button className={styles.editBtn}>Modifier</button>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className={styles.emptyState}>
                                <p>Vous n'avez pas encore créé d'événements.</p>
                                <Link href="/organizer/create" className={styles.smallBtn}>Créer mon premier événement</Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.salesChartSection}>
                        <h3>Ventes hebdomadaires</h3>
                        <div className={styles.miniChart}>
                            {[0, 0, 0, 0, 0, 0, 0].map((h, i) => (
                                <div key={i} className={styles.miniBarWrap}>
                                    <div className={styles.miniBar} style={{ height: `${h}%` }}></div>
                                    <span className={styles.dayLabel}>{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.accountCard}>
                        <h3>Profil Organisateur</h3>
                        <div className={styles.orgInfo}>
                            <div className={styles.orgAvatar}>{user?.email?.charAt(0).toUpperCase()}</div>
                            <div>
                                <p className={styles.orgName}>{user?.email?.split('@')[0]}</p>
                                <p className={styles.orgEmail}>{user?.email}</p>
                            </div>
                        </div>
                        <Link href="/organizer/account" className={styles.accountBtn}>Gérer mon compte</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
