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

    useEffect(() => {
        if (!slug) return;

        const fetchCampaign = async () => {
            try {
                // Fetch Campaign
                const { data, error } = await supabase
                    .from('support_campaigns')
                    .select('*')
                    .eq('slug', slug)
                    .eq('status', 'active')
                    .single();

                if (error) throw error;
                setCampaign(data);

                // Increment Views
                await supabase.rpc('increment_campaign_views', { campaign_id: data.id }).catch(() => {
                    // Fallback if RPC doesn't exist
                    supabase.from('support_campaigns').update({ views: data.views + 1 }).eq('id', data.id).then();
                });

                // Fetch Participation Count
                const { count } = await supabase
                    .from('support_participations')
                    .select('*', { count: 'exact', head: true })
                    .eq('campaign_id', data.id);

                setParticipationCount(count || 0);

            } catch (err) {
                console.error("Campaign not found", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCampaign();
    }, [slug]);

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
            
            // Increment downloads
            await supabase.from('support_campaigns').update({ downloads: campaign.downloads + 1 }).eq('id', campaign.id);
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
