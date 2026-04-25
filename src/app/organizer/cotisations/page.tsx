"use client";

import { useState, useEffect, Suspense } from "react";
import styles from "../Organizer.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import BackButton from "@/components/BackButton";

function CotisationsListContent() {
    const { user } = useAuth();
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCotisations() {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .schema('ita_arena')
                .from('events')
                .select('*')
                .eq('organizer_id', user.id)
                .eq('type', 'cotisation')
                .order('created_at', { ascending: false });

            if (data) setItems(data);
            setLoading(false);
        }
        fetchCotisations();
    }, [user]);

    return (
        <div>
            <BackButton variant="dark" />
            <div className={styles.header} style={{ marginTop: '1rem' }}>
                <div>
                    <h1 className={styles.title}>Toutes mes Cotisations</h1>
                    <p className={styles.subtitle}>Suivez vos collectes de fonds et cotisations</p>
                </div>
                <Link href="/organizer/cotisation/create" className={styles.createBtn}>
                    <span>+</span> Nouvelle cotisation
                </Link>
            </div>

            <div className={styles.eventsList} style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid #eee' }}>
                {loading ? (
                    <p>Chargement...</p>
                ) : items.length > 0 ? (
                    items.map((item) => (
                        <div key={item.id} className={styles.eventRow} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                            <img src={item.image_url || "/placeholder-event.jpg"} alt={item.title} className={styles.eventImage} />
                            <div className={styles.eventData}>
                                <h4 className={styles.eventTitle}>{item.title}</h4>
                                <div className={styles.eventMeta}>
                                    <span>💰 Objectif: {item.target_amount?.toLocaleString() || 0} F CFA</span>
                                    <span>📅 Fin: {item.date.replace("Jusqu'au ", "")}</span>
                                </div>
                            </div>
                            <div className={styles.eventActions}>
                                <button className={styles.editBtn}>Gérer</button>
                                <button className={styles.editBtn} style={{ color: '#e53e3e', borderColor: '#fed7d7' }}>Supprimer</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <p>Aucune cotisation trouvée.</p>
                        <Link href="/organizer/cotisation/create" className={styles.smallBtn}>Créer ma première cotisation</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OrganizerCotisationsPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <CotisationsListContent />
        </Suspense>
    );
}
