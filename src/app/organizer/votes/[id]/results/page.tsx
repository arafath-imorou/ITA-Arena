"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import styles from "./VoteResults.module.css";
import Link from "next/link";

export default function VoteResultsPage() {
    const params = useParams();
    const router = useRouter();
    const campaignId = params.id as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [votes, setVotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!campaignId) return;

        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch Campaign
                const { data: campaignData, error: campError } = await supabase
                    .from('votes_campaigns')
                    .select('*')
                    .eq('id', campaignId)
                    .single();
                if (campError) throw campError;
                setCampaign(campaignData);

                // Fetch Candidates
                const { data: candsData, error: candsError } = await supabase
                    .from('vote_candidates')
                    .select('*')
                    .eq('campaign_id', campaignId);
                if (candsError) throw candsError;

                // Fetch Votes
                const { data: votesData, error: votesError } = await supabase
                    .from('votes_cast')
                    .select('*')
                    .eq('campaign_id', campaignId);
                if (votesError) throw votesError;

                setVotes(votesData || []);

                // Calculate Results
                const candidatesWithScores = (candsData || []).map(cand => {
                    const candVotes = (votesData || []).filter(v => v.candidate_id === cand.id);
                    const totalVotes = candVotes.reduce((sum, v) => sum + (v.vote_count || 1), 0);
                    return { ...cand, totalVotes };
                }).sort((a, b) => b.totalVotes - a.totalVotes);

                setCandidates(candidatesWithScores);

            } catch (err) {
                console.error(err);
                alert("Erreur lors du chargement des données.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [campaignId]);

    if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Chargement...</div>;
    if (!campaign) return <div style={{ padding: "4rem", textAlign: "center" }}>Campagne introuvable.</div>;

    const totalVotesCast = votes.reduce((sum, v) => sum + (v.vote_count || 1), 0);
    const totalRevenue = votes.reduce((sum, v) => sum + (v.amount_paid || 0), 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <Link href="/organizer/votes" className={styles.backLink}>← Retour aux campagnes</Link>
                    <h1 className={styles.title}>{campaign.title} - Résultats en direct</h1>
                    <p className={styles.subtitle}>Classement officiel et statistiques</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.exportBtn}>📥 Exporter CSV</button>
                    <a href={`/vote/${campaign.id}`} target="_blank" rel="noreferrer" className={styles.publicBtn}>
                        Voir la page publique ↗
                    </a>
                </div>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <h3>Nombre de candidats</h3>
                    <div className={styles.statNumber}>{candidates.length}</div>
                </div>
                <div className={styles.statCard}>
                    <h3>Votes totaux</h3>
                    <div className={styles.statNumber}>{totalVotesCast}</div>
                </div>
                <div className={styles.statCard}>
                    <h3>Votants uniques</h3>
                    <div className={styles.statNumber}>{new Set(votes.map(v => v.voter_email)).size}</div>
                </div>
                {campaign.is_paid && (
                    <div className={styles.statCard}>
                        <h3>Revenus générés</h3>
                        <div className={`${styles.statNumber} ${styles.statRevenue}`}>
                            {totalRevenue.toLocaleString()} {campaign.currency}
                        </div>
                    </div>
                )}
            </div>

            <h2 className={styles.sectionTitle}>Classement Actuel</h2>
            <div className={styles.rankingList}>
                {candidates.map((cand, index) => {
                    const percentage = totalVotesCast > 0 ? Math.round((cand.totalVotes / totalVotesCast) * 100) : 0;
                    return (
                        <div key={cand.id} className={styles.rankingCard}>
                            <div className={styles.rankBadge} data-rank={index + 1}>
                                #{index + 1}
                            </div>
                            <div className={styles.candPhoto} style={{ backgroundImage: `url(${cand.photo_url || '/placeholder.png'})` }}></div>
                            
                            <div className={styles.candInfo}>
                                <h3>{cand.name} {cand.number && <span className={styles.candNumber}>N°{cand.number}</span>}</h3>
                                <p>{cand.category}</p>
                            </div>

                            <div className={styles.progressContainer}>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${percentage}%` }}></div>
                                </div>
                                <span className={styles.percentage}>{percentage}%</span>
                            </div>

                            <div className={styles.candScore}>
                                <span className={styles.scoreNumber}>{cand.totalVotes}</span>
                                <span className={styles.scoreLabel}>votes</span>
                            </div>
                        </div>
                    );
                })}
                {candidates.length === 0 && (
                    <div className={styles.emptyState}>Aucun candidat enregistré pour cette campagne.</div>
                )}
            </div>
        </div>
    );
}
