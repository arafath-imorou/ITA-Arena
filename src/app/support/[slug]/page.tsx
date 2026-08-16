"use client";

import React, { useEffect, useState } from "react";
import styles from "./SupportPage.module.css";
import PhotoGenerator from "@/components/PhotoGenerator/PhotoGenerator";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SupportCampaignPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showGenerator, setShowGenerator] = useState(false);
    const [participationCount, setParticipationCount] = useState(0);
    const [creatorInfo, setCreatorInfo] = useState<any>(null);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    useEffect(() => {
        if (!slug) return;

        const fetchCampaign = async () => {
            try {
                // Fetch Campaign by slug
                const { data, error } = await supabase
                    .from('support_campaigns')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (error || !data) throw error || new Error("Campagne introuvable");

                // Fetch Creator Info
                if (data.created_by) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name, email, phone, role')
                        .eq('id', data.created_by)
                        .single();
                    setCreatorInfo(profile);
                }

                // Check authorization if campaign is not yet active (pending)
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                let userIsAdmin = false;

                if (user) {
                    const userEmail = (user.email || '').toLowerCase().trim();
                    if (userEmail === 'groupita25@gmail.com' || userEmail === 'admin@itaarena.com') {
                        userIsAdmin = true;
                    } else {
                        const { data: userProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
                        if (['admin', 'super_admin'].includes(userProfile?.role)) {
                            userIsAdmin = true;
                        }
                    }
                }

                setIsAdminUser(userIsAdmin);

                if (data.status !== 'active') {
                    let canPreview = userIsAdmin;
                    if (user && user.id === data.created_by) {
                        canPreview = true;
                    }

                    if (!canPreview) {
                        setCampaign(null);
                        setLoading(false);
                        return;
                    }
                }

                setCampaign(data);

                // Increment Views
                try {
                    const { error: rpcError } = await supabase.rpc('increment_campaign_views', { campaign_id: data.id });
                    if (rpcError) throw rpcError;
                } catch (e) {
                    // Fallback if RPC doesn't exist
                    await supabase.from('support_campaigns').update({ views: (data.views || 0) + 1 }).eq('id', data.id);
                }

                // Fetch Participation Count
                const { count } = await supabase
                    .from('support_participations')
                    .select('*', { count: 'exact', head: true })
                    .eq('campaign_id', data.id);

                setParticipationCount(count || 0);

            } catch (err) {
                console.error("Campaign not found", err);
                setCampaign(null);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [slug]);

    const handleApproveCampaign = async () => {
        if (!campaign) return;
        setIsApproving(true);
        try {
            const res = await fetch(`/api/admin/support/${campaign.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
            });
            if (!res.ok) throw new Error("Erreur de mise à jour");
            setCampaign({ ...campaign, status: 'active' });
            alert("✅ Campagne validée et publiée avec succès !");
        } catch (err: any) {
            alert("Erreur lors de la validation : " + err.message);
        } finally {
            setIsApproving(false);
        }
    };

    const handleParticipate = () => {
        setShowGenerator(true);
        // Scroll to generator smoothly
        setTimeout(() => {
            document.getElementById('generator-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleDownload = async () => {
        if (!campaign) return;

        // Record participation
        try {
            await supabase.from('support_participations').insert({
                campaign_id: campaign.id
            });
            setParticipationCount(prev => prev + 1);
            // Note: We no longer manually update support_campaigns.downloads here.
            // A PostgreSQL trigger automatically increments it when a participation is inserted!
        } catch (e) {
            console.error("Error recording participation", e);
        }
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = campaign ? `Je soutiens la campagne : ${campaign.title} sur ITA ARENA.` : '';

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: '#0A2E73' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #0A2E73', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className={styles.pageContainer} style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
                <h1 style={{ fontSize: '3rem', color: '#0A2E73', marginBottom: '1rem' }}>404</h1>
                <h2>Campagne introuvable</h2>
                <p style={{ color: '#666', marginBottom: '2rem' }}>Cette campagne n'existe pas ou n'est plus active.</p>
                <Link href="/" className={styles.btnParticipate} style={{ textDecoration: 'none' }}>
                    Retour à l'accueil
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.pageContainer}>
            {campaign.status !== 'active' && (
                <div style={{
                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    color: '#fff',
                    padding: '1.2rem 1.5rem',
                    borderBottom: '3px solid #f59e0b',
                    position: 'sticky',
                    top: 0,
                    zIndex: 9999,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <span style={{ fontSize: '1.8rem' }}>⏳</span>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    <strong style={{ fontSize: '1.1rem', color: '#fef08a' }}>Aperçu d&apos;Évaluation — En attente de validation</strong>
                                    <span style={{ background: '#f59e0b', color: '#78350f', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>PENDING</span>
                                </div>
                                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                    👤 <strong>Organisateur :</strong> {creatorInfo?.full_name || 'Inconnu'} {creatorInfo?.email ? `(${creatorInfo.email})` : ''}
                                    {creatorInfo?.phone ? ` | 📞 ${creatorInfo.phone}` : ''}
                                    {campaign.created_at ? ` | 📅 Créé le ${new Date(campaign.created_at).toLocaleDateString('fr-FR')}` : ''}
                                </p>
                            </div>
                        </div>
                        {isAdminUser && (
                            <button
                                onClick={handleApproveCampaign}
                                disabled={isApproving}
                                style={{
                                    background: '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.65rem 1.3rem',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                {isApproving ? 'Validation en cours...' : '✅ Valider & Publier la campagne'}
                            </button>
                        )}
                    </div>
                </div>
            )}
            {/* Header / Hero */}
            <header className={styles.hero}>
                <div className={styles.heroContent}>
                    {campaign.category && (
                        <span style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '1rem', display: 'inline-block' }}>
                            {campaign.category}
                        </span>
                    )}
                    <h1 className={styles.title}>{campaign.title}</h1>
                    <p className={styles.description}>{campaign.description}</p>
                    
                    {campaign.show_counter && (
                        <div className={styles.stats}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{participationCount}</span>
                                <span className={styles.statLabel}>Participants</span>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {!showGenerator ? (
                    <div className={`${styles.card} animate-in`}>
                        <div className={styles.framePreview}>
                            <img src={campaign.frame_image} alt="Cadre de soutien" />
                        </div>
                        <h2 style={{ color: '#0A2E73', marginBottom: '1.5rem' }}>Prêt à montrer votre soutien ?</h2>
                        <button className={styles.btnParticipate} onClick={handleParticipate}>
                            <span>📸</span> Je participe
                        </button>
                    </div>
                ) : (
                    <div id="generator-section" className={`${styles.generatorSection} animate-in`}>
                        <h2 style={{ color: '#0A2E73', textAlign: 'center', marginBottom: '2rem' }}>Créez votre visuel</h2>
                        <PhotoGenerator 
                            frameUrl={campaign.frame_image} 
                            campaignId={campaign.id} 
                            campaignTitle={campaign.title}
                            onDownload={handleDownload}
                        />

                        {campaign.allow_share && (
                            <div className={styles.shareSection}>
                                <h3 className={styles.shareTitle}>Partagez cette campagne</h3>
                                <div className={styles.shareButtons}>
                                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.shareFb}`}>
                                        Facebook
                                    </a>
                                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.shareTw}`}>
                                        X (Twitter)
                                    </a>
                                    <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.shareWa}`}>
                                        WhatsApp
                                    </a>
                                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className={`${styles.shareBtn} ${styles.shareIn}`}>
                                        LinkedIn
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {campaign.show_logo && (
                    <div style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.6 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Propulsé par</p>
                        <img src="/images/logo/ita_arena_logo.png" alt="ITA ARENA" style={{ height: '30px', margin: '0.5rem auto' }} />
                    </div>
                )}
            </main>
        </div>
    );
}
