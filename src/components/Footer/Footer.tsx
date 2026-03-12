import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={`container ${styles.footerContainer}`}>
                <div className={styles.footerTop}>
                    <div className={styles.footerBrand}>
                        <Link href="/" className={styles.logo}>
                            <img src="/images/logo/ita_arena_logo.png" alt="ITA Arena Logo" className={styles.footerLogo} />
                            <div className={styles.logoText}>
                                <span className={styles.logoIta}>ITA</span>
                                <span className={styles.logoArena}>Arena</span>
                            </div>
                        </Link>
                        <p className={styles.footerDesc}>
                            La scène digitale des grands événements. La billetterie premium pour l'Afrique.
                        </p>
                    </div>

                    <div className={styles.footerLinksGrid}>
                        <div className={styles.footerGroup}>
                            <h4 className={styles.groupTitle}>Plateforme</h4>
                            <ul className={styles.links}>
                                <li><Link href="/events">Explorer les événements</Link></li>
                                <li><Link href="/organizer">Espace Organisateur</Link></li>
                                <li><Link href="/pricing">Tarifs</Link></li>
                                <li><Link href="/faq">FAQ</Link></li>
                            </ul>
                        </div>

                        <div className={styles.footerGroup}>
                            <h4 className={styles.groupTitle}>Entreprise</h4>
                            <ul className={styles.links}>
                                <li><Link href="/about">À propos</Link></li>
                                <li><Link href="/contact">Contact</Link></li>
                                <li><Link href="/blog">Blog</Link></li>
                            </ul>
                        </div>

                        <div className={styles.footerGroup}>
                            <h4 className={styles.groupTitle}>Légal</h4>
                            <ul className={styles.links}>
                                <li><Link href="/terms">Conditions Générales</Link></li>
                                <li><Link href="/privacy">Confidentialité</Link></li>
                                <li><Link href="/cookies">Politique Cookies</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <p>&copy; {currentYear} ITA Arena. Tous droits réservés.</p>
                    <div className={styles.socials}>
                        {/* Social Icons would go here */}
                        <span className={styles.socialLink}>FB</span>
                        <span className={styles.socialLink}>TW</span>
                        <span className={styles.socialLink}>IG</span>
                        <span className={styles.socialLink}>LN</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
