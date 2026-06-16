import styles from "./Hero.module.css";
import Link from "next/link";

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroOverlay}></div>
            <div className={`container ${styles.heroContent}`}>
                <div className={styles.heroText}>
                    <span className={styles.badge}>La scène digitale des grands événements</span>
                    <h1 className={styles.heroTitle}>
                        Plus qu’une billetterie, <br />
                        <span>une expérience événementielle</span>
                    </h1>
                    <p className={styles.heroSubTitle}>
                        Réservez vos billets en ligne et vivez vos événements sans stress avec ITA Arena.
                    </p>
                    <div className={styles.heroActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                        <Link href="#events-grid" className="btn btn-primary">
                            🎟️ Voir les événements
                        </Link>
                        <Link href="/organizer/create" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                            📅 Publier un événement
                        </Link>
                        <Link href="/organizer/cotisation/create" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                            🤝 Lancer une cotisation
                        </Link>
                        <Link href="/organizer/support-campaign/create" className="btn btn-outline" style={{ borderColor: 'white', color: 'white' }}>
                            ❤️ Créer votre Campagne de Soutien
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
