"use client";

import { useState, useEffect } from "react";
import styles from "./Organizer.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

// Placeholder for current organizer until real auth is integrated
const ORGANIZER_ID = 'd5d140e6-921a-4c9c-b36d-dcc6c478a846';

export default function OrganizerDashboard() {
    const [stats, setStats] = useState({ tickets: 0, revenue: 0, views: 0, eventsCount: 0 });
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            setLoading(true);

            // Fetch all events for this organizer
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .eq('organizer_id', ORGANIZER_ID)
                .order('created_at', { ascending: false });

            if (eventsData) {
                setEvents(eventsData);

                // Calculate some basic stats from events
                // In a real app, these would come from a 'tickets_sold' or 'orders' table
                const totalEvents = eventsData.length;

                // Mocking sales data since we don't have a real transactions table yet
                setStats({
                    tickets: 145, // Placeholder
                    revenue: 250000, // Placeholder
                    views: 1240, // Placeholder
                    eventsCount: totalEvents
                });
            }

            setLoading(false);
        }

        fetchDashboardData();
    }, []);

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
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Billets vendus</span>
                        <h2>{new Intl.NumberFormat('fr-FR').format(stats.tickets)}</h2>
                        <p className={styles.trendUp}>+5.2% cette semaine</p>
                    </div>
                    <div className={styles.statIcon}>🎫</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Chiffre d'affaires (F CFA)</span>
                        <h2>{new Intl.NumberFormat('fr-FR').format(stats.revenue)}</h2>
                        <p className={styles.trendUp}>+12.1% cette semaine</p>
                    </div>
                    <div className={styles.statIcon}>💰</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Événements créés</span>
                        <h2>{stats.eventsCount}</h2>
                        <p className={styles.trendNeutral}>En ligne actuellement</p>
                    </div>
                    <div className={styles.statIcon}>📅</div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Portée globale</span>
                        <h2>{new Intl.NumberFormat('fr-FR').format(stats.views)}</h2>
                        <p className={styles.trendUp}>+240 vues</p>
                    </div>
                    <div className={styles.statIcon}>🚀</div>
                </div>
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
                                                <span>{sold}% des tickets vendus</span>
                                                <span>{sold}/100</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div className={styles.progress} style={{ width: `${sold}%` }}></div>
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
                            {[30, 60, 40, 80, 50, 90, 70].map((h, i) => (
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
                            <div className={styles.orgAvatar}>G</div>
                            <div>
                                <p className={styles.orgName}>Global Events Africa</p>
                                <p className={styles.orgEmail}>groupita25@gmail.com</p>
                            </div>
                        </div>
                        <Link href="/organizer/account" className={styles.accountBtn}>Gérer mon compte</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
