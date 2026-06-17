"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import styles from "./VotesDashboard.module.css";
import { useRouter } from "next/navigation";

export default function VotesDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCampaigns = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('votes_campaigns')
                .select('*, vote_candidates(count), votes_cast(count, amount_paid)')
                .eq('organizer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampaigns(data || []);
        } catch (err: any) {
            console.error("Error fetching campaigns:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, [user]);

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        try {
            await supabase.from('votes_campaigns').update({ status: newStatus }).eq('id', id);
            setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: newStatus } : c));
        } catch (err) {
            alert("Erreur lors du changement de statut");
        }
    };

    const deleteCampaign = async (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette campagne de vote ? Tous les candidats et votes seront perdus.")) return;
        try {
            await supabase.from('votes_campaigns').delete().eq('id', id);
            setCampaigns(campaigns.filter(c => c.id !== id));
        } catch (err) {
            alert("Erreur de suppression");
        }
    };

    if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Chargement...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Mes Campagnes de Vote</h1>
                    <p className={styles.subtitle}>Gérez vos élections, concours et sondages</p>
                </div>
                <Link href="/organizer/votes/create" className={styles.createBtn}>
                    + Créer un vote
                </Link>
            </div>

            <div className={styles.grid}>
                {campaigns.map(campaign => {
                    const totalVotes = campaign.votes_cast[0]?.count || 0;
                    const totalRevenue = campaign.votes_cast.reduce((acc: number, v: any) => acc + (v.amount_paid || 0), 0);
                    const candidatesCount = campaign.vote_candidates[0]?.count || 0;

                    return (
                        <div key={campaign.id} className={styles.card}>
                            {campaign.cover_image && (
                                <div className={styles.cover} style={{ backgroundImage: `url(${campaign.cover_image})` }} />
                            )}
                            <div className={styles.cardBody}>
                                <div className={styles.cardHeader}>
                                    <span className={`${styles.badge} ${campaign.status === 'active' ? styles.badgeActive : styles.badgeDraft}`}>
                                        {campaign.status === 'active' ? 'Actif' : 'Brouillon'}
                                    </span>
                                    <span className={styles.badgeCategory}>{campaign.category || "Vote"}</span>
                                </div>
                                <h3 className={styles.cardTitle}>{campaign.title}</h3>
                                
                                <div className={styles.stats}>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Candidats</span>
                                        <span className={styles.statValue}>{candidatesCount}</span>
                                    </div>
                                    <div className={styles.stat}>
                                        <span className={styles.statLabel}>Votes</span>
                                        <span className={styles.statValue}>{totalVotes}</span>
                                    </div>
                                    {campaign.is_paid && (
                                        <div className={styles.stat}>
                                            <span className={styles.statLabel}>Revenus</span>
                                            <span className={styles.statValue}>{totalRevenue.toLocaleString()} {campaign.currency}</span>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.actions}>
                                    <button onClick={() => toggleStatus(campaign.id, campaign.status)} className={styles.actionBtn}>
                                        {campaign.status === 'active' ? '⏸️ Suspendre' : '▶️ Activer'}
                                    </button>
                                    <Link href={`/organizer/votes/${campaign.id}/candidates`} className={styles.actionBtn}>
                                        👥 Candidats
                                    </Link>
                                    <Link href={`/organizer/votes/${campaign.id}/results`} className={styles.actionBtn}>
                                        📊 Résultats
                                    </Link>
                                    <button onClick={() => deleteCampaign(campaign.id)} className={`${styles.actionBtn} ${styles.actionDelete}`}>
                                        🗑️
                                    </button>
                                </div>
                                
                                <div className={styles.publicLink}>
                                    <a href={`/vote/${campaign.id}`} target="_blank" rel="noreferrer">
                                        Voir la page publique ↗
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {campaigns.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>Vous n'avez pas encore de campagne de vote.</p>
                        <Link href="/organizer/votes/create" className={styles.createBtn}>
                            Créer ma première campagne
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
