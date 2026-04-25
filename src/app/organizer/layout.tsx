"use client";

import styles from "./OrganizerLayout.module.css";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function OrganizerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #FF5A1F', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!user) return null;

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
                            href="/organizer?mode=events"
                            className={`${styles.navItem} ${pathname === '/organizer' && (new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('mode') !== 'cotisations') ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>📊</span> Dashboard Événements
                        </Link>
                    </div>

                    <div className={styles.navGroup}>
                        <span className={styles.groupLabel}>Cotisations</span>
                        <Link
                            href="/organizer/cotisation/create"
                            className={`${styles.navItem} ${pathname === '/organizer/cotisation/create' ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>💰</span> Créer une cotisation
                        </Link>
                        <Link
                            href="/organizer?mode=cotisations"
                            className={`${styles.navItem} ${pathname === '/organizer' && (new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('mode') === 'cotisations') ? styles.activeNavItem : ''}`}
                        >
                            <span className={styles.navIcon}>📈</span> Dashboard Cotisations
                        </Link>
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
                        <Link href="/organizer?mode=events" className={`${styles.topTab} ${(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('mode') !== 'cotisations') ? styles.activeTab : ''}`}>📅 Événements</Link>
                        <Link href="/organizer?mode=cotisations" className={`${styles.topTab} ${(new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('mode') === 'cotisations') ? styles.activeTab : ''}`}>💰 Cotisations</Link>
                    </div>
                    <div className={styles.topIcons}>
                        <div className={styles.notifIcon}>🔔 <span className={styles.dot}></span></div>
                        <Link href="/" className={styles.homeIcon}>🏠</Link>
                        <div className={styles.profileMenu} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                            <div className={styles.avatar}>{user?.email?.charAt(0).toUpperCase()}</div>
                            <span className={styles.organizerName}>{user?.email?.split('@')[0]}</span>
                            <span className={styles.chevron}>⌄</span>

                            {showProfileDropdown && (
                                <div className={styles.topDropdown} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.dropdownHeader}>
                                        <p className={styles.dropdownEmail}>{user?.email}</p>
                                        <p className={styles.dropdownCode}>Code client: <span style={{ color: '#e53e3e', fontWeight: 800 }}>INVITE</span></p>
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
