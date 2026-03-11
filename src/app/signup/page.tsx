"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./Auth.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
            setSuccess(true);
        }
        setLoading(false);
    };

    if (success) {
        return (
            <div className={styles.authPage}>
                <div className={styles.authCard}>
                    <div className={styles.header}>
                        <div className={styles.successIcon}>📧</div>
                        <h1 className={styles.title}>Vérifiez votre boîte mail</h1>
                        <p className={styles.subtitle}>
                            Un lien de confirmation a été envoyé à <strong>{email}</strong>.
                            Veuillez cliquer sur le lien pour activer votre compte.
                        </p>
                    </div>
                    <div className={styles.footer}>
                        <Link href="/signin" className={styles.link}>Aller à la page de connexion</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Créer un compte</h1>
                    <p className={styles.subtitle}>Rejoignez ITA ARENA dès aujourd'hui</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleSignUp}>
                    <div className={styles.inputGroup}>
                        <label>E-mail</label>
                        <input
                            type="email"
                            className={styles.input}
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            className={styles.input}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? "Chargement..." : "S'inscrire"}
                    </button>
                </form>

                <div className={styles.footer}>
                    Déjà un compte ? <Link href="/signin" className={styles.link}>Se connecter</Link>
                </div>
            </div>
        </div>
    );
}
