"use client";

import { useState } from "react";
import styles from "../Organizer.module.css";
import Link from "next/link";

export default function AccountPage() {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState({
        name: "Global Events Africa",
        email: "groupita25@gmail.com",
        phone: "002290152818100",
        address: "Parakou (BENIN)",
        bio: "La référence en organisation d'événements culturels et corporatifs en Afrique de l'Ouest.",
        website: "www.globalevents.bj"
    });

    const handleSave = () => {
        setIsEditing(false);
        // In a real app, you'd call supabase.from('organizers').update(...) here
        alert("Profil mis à jour avec succès !");
    };

    return (
        <div className={styles.accountPage}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Mon Compte</h1>
                    <p className={styles.subtitle}>Gérez les informations de votre profil organisateur</p>
                </div>
                {!isEditing ? (
                    <button className={styles.createBtn} onClick={() => setIsEditing(true)}>
                        Modifier le profil
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className={styles.editBtn} style={{ padding: '0.8rem 1.5rem' }} onClick={() => setIsEditing(false)}>
                            Annuler
                        </button>
                        <button className={styles.createBtn} onClick={handleSave}>
                            Enregistrer
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.accountGrid}>
                <div className={styles.profileCard}>
                    <div className={styles.profileHeader}>
                        <div className={styles.largeAvatar}>G</div>
                        <div>
                            <h3>{profile.name}</h3>
                            <p>{profile.email}</p>
                        </div>
                    </div>

                    <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                            <label>Téléphone</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                />
                            ) : (
                                <p>{profile.phone}</p>
                            )}
                        </div>
                        <div className={styles.infoItem}>
                            <label>Adresse</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={profile.address}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                />
                            ) : (
                                <p>{profile.address}</p>
                            )}
                        </div>
                        <div className={styles.infoItem}>
                            <label>Site web</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={profile.website}
                                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                                />
                            ) : (
                                <p>{profile.website}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.bioCard}>
                    <h3>À propos de l'organisateur</h3>
                    {isEditing ? (
                        <textarea
                            className={styles.bioArea}
                            value={profile.bio}
                            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        />
                    ) : (
                        <p className={styles.bioText}>{profile.bio}</p>
                    )}

                    <div className={styles.accountSecurity}>
                        <h3>Sécurité</h3>
                        <button className={styles.outlineBtn}>Changer le mot de passe</button>
                        <p className={styles.securityHint}>Dernière modification : il y a 3 mois</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
