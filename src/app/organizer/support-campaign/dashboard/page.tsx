"use client";

import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function SupportCampaignDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [polioCampaignId, setPolioCampaignId] = useState<string | null>(null);
    
    // Aggregated stats
    const [stats, setStats] = useState({
        totalCampaigns: 0,
        totalParticipations: 0,
        totalDownloads: 0,
        totalViews: 0
    });

    useEffect(() => {
        if (authLoading || !user) return;

        const fetchDashboardData = async () => {
            try {
                // 1. Fetch campaigns
                const { data: campaignData, error: campaignError } = await supabase
                    .from('support_campaigns')
                    .select('*')
                    .eq('created_by', user.id)
                    .order('created_at', { ascending: false });

                if (campaignError) throw campaignError;

                const fetchedCampaigns = campaignData || [];
                
                // 2. Aggregate stats
                let totalParticipations = 0;
                let totalDownloads = 0;
                let totalViews = 0;

                for (const camp of fetchedCampaigns) {
                    totalDownloads += (camp.downloads || 0);
                    totalViews += (camp.views || 0);
                    
                    // Note: If you want exact participations, you can fetch from support_participations
                    // For performance on a simple dashboard, we use downloads as a proxy if participation table isn't aggregated,
                    // but let's do a fast count.
                    const { count } = await supabase
                        .from('support_participations')
                        .select('*', { count: 'exact', head: true })
                        .eq('campaign_id', camp.id);
                    
                    camp._participations = count || 0;
                    totalParticipations += (count || 0);
                }

                setCampaigns(fetchedCampaigns);
                setStats({
                    totalCampaigns: fetchedCampaigns.length,
                    totalParticipations,
                    totalDownloads,
                    totalViews
                });

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, authLoading]);

    const handleCopyLink = (slug: string) => {
        const url = `${window.location.origin}/support/${slug}`;
        navigator.clipboard.writeText(url);
        alert("Lien public copié !");
    };

    if (authLoading || loading) {
        return (
            <div style={{ display: 'flex', height: '50vh', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #FF5A1F', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mes Campagnes de Soutien</h1>
                <Link href="/organizer/support-campaign/create" className={styles.btnNew}>
                    <span>➕</span> Créer une campagne
                </Link>
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🖼️</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalCampaigns}</span>
                        <span className={styles.statLabel}>Campagnes actives</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalParticipations}</span>
                        <span className={styles.statLabel}>Participations totales</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>⬇️</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalDownloads}</span>
                        <span className={styles.statLabel}>Téléchargements</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>👁️</div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{stats.totalViews}</span>
                        <span className={styles.statLabel}>Vues cumulées</span>
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                {campaigns.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📭</div>
                        <h3>Aucune campagne pour le moment</h3>
                        <p>Commencez par créer votre première campagne de soutien.</p>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Campagne</th>
                                <th>Date de création</th>
                                <th>Statut</th>
                                <th>Participations</th>
                                <th>Vues</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.map((camp) => (
                                <tr key={camp.id}>
                                    <td>
                                        <div className={styles.campaignInfo}>
                                            <img src={camp.frame_image} alt={camp.title} className={styles.campaignThumb} />
                                            <div>
                                                <p className={styles.campaignTitle}>{camp.title}</p>
                                                <p className={styles.campaignDate}>{camp.category}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{new Date(camp.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${camp.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                                            {camp.status === 'active' ? 'En ligne' : 'Brouillon'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>{camp._participations || 0}</td>
                                    <td>{camp.views || 0}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <Link 
                                                href={`/organizer/support-campaign/create?edit=${camp.id}`} 
                                                className={styles.btnAction}
                                                title="Modifier la campagne"
                                            >
                                                ✏️
                                            </Link>
                                            <a 
                                                href={`/support/${camp.slug}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className={styles.btnAction}
                                                title="Voir la page publique"
                                            >
                                                👁️
                                            </a>
                                            
                                            {camp.slug === 'ouidah-sans-polio' && (
                                                <button 
                                                    className={styles.btnAction} 
                                                    onClick={() => setPolioCampaignId(camp.id)}
                                                    title="Statistiques Polio"
                                                    style={{ background: '#FF5A1F', color: 'white', border: 'none' }}
                                                >
                                                    📊
                                                </button>
                                            )}

                                            <button 
                                                className={styles.btnAction} 
                                                onClick={() => handleCopyLink(camp.slug)}
                                                title="Copier le lien"
                                            >
                                                🔗
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            {polioCampaignId && <PolioStatsModal campaignId={polioCampaignId} onClose={() => setPolioCampaignId(null)} />}
            </div>
        </div>
    );
}


function PolioStatsModal({ campaignId, onClose }: { campaignId: string, onClose: () => void }) {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            const { data, error } = await supabase
                .from('support_participations')
                .select('*')
                .eq('campaign_id', campaignId);
            
            if (data) {
                const confirmed = data.filter(d => d.statut_paiement === 'SUCCESS');
                const pending = data.filter(d => d.statut_paiement === 'PENDING');
                
                setStats({
                    soutiens: confirmed.length,
                    vaccins: confirmed.reduce((acc, curr) => acc + (curr.nombre_de_vaccins || 0), 0),
                    montant: confirmed.reduce((acc, curr) => acc + (curr.montant_total || 0), 0),
                    enAttente: pending.length,
                    badges: confirmed.length, // Assuming 1 badge generated per success
                    certificats: confirmed.length,
                    participations: data
                });
            }
            setLoading(false);
        };
        fetchStats();
    }, [campaignId]);

    if (loading) return <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>Chargement...</div></div>;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <h2 style={{ marginBottom: '1rem' }}>Statistiques - Ouidah Sans Polio</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                        <h3>Total Vaccins Financés</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF5A1F' }}>{stats.vaccins}</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                        <h3>Montant Mobilisé</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{new Intl.NumberFormat('fr-FR').format(stats.montant)} FCFA</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                        <h3>Contributions Confirmées</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.soutiens}</p>
                    </div>
                    <div style={{ padding: '1rem', background: '#f1f5f9', borderRadius: '8px' }}>
                        <h3>Contributions en Attente</h3>
                        <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stats.enAttente}</p>
                    </div>
                </div>

                <h3>Derniers Contributeurs</h3>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '0.5rem' }}>Nom</th>
                            <th style={{ padding: '0.5rem' }}>Vaccins</th>
                            <th style={{ padding: '0.5rem' }}>Montant</th>
                            <th style={{ padding: '0.5rem' }}>Statut</th>
                            <th style={{ padding: '0.5rem' }}>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.participations.slice(0, 20).map((p: any) => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <td style={{ padding: '0.5rem' }}>{p.nom_contributeur || 'Anonyme'} {p.is_company ? '(Entreprise)' : ''}</td>
                                <td style={{ padding: '0.5rem' }}>{p.nombre_de_vaccins || 0}</td>
                                <td style={{ padding: '0.5rem' }}>{new Intl.NumberFormat('fr-FR').format(p.montant_total || 0)}</td>
                                <td style={{ padding: '0.5rem' }}>{p.statut_paiement}</td>
                                <td style={{ padding: '0.5rem' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <button onClick={onClose} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Fermer</button>
            </div>
        </div>
    );
}

