"use client";

import styles from "./OrganizerLayout.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OrganizerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error signing out:", error);
        }
        router.push('/');
    };

    return (
        <div className={styles.dashboardLayout}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>
                        <img
                            src="/images/logo/ita_arena_logo.png"
                            alt="ITA ARENA Logo"
                            className={styles.logoImage}
                        />
                    </Link>
                </div>

                <nav className={styles.sideNav}>
                    <Link
                        href="/organizer"
                        className={`${styles.navItem} ${pathname === '/organizer' ? styles.activeNavItem : ''}`}
                    >
                        <span className={styles.navIcon}>📊</span> Tableau de bord
                    </Link>

                    <div className={styles.navGroup}>
                        <span className={styles.groupLabel}>Événements</span>
                        <Link
                            href="/organizer/create"
                            className={`${styles.navItem} ${pathname === '/organizer/create' ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>➕</span> Créer un événement
                        </Link>
                        <Link
                            href="/organizer/events-upcoming"
                            className={`${styles.navItem} ${pathname === '/organizer/events-upcoming' ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>📅</span> Événements à venir
                        </Link>
                        <Link
                            href="/organizer/events-past"
                            className={`${styles.navItem} ${pathname === '/organizer/events-past' ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>⌛</span> Événements passés
                        </Link>
                        <div className={styles.navItemWithBadge}>
                            <Link
                                href="/organizer/events-draft"
                                className={`${styles.navItem} ${pathname === '/organizer/events-draft' ? styles.activeNavItem : ''}`}
                            >
                                <span className={styles.navIcon}>📝</span> Événements en préparation
                            </Link>
                            <span className={styles.navBadge}>1</span>
                        </div>
                    </div>

                    <div className={styles.navGroup}>
                        <span className={styles.groupLabel}>Tickets et Profil</span>
                        <Link
                            href="/organizer/tickets"
                            className={`${styles.navItem} ${pathname === '/organizer/tickets' ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>🎫</span> Mes tickets
                        </Link>
                    </div>

                    <div className={styles.navGroup}>
                        <span className={styles.groupLabel}>Paramètres</span>
                        <Link
                            href="/organizer/account"
                            className={`${styles.navItem} ${pathname === '/organizer/account' ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>👤</span> Mon Compte
                        </Link>
                        <button onClick={handleLogout} className={styles.logoutBtn}>
                            <span className={styles.navIcon}>🚪</span> Déconnexion
                        </button>
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <p>Version 2.0.0</p>
                    <p>© 2026 ITA ARENA.</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={styles.mainArea}>
                {/* Top Header */}
                <header className={styles.topHeader}>
                    <div className={styles.topTabs}>
                        <Link href="/organizer" className={`${styles.topTab} ${pathname === '/organizer' ? styles.activeTab : ''}`}>📈 Ventes</Link>
                        <Link href="/organizer/events" className={`${styles.topTab} ${pathname === '/organizer/events' ? styles.activeTab : ''}`}>📅 Événements</Link>
                    </div>
                    <div className={styles.topIcons}>
                        <div className={styles.notifIcon}>🔔 <span className={styles.dot}></span></div>
                        <Link href="/" className={styles.homeIcon}>🏠</Link>
                        <div className={styles.profileMenu}>
                            <div className={styles.avatar}>G</div>
                            <span className={styles.organizerName}>Global Events</span>
                            <span className={styles.chevron}>⌄</span>
                        </div>
                    </div>
                </header>

                <div className={styles.contentPadding}>
                    {children}
                </div>
            </main>
        </div>
    );
}
