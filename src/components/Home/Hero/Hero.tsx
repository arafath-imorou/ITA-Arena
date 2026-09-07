import styles from "./Hero.module.css";
import Link from "next/link";

export default function Hero() {
    return (
        <section className={styles.hero}>
            <div className={styles.heroOverlay}></div>
            <div className={`container ${styles.heroContent}`}>
                <div className={styles.heroText}>
                    <h1 className={styles.heroTitle}>
                        La scène digitale<br />
                        <span>des grands événements</span>
                    </h1>
                    <p className={styles.heroSubTitle}>
                        La plateforme tout-en-un des événements et communautés.
                    </p>
                    <div className={styles.heroActions} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: 'center' }}>
                        <Link href="/organizer/create-hub" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                            Créer un événement
                        </Link>
                        <Link href="/about" className="btn btn-outline" style={{ borderColor: 'white', color: 'white', padding: '8px 16px', fontSize: '0.85rem' }}>
                            Qui sommes nous ?
                        </Link>
                        <Link href="#solutions" className="btn btn-outline" style={{ borderColor: 'white', color: 'white', padding: '8px 16px', fontSize: '0.85rem' }}>
                            Nos Solutions
                        </Link>
                        <Link href="#explore" className="btn btn-outline" style={{ borderColor: 'white', color: 'white', padding: '8px 16px', fontSize: '0.85rem' }}>
                            Nos évènements en cours
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
