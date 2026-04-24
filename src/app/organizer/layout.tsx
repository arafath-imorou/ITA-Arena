"use client";

import styles from "./OrganizerLayout.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function OrganizerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

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
                            alt="ITA Arena Logo"
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
                        <div className={styles.collapsibleNav}>
                            <Link
                                href="/organizer/tickets"
                                className={`${styles.navItem} ${pathname.startsWith('/organizer/tickets') ? styles.activeNavItem : ''}`}
                            >
                                <span className={styles.navIcon}>🎫</span> Mes tickets
                                <span className={styles.chevron}>⌄</span>
                            </Link>
                            <div className={styles.subNav}>
                                <Link href="/organizer/tickets?tab=upcoming" className={styles.subNavItem}>Mes tickets en cours</Link>
                                <Link href="/organizer/tickets?tab=unfinished" className={styles.subNavItem}>Mes commandes non terminées</Link>
                                <Link href="/organizer/tickets?tab=transferred" className={styles.subNavItem}>Mes tickets transférés</Link>
                                <Link href="/organizer/tickets?tab=cancelled" className={styles.subNavItem}>Mes tickets annulés</Link>
                                <Link href="/organizer/tickets?tab=past" className={styles.subNavItem}>Mes tickets passés</Link>
                            </div>
                        </div>
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
                    <p>© 2026 ITA Arena.</p>
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
                        <div className={styles.profileMenu} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            <div className={styles.avatar}>G</div>
                            <span className={styles.organizerName}>Global Events</span>
                            <span className={styles.chevron}>⌄</span>

                            {showProfileDropdown && (
                                <div className={styles.topDropdown} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.dropdownHeader}>
                                        <p className={styles.dropdownEmail}>arafathimorou@gmail.com</p>
                                        <p className={styles.dropdownCode}>Code client: <span style={{ color: '#e53e3e', fontWeight: 800 }}>560337</span></p>
                                    </div>
                                    <hr className={styles.dropdownDivider} />
                                    <Link href="/profile" className={styles.dropdownItem}>Mon Profil</Link>
                                    <Link href="/organizer/account" className={styles.dropdownItem}>Paramètres</Link>
                                    <hr className={styles.dropdownDivider} />
                                    <button onClick={handleLogout} className={styles.dropdownLogoutBtn}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                                        Déconnexion
                                    </button>
                                </div>
                            )}
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
