"use client";

import { useState, useEffect, Suspense } from "react";
import styles from "./Organizer.module.css";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

function DashboardContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode') === 'cotisations' ? 'cotisations' : 'events';
    
    const [stats, setStats] = useState({ primaryCount: 0, secondaryStat: 0, revenue: 0 });
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDashboardData() {
            if (!user) return;
            setLoading(true);

            try {
                const { data, error } = await supabase
                    .from('events_with_stats')
                    .select('*')
                    .eq('organizer_id', user.id)
                    .eq('type', mode === 'events' ? 'event' : 'cotisation')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    setItems(data);
                    setStats({
                        primaryCount: data.length,
                        secondaryStat: data.reduce((acc, item) => acc + (item.sold_count || 0), 0),
                        revenue: data.reduce((acc, item) => acc + Number(item.collected_amount || 0), 0)
                    });
                }
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, [user, mode]);

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement de vos données...</p>
        </div>
    );

    const isEvents = mode === 'events';

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Tableau de bord {isEvents ? "Événements" : "Cotisations"}</h1>
                    <p className={styles.subtitle}>Gérez vos {isEvents ? "événements et billetterie" : "collectes et cotisations"}</p>
                </div>
                <Link href={isEvents ? "/organizer/create" : "/organizer/cotisation/create"} className={styles.createBtn}>
                    <span>+</span> {isEvents ? "Créer un événement" : "Créer une cotisation"}
                </Link>
            </div>

            <div className={styles.overviewGrid}>
                <div className={`${styles.statCard} ${styles.statCardBlue}`}>
                    <div className={styles.statInfo}>
                        <span>{isEvents ? "Événements" : "Cotisations"} actifs</span>
                        <h2>{stats.primaryCount}</h2>
                    </div>
                    <div className={styles.statIcon}>{isEvents ? "📅" : "💰"}</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                    <div className={styles.statInfo}>
                        <span>{isEvents ? "Tickets vendus" : "Contributeurs"}</span>
                        <h2>{stats.secondaryStat}</h2>
                    </div>
                    <div className={styles.statIcon}>{isEvents ? "🎫" : "👥"}</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardSky}`}>
                    <div className={styles.statInfo}>
                        <span>Vues totales</span>
                        <h2>{items.reduce((acc, item) => acc + (item.views_count || 0), 0)}</h2>
                    </div>
                    <div className={styles.statIcon}>👁️</div>
                </div>

                <div className={`${styles.statCard} ${styles.statCardGold}`}>
                    <div className={styles.statInfo}>
                        <span>{isEvents ? "Revenus (F CFA)" : "Collecté (F CFA)"}</span>
                        <h2>{stats.revenue.toLocaleString()}</h2>
                    </div>
                    <div className={styles.statIcon}>{isEvents ? "💵" : "📈"}</div>
                </div>
            </div>

            <div className={styles.quickActions}>
                <Link href={isEvents ? "/organizer/create" : "/organizer/cotisation/create"} className={styles.actionBtnActive}>
                    <span>+</span> {isEvents ? "Créer événement" : "Créer cotisation"}
                </Link>
                <Link href={isEvents ? "/organizer/tickets" : "/organizer/cotisation/reports"} className={styles.actionBtn}>
                    {isEvents ? "🎫 Gérer tickets" : "📊 Rapports"}
                </Link>
                <Link href="/organizer/account" className={styles.actionBtn}>
                    👤 Mon profil
                </Link>
            </div>

            <div className={styles.dashboardGrid}>
                <div className={styles.eventsSection}>
                    <div className={styles.sectionHeader}>
                        <h3>{isEvents ? "Événements récents" : "Cotisations récentes"}</h3>
                        <Link href={isEvents ? "/organizer/events" : "/organizer/cotisations"} className={styles.linkAll}>Voir tout →</Link>
                    </div>

                    <div className={styles.eventsList}>
                        {items.length > 0 ? items.map((item) => {
                            const sold = item.sold_count || 0;
                            const total_capacity = item.total_capacity || 100;
                            const progress = Math.min(Math.round((sold / total_capacity) * 100), 100);
                            
                            return (
                                <div key={item.id} className={styles.eventRow}>
                                    <img src={item.image_url || "/placeholder-event.jpg"} alt={item.title} className={styles.eventImage} />
                                    <div className={styles.eventData}>
                                        <h4 className={styles.eventTitle}>{item.title}</h4>
                                        <div className={styles.eventSales}>
                                            <div className={styles.salesInfo}>
                                                <span>{progress}% {isEvents ? "vendus" : "collecté"}</span>
                                                <span>{isEvents ? `${sold}/${total_capacity}` : `${Number(item.collected_amount || 0).toLocaleString()} / ${Number(item.target_amount || 0).toLocaleString()} F`}</span>
                                            </div>
                                            <div className={styles.progressBar}>
                                                <div className={styles.progress} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.eventActions}>
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>{isEvents ? "En vente" : "Ouverte"}</span>
                                        <Link href={`/organizer/events/${item.id}`} className={styles.editBtn}>Gérer</Link>
                                    </div>
                                </div>

                            );
                        }) : (
                            <div className={styles.emptyState}>
                                <p>Vous n'avez pas encore de {isEvents ? "événements" : "cotisations"}.</p>
                                <Link href={isEvents ? "/organizer/create" : "/organizer/cotisation/create"} className={styles.smallBtn}>
                                    Créer {isEvents ? "mon premier événement" : "ma première cotisation"}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.rightColumn}>
                    <div className={styles.salesChartSection}>
                        <h3>{isEvents ? "Ventes hebdomadaires" : "Collecte hebdomadaire"}</h3>
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

export default function OrganizerDashboard() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <DashboardContent />
        </Suspense>
    );
}
