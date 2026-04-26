"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./Auth.module.css";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else if (data.session) {
            router.push("/organizer");
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) setError(error.message);
    };

    return (
        <div className={styles.authWrapper}>
            <HomeButton className={styles.backBtn} variant="dark" />
            <div className={styles.authCard}>
                {/* Left Side: Illustration */}
                <div className={styles.illustrationSide}>
                    <div className={styles.bgPattern}>
                        ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA
                        ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA ITA ARENA
                    </div>
                    <img
                        src="/images/logo/ita_arena_logo.png"
                        alt="ITA Arena Logo"
                        className={styles.illustrationImg}
                        style={{ filter: 'none', background: 'white', borderRadius: '50%', padding: '30px', width: '220px', height: '220px', objectFit: 'contain' }}
                    />
                </div>

                {/* Right Side: Form */}
                <div className={styles.formSide}>
                    <Link href="/" className={styles.backBtn} title="Retour à l'accueil">🏠</Link>

                    <div className={styles.formHeader}>
                        <h1>Connexion</h1>
                    </div>

                    {error && (
                        <div style={{ 
                            color: '#d32f2f', 
                            marginBottom: '20px', 
                            padding: '12px', 
                            backgroundColor: '#ffebee', 
                            borderRadius: '8px', 
                            fontSize: '14px',
                            border: '1px solid #ffcdd2',
                            lineHeight: '1.5'
                        }}>
                            <strong>Email ou mot de passe incorrect.</strong>
                            <div style={{ marginTop: '8px' }}>
                                Vous n'avez pas encore de compte ? <Link href="/register" style={{ color: '#FF5A1F', fontWeight: 'bold', textDecoration: 'underline' }}>Inscrivez-vous ici</Link>
                            </div>
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
                                />
                                <span className={styles.eyeIcon}>👁️</span>
                            </div>
                        </div>

                        <Link href="#" className={styles.forgotPass}>Mot de passe oublié ?</Link>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Connexion..." : "Connexion"}
                        </button>

                        <button type="button" className={styles.googleBtn} onClick={handleGoogleLogin}>
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
