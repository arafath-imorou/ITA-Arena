"use client";
// Version 1.1 - Auto-login flow


import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "../login/Auth.module.css";
import BackButton from "@/components/BackButton";

export default function RegisterPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else if (data.session) {
            // Si la confirmation est désactivée dans Supabase, data.session sera présent
            router.push("/organizer");
        } else {
            // Si la confirmation est encore activée
            setShowSuccess(true);
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback` // Standard callback fallback
            }
        });
        if (error) {
            setError(error.message);
        }
    };

    const handleClose = () => {
        setShowSuccess(false);
        // Usually, after signing up, users need to verify their email (Supabase default)
        // Or they should sign in directly.
        router.push("/login");
    };

    return (
        <div className={styles.authWrapper}>
            <BackButton className={styles.backBtn} />
            <div className={styles.authCard}>
                {/* Left Side: Illustration */}
                <div className={styles.illustrationSide}>
                    <div className={styles.bgPattern}>
                        ITA Arena ITA Arena ITA Arena ITA Arena ITA Arena ITA Arena ITA Arena
                        ITA Arena ITA Arena ITA Arena ITA Arena ITA Arena ITA Arena ITA Arena
                    </div>
                    <img
                        src="https://ouch-cdn2.icons8.com/m-Wc-3X1uY3_x4N4x3vO1_1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X.png"
                        alt="Illustration Register"
                        className={styles.illustrationImg}
                        style={{ filter: 'none', background: 'white', borderRadius: '50%', padding: '20px' }}
                    />
                </div>

                {/* Right Side: Form */}
                <div className={styles.formSide}>
                    <Link href="/" className={styles.backBtn}>←</Link>

                    <div className={styles.formHeader}>
                        <h1>Inscription</h1>
                    </div>

                    {error && (
                        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <form className={styles.authForm} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>E-mail *</label>
                            <div className={styles.inputWrapper}>
                                <input 
                                    type="email" 
                                    placeholder="votre@email.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Mot de passe *</label>
                            <div className={styles.inputWrapper}>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required 
                                    minLength={8}
                                />
                                <span className={styles.eyeIcon}>👁️</span>
                            </div>
                        </div>
                        <p className={styles.termsText} style={{ marginTop: '-10px' }}>
                            Il faut au moins 8 caractères.
                        </p>

                        <p className={styles.termsText}>
                            En créant votre compte, vous acceptez la <Link href="#">politique de confidentialité</Link> et les <Link href="#">conditions générales de vente</Link>.
                        </p>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Inscription en cours..." : "Inscription"}
                        </button>

                        <button type="button" className={styles.googleBtn} onClick={handleGoogleSignUp}>
                            <span className={styles.googleIcon}>G</span> Inscription avec Google
                        </button>

                        <div className={styles.switchAuth}>
                            Vous avez déjà un compte ? <Link href="/login">Connectez-vous</Link>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <span className={styles.closeModal} onClick={handleClose}>×</span>
                        <div className={styles.successIcon}>✓</div>
                        <h2>Succès</h2>
                        <p>
                            Inscription réussie. Un code de vérification a été envoyé par email.
                        </p>
                        <button className={styles.modalBtn} onClick={handleClose}>Aller à la page de connexion</button>
                    </div>
                </div>
            )}
        </div>
    );
}
