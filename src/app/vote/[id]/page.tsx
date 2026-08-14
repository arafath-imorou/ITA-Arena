"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
    const searchParams = useSearchParams();
    const autoCandidateId = searchParams.get("candidat");
    
    const [campaign, setCampaign] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [voteCount, setVoteCount] = useState(1);
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [processing, setProcessing] = useState(false);

    const [copiedCandId, setCopiedCandId] = useState<string | null>(null);

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
                    const statsRes = await fetch(`/api/votes/${campaignId}/stats`);
                    const votesData: any[] = statsRes.ok ? await statsRes.json() : [];
                    
                    let globalTotal = 0;
                    const candsTemp = (candsData || []).map(cand => {
                        const candVotes = (votesData || []).filter(v => v.candidate_id === cand.id);
                        const totalVotes = candVotes.reduce((sum, v) => sum + (v.vote_count || 1), 0);
                        globalTotal += totalVotes;
                        return { ...cand, totalVotes };
                    });
                    const candidatesWithScores = candsTemp.map(c => ({
                        ...c,
                        percentage: globalTotal > 0 ? ((c.totalVotes / globalTotal) * 100).toFixed(1) : 0
                    })).sort((a, b) => b.totalVotes - a.totalVotes);
                    
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

    // Auto-select candidate and open vote modal when ?candidat= parameter is present in URL
    useEffect(() => {
        if (autoCandidateId && candidates.length > 0 && !selectedCandidate) {
            const target = autoCandidateId.trim().toLowerCase();
            const match = candidates.find(c => {
                const candId = (c.id || '').toLowerCase();
                const candNum = (c.number || '').toString().toLowerCase();
                const candNumPadded = candNum.padStart(2, '0');
                const candName = (c.name || '').toLowerCase();

                return (
                    candId === target ||
                    candNum === target ||
                    candNumPadded === target ||
                    `n°${candNum}` === target ||
                    `n${candNum}` === target ||
                    `n°${candNumPadded}` === target ||
                    `n${candNumPadded}` === target ||
                    candName === target
                );
            });

            if (match) {
                setSelectedCandidate(match);
                setVoteCount(1);

                setTimeout(() => {
                    const el = document.getElementById(`candidate-${match.id}`);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 200);
            }
        }
    }, [autoCandidateId, candidates, selectedCandidate]);

    const handleVoteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        
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

                // 1.5 INSERT VOTE AS PENDING BEFORE PAYMENT VIA API (to bypass RLS)
                const initRes = await fetch('/api/votes/init', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        campaign_id: campaignId,
                        candidate_id: selectedCandidate.id,
                        voter_email: email,
                        voter_phone: phone,
                        vote_count: voteCount,
                        amount_paid: amount
                    })
                });

                const initData = await initRes.json();

                if (!initRes.ok || initData.error) {
                    console.error("Init Error:", initData.error);
                    alert("Erreur lors de l'initialisation du vote. Veuillez réessayer.");
                    setProcessing(false);
                    return;
                }

                const pendingVote = initData.pendingVote;

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
                        email: email || "anonyme@itaarena.com",
                        phone_number: {
                            number: phone,
                            country: "BJ"
                        }
                    },
                    onComplete: async (response: any) => {
                        console.log("FedaPay Response:", response);
                        const reason = (response.reason || "").toLowerCase().replace(/_/g, ' ').replace(/\./g, ' ');
                        const status = (response.transaction?.status || response.status || "").toLowerCase();
                        if (reason === "checkout complete" || status === "approved") {
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
                // Update existing pending vote via server-side API to bypass RLS
                const updateRes = await fetch('/api/votes/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        vote_id: pendingVoteId,
                        transaction_id: transactionId
                    })
                });
                
                const updateData = await updateRes.json();
                if (!updateRes.ok || updateData.error) {
                    throw new Error(updateData.error || "Erreur lors de la confirmation du vote.");
                }
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

    const copyLink = (candId: string) => {
        const url = `${window.location.origin}/vote/${campaignId}?candidat=${candId}`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url);
        } else {
            const textArea = document.createElement("textarea");
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        }
        setCopiedCandId(candId);
        setTimeout(() => setCopiedCandId(null), 3000);
    };

    return (
        <div className={styles.page}>
            <Script src="https://cdn.fedapay.com/checkout.js?v=1.1.7" strategy="lazyOnload" />

            {campaign.cover_image && (
                <div className={styles.hero}>
                    <img
                        src={campaign.cover_image}
                        alt={campaign.title}
                        className={styles.heroBg}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                    />
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
                    {candidates.map((cand, index) => (
                        <div key={cand.id} id={`candidate-${cand.id}`} className={styles.candCard}>
                            <div className={styles.candPhoto}>
                                <img
                                    src={cand.photo_url || '/placeholder.png'}
                                    alt={cand.name}
                                    className={styles.candImg}
                                    loading={index < 4 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    width={800}
                                    height={800}
                                />
                            </div>
                            <div className={styles.candInfo}>
                                <h3>{cand.name} {cand.number && <span>N°{cand.number}</span>}</h3>
                                {cand.description && <p className={styles.candDesc}>{cand.description}</p>}
                                
                                {campaign.show_results && cand.totalVotes !== undefined && (
                                    <div className={styles.candScore}>
                                        <strong>{cand.totalVotes}</strong> votes
                                        <span style={{ marginLeft: '8px', fontSize: '0.9em', color: '#666', fontWeight: 'bold' }}>
                                            {cand.percentage}%
                                        </span>
                                    </div>
                                )}
                                
                                <button onClick={() => { setSelectedCandidate(cand); setVoteCount(1); }} className={styles.voteBtn}>
                                    🗳️ Voter pour ce candidat
                                </button>
                                <button
                                    onClick={() => copyLink(cand.id)}
                                    style={{
                                        marginTop: '10px',
                                        fontSize: '0.85rem',
                                        background: copiedCandId === cand.id ? '#10b981' : 'transparent',
                                        border: copiedCandId === cand.id ? '1px solid #10b981' : '1px solid #ddd',
                                        padding: '8px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: copiedCandId === cand.id ? '#ffffff' : '#555',
                                        width: '100%',
                                        fontWeight: 'bold',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {copiedCandId === cand.id ? "✅ Lien direct copié !" : "🔗 Copier le lien direct de vote"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Voting & Payment Modal */}
            {selectedCandidate && (
                <div className={styles.modalOverlay} onClick={() => !processing && setSelectedCandidate(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        {/* Candidate Card Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.8rem', borderBottom: '1px solid #eee', paddingBottom: '0.8rem' }}>
                            <img
                                src={selectedCandidate.photo_url || '/placeholder.png'}
                                alt={selectedCandidate.name}
                                style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #F7931E', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                            />
                            <div style={{ flex: 1 }}>
                                {selectedCandidate.number && (
                                    <span style={{ background: '#0A2E73', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', marginBottom: '0.2rem' }}>
                                        Candidate N°{selectedCandidate.number}
                                    </span>
                                )}
                                <h2 style={{ margin: 0, color: '#0A2E73', fontSize: '1.15rem', lineHeight: 1.2 }}>{selectedCandidate.name}</h2>
                                <p style={{ margin: '0.2rem 0 0 0', color: '#6b7280', fontSize: '0.8rem' }}>{campaign.title}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedCandidate(null)}
                                style={{ background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', fontSize: '1rem', color: '#666', flexShrink: 0 }}
                                disabled={processing}
                            >
                                ✕
                            </button>
                        </div>
                        
                        <form onSubmit={handleVoteSubmit} className={styles.voteForm}>
                            {campaign.is_paid && (
                                <div className={styles.voteCountSelector}>
                                    <label style={{ display: 'block', fontSize: '0.88rem', color: '#374151', marginBottom: '0.3rem' }}>Combien de votes voulez-vous acheter ?</label>
                                    
                                    {/* Counter */}
                                    <div className={styles.counter}>
                                        <button type="button" onClick={() => setVoteCount(Math.max(1, voteCount - 1))}>-</button>
                                        <input type="number" value={voteCount} onChange={e => setVoteCount(Math.max(1, Number(e.target.value)))} min={1} />
                                        <button type="button" onClick={() => setVoteCount(voteCount + 1)}>+</button>
                                    </div>

                                    {/* Presets */}
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.3rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {[1, 5, 10, 20, 50, 100].map(count => (
                                            <button
                                                key={count}
                                                type="button"
                                                onClick={() => setVoteCount(count)}
                                                style={{
                                                    padding: '0.25rem 0.55rem',
                                                    borderRadius: '16px',
                                                    border: voteCount === count ? '2px solid #F7931E' : '1px solid #d1d5db',
                                                    background: voteCount === count ? '#fff7ed' : '#ffffff',
                                                    color: voteCount === count ? '#c2410c' : '#4b5563',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.78rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                +{count} {count === 1 ? 'vote' : 'votes'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className={styles.priceSummary} style={{ marginTop: '0.7rem', paddingTop: '0.6rem', borderTop: '1px dashed #e5e7eb' }}>
                                        Total à payer : <strong>{totalPrice.toLocaleString()} {campaign.currency}</strong>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#4b5563', display: 'block', marginBottom: '0.3rem' }}>Email (facultatif)</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" className={styles.input} style={{ width: '100%', boxSizing: 'border-box' }} />
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', color: '#4b5563', display: 'block', marginBottom: '0.3rem' }}>Téléphone (Mobile Money - optionnel)</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 01234567" className={styles.input} style={{ width: '100%', boxSizing: 'border-box' }} />
                            </div>

                            <div className={styles.modalActions} style={{ marginTop: '0.5rem' }}>
                                <button type="button" onClick={() => setSelectedCandidate(null)} className={styles.cancelBtn} disabled={processing}>
                                    Annuler
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={processing} style={{ flex: 2, background: 'linear-gradient(135deg, #F7931E 0%, #e07d06 100%)', fontWeight: 'bold', fontSize: '1.05rem' }}>
                                    {processing ? "Chargement du paiement..." : campaign.is_paid ? `💳 Payer ${totalPrice.toLocaleString()} ${campaign.currency}` : "Valider mon vote"}
                                </button>
                            </div>

                            {campaign.is_paid && (
                                <p style={{ textAlign: 'center', fontSize: '0.78rem', color: '#9ca3af', margin: '0.5rem 0 0 0' }}>
                                    Paiement sécurisé par Moov Money, MTN Mobile Money & Wave
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
