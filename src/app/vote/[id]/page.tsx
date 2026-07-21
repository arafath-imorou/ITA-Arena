"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import styles from "./PublicVote.module.css";
import Script from "next/script";

declare global {
    interface Window {
        FedaPay: any;
    }
}

export default function PublicVotePage() {
    const params = useParams();
    const campaignId = params.id as string;
    
    const [campaign, setCampaign] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [voteCount, setVoteCount] = useState(1);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!campaignId) return;
        const fetchData = async () => {
            try {
                // Fetch Campaign
                const { data: campData, error: campError } = await supabase
                    .from('votes_campaigns')
                    .select('*')
                    .eq('id', campaignId)
                    .single();
                
                if (campError) throw campError;
                if (campData.status !== 'active') throw new Error("Ce vote est actuellement fermé.");
                
                setCampaign(campData);

                // Fetch Candidates
                const { data: candsData, error: candsError } = await supabase
                    .from('vote_candidates')
                    .select('*')
                    .eq('campaign_id', campaignId);
                
                if (candsError) throw candsError;

                if (campData.show_results) {
                    // Fetch Votes to compute current standings
                    const { data: votesData } = await supabase
                        .from('votes_cast')
                        .select('candidate_id, vote_count')
                        .eq('campaign_id', campaignId)
                        .eq('status', 'valid');
                    
                    const candidatesWithScores = (candsData || []).map(cand => {
                        const candVotes = (votesData || []).filter(v => v.candidate_id === cand.id);
                        const totalVotes = candVotes.reduce((sum, v) => sum + (v.vote_count || 1), 0);
                        return { ...cand, totalVotes };
                    }).sort((a, b) => b.totalVotes - a.totalVotes);
                    setCandidates(candidatesWithScores);
                } else {
                    setCandidates(candsData || []);
                }
            } catch (err: any) {
                console.error(err);
                alert(err.message || "Erreur de chargement.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [campaignId]);

    const handleVoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return alert("L'email est requis.");
        
        if (campaign.vote_limit_per_user > 0 && voteCount > campaign.vote_limit_per_user) {
            return alert(`Vous ne pouvez pas acheter plus de ${campaign.vote_limit_per_user} votes.`);
        }

        try {
            setProcessing(true);

            if (campaign.is_paid) {
                // Process with FedaPay
                const fedapayKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
                if (!fedapayKey) {
                    alert("Erreur de configuration paiement.");
                    setProcessing(false);
                    return;
                }

                const amount = voteCount * campaign.price_per_vote;

                // 1.5 INSERT VOTE AS PENDING BEFORE PAYMENT
                const { data: pendingVote, error: pendingError } = await supabase.from('votes_cast').insert({
                    campaign_id: campaignId,
                    candidate_id: selectedCandidate.id,
                    voter_email: email,
                    voter_phone: phone,
                    vote_count: voteCount,
                    amount_paid: amount,
                    transaction_id: null,
                    status: 'pending' // pending status to save the vote intent
                }).select().single();

                if (pendingError) {
                    alert("Erreur lors de l'initialisation du vote. Veuillez réessayer.");
                    setProcessing(false);
                    return;
                }

                const fedaConfig = {
                    public_key: fedapayKey,
                    transaction: {
                        amount: amount,
                        description: `Achat de ${voteCount} vote(s) pour ${selectedCandidate.name} - ${campaign.title}`,
                        custom_metadata: {
                            campaign_id: campaignId,
                            candidate_id: selectedCandidate.id,
                            vote_count: voteCount,
                            vote_id: pendingVote?.id
                        }
                    },
                    customer: {
                        email: email,
                        phone_number: {
                            number: phone,
                            country: "BJ"
                        }
                    },
                    onComplete: async (response: any) => {
                        console.log("FedaPay Response:", response);
                        if (response.reason === "checkout.complete" || (response.status || "").toLowerCase() === "approved") {
                            // Enregistrer le vote en base de données (mise à jour)
                            await recordVote(response.transaction?.id || null, amount, pendingVote?.id);
                        } else {
                            alert("Le paiement n'a pas pu être finalisé automatiquement. Si vous avez été débité, contactez le support.");
                            setProcessing(false);
                        }
                    }
                };

                if (window.FedaPay) {
                    const checkout = window.FedaPay.init(fedaConfig);
                    checkout.open();
                } else {
                    alert("Le module de paiement n'est pas encore prêt. Veuillez réessayer.");
                    setProcessing(false);
                }
            } else {
                // Free Vote
                await recordVote(null, 0);
            }
        } catch (err) {
            console.error(err);
            alert("Une erreur est survenue.");
            setProcessing(false);
        }
    };

    const recordVote = async (transactionId: string | null, amountPaid: number, pendingVoteId?: string) => {
        try {
            if (pendingVoteId) {
                // Update existing pending vote
                const { error } = await supabase.from('votes_cast')
                    .update({
                        transaction_id: transactionId,
                        status: 'valid'
                    })
                    .eq('id', pendingVoteId);

                if (error) throw error;
            } else {
                // Free vote or fallback insert
                const { error } = await supabase.from('votes_cast').insert({
                    campaign_id: campaignId,
                    candidate_id: selectedCandidate.id,
                    voter_email: email,
                    voter_phone: phone,
                    vote_count: voteCount,
                    amount_paid: amountPaid,
                    transaction_id: transactionId,
                    status: 'valid'
                });

                if (error) throw error;
            }
            
            alert("Votre vote a été pris en compte avec succès ! Merci.");
            setSelectedCandidate(null);
            window.location.reload(); // Refresh to update counts
        } catch (err) {
            console.error("Error recording vote:", err);
            alert("Le vote a échoué. Veuillez réessayer.");
            setProcessing(false);
        }
    };

    if (loading) return <div className={styles.loading}>Chargement...</div>;
    if (!campaign) return <div className={styles.loading}>Vote introuvable</div>;

    const totalPrice = campaign.is_paid ? voteCount * campaign.price_per_vote : 0;

    return (
        <div className={styles.page}>
            <Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="lazyOnload" />

            {campaign.cover_image && (
                <div className={styles.hero} style={{ backgroundImage: `url(${campaign.cover_image})` }}>
                    <div className={styles.heroOverlay}>
                        <h1>{campaign.title}</h1>
                        {campaign.category && <span className={styles.badge}>{campaign.category}</span>}
                    </div>
                </div>
            )}

            <div className={styles.container}>
                {!campaign.cover_image && (
                    <div className={styles.noCoverHeader}>
                        <h1>{campaign.title}</h1>
                        {campaign.category && <span className={styles.badge}>{campaign.category}</span>}
                    </div>
                )}
                
                {campaign.description && (
                    <div className={styles.description}>
                        <p>{campaign.description}</p>
                    </div>
                )}

                <div className={styles.candidatesGrid}>
                    {candidates.map(cand => (
                        <div key={cand.id} className={styles.candCard}>
                            <div className={styles.candPhoto} style={{ backgroundImage: `url(${cand.photo_url || '/placeholder.png'})` }}></div>
                            <div className={styles.candInfo}>
                                <h3>{cand.name} {cand.number && <span>N°{cand.number}</span>}</h3>
                                {cand.description && <p className={styles.candDesc}>{cand.description}</p>}
                                
                                {campaign.show_results && cand.totalVotes !== undefined && (
                                    <div className={styles.candScore}>
                                        <strong>{cand.totalVotes}</strong> votes
                                    </div>
                                )}
                                
                                <button onClick={() => { setSelectedCandidate(cand); setVoteCount(1); }} className={styles.voteBtn}>
                                    🗳️ Voter pour ce candidat
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Voting Modal */}
            {selectedCandidate && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Voter pour {selectedCandidate.name}</h2>
                        
                        <form onSubmit={handleVoteSubmit} className={styles.voteForm}>
                            {campaign.is_paid && (
                                <div className={styles.voteCountSelector}>
                                    <label>Nombre de votes à acheter</label>
                                    <div className={styles.counter}>
                                        <button type="button" onClick={() => setVoteCount(Math.max(1, voteCount - 1))}>-</button>
                                        <input type="number" value={voteCount} onChange={e => setVoteCount(Math.max(1, Number(e.target.value)))} min={1} />
                                        <button type="button" onClick={() => setVoteCount(voteCount + 1)}>+</button>
                                    </div>
                                    <div className={styles.priceSummary}>
                                        Total à payer : <strong>{totalPrice.toLocaleString()} {campaign.currency}</strong>
                                    </div>
                                </div>
                            )}

                            <label>Email *</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className={styles.input} />

                            <label>Téléphone (optionnel)</label>
                            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 01234567" className={styles.input} />

                            <div className={styles.modalActions}>
                                <button type="button" onClick={() => setSelectedCandidate(null)} className={styles.cancelBtn} disabled={processing}>
                                    Annuler
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={processing}>
                                    {processing ? "Traitement..." : campaign.is_paid ? `Payer ${totalPrice} ${campaign.currency}` : "Valider mon vote"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
