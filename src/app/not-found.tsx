"use client";

import styles from "./NotFound.module.css";
import HomeButton from "@/components/HomeButton";

export default function NotFound() {
    return (
        <div className={styles.notFoundWrapper}>
            <div className={styles.errorNumber}>404</div>
            <div className={styles.notFoundContent}>
                <div className={styles.errorIcon}>🏟️</div>
                <h1 className={styles.errorTitle}>Oups ! Vous êtes hors jeu</h1>
                <p className={styles.errorText}>
                    La page que vous recherchez semble avoir quitté l'arène ou n'a jamais existé.
                </p>
                <div className={styles.actions}>
                    <HomeButton variant="dark" label="Retour à l'arène" />
                </div>
            </div>
        </div>
    );
}
