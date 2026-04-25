"use client";

import { useState, useEffect } from "react";
import styles from "../Organizer.module.css";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

export default function AccountPage() {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        bio: "",
        website: ""
    });

    useEffect(() => {
        async function fetchProfile() {
            if (!user) return;
            
            const { data, error } = await supabase
                .schema('ita_arena')
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (data) {
                setProfile({
                    name: data.full_name || data.company_name || user.email?.split('@')[0] || "",
                    email: data.email || user.email || "",
                    phone: data.phone || "",
                    address: `${data.city || ""}${data.city && data.country ? ", " : ""}${data.country || ""}`,
                    bio: data.profession || data.business_sector || "",
                    website: ""
                });
            }
            setLoading(false);
        }
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsEditing(false);
        
        const { error } = await supabase
            .schema('ita_arena')
            .from('profiles')
            .update({
                full_name: profile.name,
                phone: profile.phone,
            })
            .eq('id', user.id);

        if (error) {
            alert("Erreur lors de la mise à jour : " + error.message);
        } else {
            alert("Profil mis à jour avec succès !");
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #FF5A1F', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
    );

    return (
        <div className={styles.accountPage}>
            <BackButton variant="dark" />
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
                        <div className={styles.largeAvatar}>{profile.name?.charAt(0).toUpperCase()}</div>
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
