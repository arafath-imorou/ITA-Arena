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
        totalEvents: 0
    });
    const [events, setEvents] = useState<any[]>([]);
    const [organizers, setOrganizers] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push("/login");
            return;
        }

        async function verifyAdmin() {
            const { data: profile } = await supabase
                .schema('ita_arena')
                .from('profiles')
                .select('role')
                .eq('id', user?.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push("/"); // Redirect if not admin
                return;
            }
            setIsAdmin(true);
            fetchAdminData();
        }

        async function fetchAdminData() {
            setLoading(true);
            try {
                // 1. Fetch Organizers
                const { data: orgs } = await supabase
                    .schema('ita_arena')
                    .from('profiles')
                    .select('*')
                    .eq('role', 'organizer');
                
                // 2. Fetch Events
                const { data: evts } = await supabase
                    .schema('ita_arena')
                    .from('events')
                    .select('*, profiles(email)')
                    .order('created_at', { ascending: false });

                // 3. Fetch Tickets
                const { data: tix } = await supabase
                    .schema('ita_arena')
                    .from('tickets')
                    .select('*')
                    .eq('status', 'valid');

                const totalRev = (tix || []).reduce((acc, t) => acc + Number(t.amount), 0);

                setStats({
                    totalRevenue: totalRev,
                    totalTickets: (tix || []).length,
                    totalOrganizers: (orgs || []).length,
                    totalEvents: (evts || []).length
                });

                setEvents(evts || []);
                setOrganizers(orgs || []);

            } catch (err) {
                console.error("Admin Data Error:", err);
            } finally {
                setLoading(false);
            }
        }

        verifyAdmin();
    }, [user, router]);

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement de la tour de contrôle...</p>
        </div>
    );

    if (!isAdmin) return null;

    return (
        <div className={styles.adminWrapper}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Super Admin Dashboard</h1>
                    <p className={styles.subtitle}>Vue d'ensemble de la plateforme ITA Arena</p>
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
                        <span>Total Tickets</span>
                        <h2>{stats.totalTickets}</h2>
                    </div>
                    <div className={styles.statIcon}>🎫</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Organisateurs</span>
                        <h2>{stats.totalOrganizers}</h2>
                    </div>
                    <div className={styles.statIcon}>👥</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statInfo}>
                        <span>Événements</span>
                        <h2>{stats.totalEvents}</h2>
                    </div>
                    <div className={styles.statIcon}>📅</div>
                </div>
            </div>

            <div className={styles.dashboardContent}>
                <div className={styles.section}>
                    <h3>Tous les Événements</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Événement</th>
                                    <th>Organisateur</th>
                                    <th>Date</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(e => (
                                    <tr key={e.id}>
                                        <td><strong>{e.title}</strong></td>
                                        <td>{e.profiles?.email || 'Inconnu'}</td>
                                        <td>{new Date(e.date).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`${styles.badge} ${e.is_published ? styles.badgeSuccess : styles.badgeInfo}`}>
                                                {e.is_published ? "Publié" : "Brouillon"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className={styles.section}>
                    <h3>Derniers Organisateurs</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {organizers.slice(0, 5).map(o => (
                            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ width: '40px', height: '40px', background: '#ff5a1f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                    {o.email?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>{o.company_name || o.full_name || o.email?.split('@')[0]}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>{o.email}</p>
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
