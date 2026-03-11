import styles from "./Confirmation.module.css";
import Link from "next/link";

export default function ConfirmationPage() {
    return (
        <div className="container" style={{ paddingTop: '120px', textAlign: 'center', minHeight: '80vh' }}>
            <div className={styles.successIcon}>✅</div>
            <h1 className={styles.title}>Merci pour votre achat !</h1>
            <p className={styles.subtitle}>Vos billets ont été envoyés à <strong>votre@email.com</strong></p>

            <div className={styles.ticketDisplay}>
                <div className={styles.ticket}>
                    <div className={styles.ticketInfo}>
                        <span className={styles.eventCat}>CONCERT</span>
                        <h2>Davido Experience</h2>
                        <p>15 Juin 2024 • 20:00</p>
                        <p>Palais des Congrès, Cotonou</p>
                        <div className={styles.ticketType}>STANDARD</div>
                    </div>
                    <div className={styles.qrSection}>
                        <div className={styles.qrCode}>
                            {/* Simulate QR Code */}
                            <img
                                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ITA-ARENA-TICKET-12345"
                                alt="QR Code"
                            />
                        </div>
                        <span className={styles.ticketId}>#ITA-12345</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className="btn btn-primary">
                        📥 Télécharger en PDF
                    </button>
                    <Link href="/account" className="btn btn-outline">
                        👤 Voir mon compte
                    </Link>
                </div>
            </div>

            <div style={{ marginTop: '3rem' }}>
                <Link href="/" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                    ← Retour à l'accueil
                </Link>
            </div>
        </div>
    );
}
