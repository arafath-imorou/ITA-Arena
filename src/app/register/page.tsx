"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "../login/Auth.module.css";
import BackButton from "@/components/BackButton";

type UserType = "particulier" | "entreprise";

export default function RegisterPage() {
    const [userType, setUserType] = useState<UserType>("particulier");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();

    // Form states
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        contact: "",
        profession: "",
        city: "",
        country: "",
        companyName: "",
        businessSector: "",
        founderName: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }

        const metadata = userType === "particulier" 
            ? {
                user_type: "particulier",
                first_name: formData.firstName,
                last_name: formData.lastName,
                full_name: `${formData.firstName} ${formData.lastName}`,
                phone: formData.contact,
                profession: formData.profession,
                city: formData.city,
                country: formData.country,
              }
            : {
                user_type: "entreprise",
                company_name: formData.companyName,
                full_name: formData.companyName,
                business_sector: formData.businessSector,
                city: formData.city,
                country: formData.country,
                founder_name: formData.founderName,
                phone: formData.contact,
              };

        const { data, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: metadata,
                emailRedirectTo: `${window.location.origin}/auth/callback`
            }
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
        } else {
            // Even if auto-logged in, the user wants a redirect to login
            setShowSuccess(true);
            setLoading(false);
            // Optional: Sign out if auto-logged in to force login
            if (data.session) {
                await supabase.auth.signOut();
            }
        }
    };

    const handleClose = () => {
        setShowSuccess(false);
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
                        src="https://ouch-cdn2.icons8.com/m-Wc-3X1uY3_x4N4x3vO1_1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X4z1X.png"
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
                        <p style={{ color: '#666', marginTop: '5px' }}>Rejoignez ITA ARENA dès aujourd'hui</p>
                    </div>

                    {/* Account Type Selector */}
                    <div className={styles.typeSelector}>
                        <button 
                            type="button"
                            className={`${styles.typeBtn} ${userType === "particulier" ? styles.activeType : ""}`}
                            onClick={() => setUserType("particulier")}
                        >
                            Particulier
                        </button>
                        <button 
                            type="button"
                            className={`${styles.typeBtn} ${userType === "entreprise" ? styles.activeType : ""}`}
                            onClick={() => setUserType("entreprise")}
                        >
                            Entreprise
                        </button>
                    </div>

                    {error && (
                        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '14px' }}>
                            {error}
                        </div>
                    )}

                    <form className={styles.authForm} onSubmit={handleSubmit}>
                        {userType === "particulier" ? (
                            <>
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Nom *</label>
                                        <div className={styles.inputWrapper}>
                                            <input name="lastName" placeholder="Nom" value={formData.lastName} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Prénom *</label>
                                        <div className={styles.inputWrapper}>
                                            <input name="firstName" placeholder="Prénom" value={formData.firstName} onChange={handleChange} required />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Contact *</label>
                                        <div className={styles.inputWrapper}>
                                            <input name="contact" placeholder="+229 ..." value={formData.contact} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Profession</label>
                                        <div className={styles.inputWrapper}>
                                            <input name="profession" placeholder="Votre métier" value={formData.profession} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.inputGroup}>
                                    <label>Dénomination de l'entreprise *</label>
                                    <div className={styles.inputWrapper}>
                                        <input name="companyName" placeholder="Nom de l'entreprise" value={formData.companyName} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label>Secteur d'activité *</label>
                                        <div className={styles.inputWrapper}>
                                            <input name="businessSector" placeholder="Ex: Technologie" value={formData.businessSector} onChange={handleChange} required />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label>Contact *</label>
                                        <div className={styles.inputWrapper}>
                                            <input name="contact" placeholder="+229 ..." value={formData.contact} onChange={handleChange} required />
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Nom et Prénom du promoteur *</label>
                                    <div className={styles.inputWrapper}>
                                        <input name="founderName" placeholder="Nom complet du responsable" value={formData.founderName} onChange={handleChange} required />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className={styles.inputRow}>
                            <div className={styles.inputGroup}>
                                <label>Ville *</label>
                                <div className={styles.inputWrapper}>
                                    <input name="city" placeholder="Cotonou" value={formData.city} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Pays *</label>
                                <div className={styles.inputWrapper}>
                                    <input name="country" placeholder="Bénin" value={formData.country} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Email *</label>
                            <div className={styles.inputWrapper}>
                                <input name="email" type="email" placeholder="votre@email.com" value={formData.email} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className={styles.inputRow}>
                            <div className={styles.inputGroup}>
                                <label>Mot de passe *</label>
                                <div className={styles.inputWrapper}>
                                    <input name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required minLength={8} />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Confirmation *</label>
                                <div className={styles.inputWrapper}>
                                    <input name="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>

                        <p className={styles.termsText}>
                            En créant votre compte, vous acceptez notre <Link href="#">politique de confidentialité</Link>.
                        </p>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? "Enregistrement..." : "Enregistrer et confirmer"}
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
                        <div className={styles.successIcon}>✓</div>
                        <h2>Inscription réussie !</h2>
                        <p>
                            Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter avec vos identifiants.
                        </p>
                        <button className={styles.modalBtn} onClick={handleClose} style={{ background: '#FF5A1F' }}>Se connecter</button>
                    </div>
                </div>
            )}
        </div>
    );
}
