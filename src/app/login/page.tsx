"use client";

import Link from "next/link";
import styles from "./Auth.module.css";

export default function LoginPage() {
    return (
        <div className={styles.authWrapper}>
            <div className={styles.authCard}>
                {/* Left Side: Illustration */}
                <div className={styles.illustrationSide}>
                    <div className={styles.bgPattern}>
                        ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA
                        ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA
                    </div>
                    <img
                        src="https://ouch-cdn2.icons8.com/P0-10lI6_3X1uY3_x4N4x3vO1_1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X.png"
                        alt="Illustration Login"
                        className={styles.illustrationImg}
                        style={{ filter: 'none', background: 'white', borderRadius: '50%', padding: '20px' }}
                    />
                </div>

                {/* Right Side: Form */}
                <div className={styles.formSide}>
                    <Link href="/" className={styles.backBtn}>←</Link>

                    <div className={styles.formHeader}>
                        <h1>Connexion</h1>
                    </div>

                    <form className={styles.authForm} onSubmit={(e) => e.preventDefault()}>
                        <div className={styles.inputGroup}>
                            <label>E-mail *</label>
                            <div className={styles.inputWrapper}>
                                <input type="email" placeholder="votre@email.com" required />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Mot de passe *</label>
                            <div className={styles.inputWrapper}>
                                <input type="password" placeholder="••••••••" required />
                                <span className={styles.eyeIcon}>👁️</span>
                            </div>
                        </div>

                        <Link href="#" className={styles.forgotPass}>Mot de passe oublié ?</Link>

                        <button type="submit" className={styles.submitBtn}>
                            Connexion
                        </button>

                        <button type="button" className={styles.googleBtn}>
                            <span className={styles.googleIcon}>G</span> Connexion avec Google
                        </button>

                        <div className={styles.switchAuth}>
                            Vous n'avez pas de compte ? <Link href="/register">Inscrivez-vous</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
