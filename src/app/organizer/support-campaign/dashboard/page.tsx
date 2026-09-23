"use client";

import React, { useEffect, useState } from "react";
import styles from "./Dashboard.module.css";
import { supabase } from "@/lib/supabase";
import QRCode from 'qrcode';
import jsPDF from "jspdf";
import "jspdf-autotable";
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
                <Link prefetch={false} href="/organizer/support-campaign/create" className={styles.btnNew}>
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
                                            <Link prefetch={false} href={`/organizer/support-campaign/create?edit=${camp.id}`} 
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
                                            
                                            {camp.slug.toLowerCase().includes('ouidah') && (
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
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false });
            
            if (data) {
                const confirmed = data.filter((d: any) => d.statut_paiement === 'SUCCESS');
                const pending = data.filter((d: any) => d.statut_paiement === 'PENDING');
                
                setStats({
                    soutiens: confirmed.length,
                    vaccins: confirmed.reduce((acc: number, curr: any) => acc + (curr.nombre_de_vaccins || 0), 0),
                    montant: confirmed.reduce((acc: number, curr: any) => acc + (curr.montant_total || 0), 0),
                    participations: confirmed
                });
            }
            setLoading(false);
        };
        fetchStats();
    }, [campaignId]);

    
    const generateAdminBadge = (p: any) => {
        const canvas = document.createElement('canvas');
        const SCALE = 1080 / 2480;
        canvas.width = 1080;
        canvas.height = Math.round(2468 * SCALE); // ~1075
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const templateImg = new Image();
        templateImg.onload = () => {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Coordonnées du trou pour écrire "MERCI !" à la place de la photo
            const cx = 1255 * SCALE; 
            const cy = 1110 * SCALE;
            
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 45px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('MERCI !', cx, cy + 15);
            
            const name = p.is_company ? (p.company_name || 'Partenaire') : (p.nom_contributeur || 'Anonyme');
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#FF5A1F';
            ctx.fillText(name.toUpperCase(), cx, cy + 60);

            // Dessiner le template par-dessus
            ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);

            const link = document.createElement('a');
            link.download = `Badge_OuidahSansPolio_${name}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.85);
            link.click();
        };
        templateImg.src = '/images/poliobadge26.png';
    };

    const generateAdminCertificate = async (p: any) => {
        const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [800, 560] });
        
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 800, 560, 'F');
        
        doc.setDrawColor(255, 90, 31);
        doc.setLineWidth(8);
        doc.rect(16, 16, 768, 528);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(32);
        doc.text("CERTIFICAT DE RECONNAISSANCE", 400, 100, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(18);
        doc.text("Ce certificat est décerné à", 400, 160, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(40);
        doc.setTextColor(255, 90, 31);
        const name = p.is_company ? (p.company_name || 'Entreprise') : (p.nom_contributeur || 'Anonyme');
        doc.text(name.toUpperCase(), 400, 230, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        doc.text(`pour sa contribution inestimable à la campagne`, 400, 280, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.text(`OUIDAH SANS POLIO`, 400, 320, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.text(`en finançant l'achat de`, 400, 360, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 90, 31);
        doc.setFontSize(28);
        doc.text(`${p.nombre_de_vaccins || 0} VACCINS`, 400, 400, { align: "center" });

        doc.setTextColor(100, 116, 139);
        doc.setFontSize(10);
        const certId = p.certificat_id || ('OSP-2026-' + p.id.substring(0,6).toUpperCase());
        doc.text(`ID: ${certId}`, 650, 480);
        
        try {
            const qrUrl = await QRCode.toDataURL(`${window.location.origin}/verification/certificat/${certId}`, { width: 60, margin: 1 });
            doc.addImage(qrUrl, "PNG", 650, 490, 50, 50, undefined, 'FAST');
        } catch (err) {
            console.error(err);
        }

        doc.save(`Certificat_OuidahSansPolio_${name}.pdf`);
    };


    const handleDownloadPDF = () => {
        if (!stats) return;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("Rapport - Ouidah Sans Polio", 14, 22);
        
        doc.setFontSize(12);
        doc.text(`Total Vaccins Financés: ${stats.vaccins}`, 14, 32);
        doc.text(`Montant Mobilisé: ${new Intl.NumberFormat('fr-FR').format(stats.montant)} FCFA`, 14, 40);
        doc.text(`Contributions Confirmées: ${stats.soutiens}`, 14, 48);

        const tableColumn = ["Date", "Nom", "Email", "Vaccins", "Montant", "Statut"];
        const tableRows = stats.participations.map((p: any) => [
            new Date(p.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            p.is_company ? p.company_name : p.nom_contributeur || '-',
            p.email_contributeur || '-',
            p.nombre_de_vaccins || 0,
            `${p.montant_total || 0} FCFA`,
            p.statut_paiement === 'SUCCESS' ? 'Confirmé' : 'En attente'
        ]);

        (doc as any).autoTable({
            startY: 60,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [255, 90, 31] }
        });

        doc.save("Rapport_OuidahSansPolio.pdf");
    };

    if (loading) return <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: 'white', padding: '2rem', borderRadius: '8px' }}>Chargement...</div></div>;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', maxWidth: '1000px', width: '100%', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#0f172a' }}>Statistiques - Ouidah Sans Polio</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={handleDownloadPDF} style={{ padding: '0.75rem 1.5rem', background: '#FF5A1F', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>📄 Télécharger PDF</button>
                        <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Fermer</button>
                    </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', background: '#fff7ed', borderRadius: '8px', border: '1px solid #ffedd5' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#c2410c', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Vaccins Financés</h3>
                        <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#ea580c' }}>{stats.vaccins}</p>
                    </div>
                    <div style={{ padding: '1.5rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#15803d', fontSize: '0.9rem', textTransform: 'uppercase' }}>Montant Mobilisé</h3>
                        <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#16a34a' }}>{new Intl.NumberFormat('fr-FR').format(stats.montant)} <span style={{fontSize:'1.2rem'}}>FCFA</span></p>
                    </div>
                    <div style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#475569', fontSize: '0.9rem', textTransform: 'uppercase' }}>Contributions Confirmées</h3>
                        <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', color: '#334155' }}>{stats.soutiens}</p>
                    </div>
                    
                </div>

                <h3 style={{ marginBottom: '1rem', color: '#334155' }}>Détails des contributeurs</h3>
                <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                            <tr>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>Date</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>Nom</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>Vaccins</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>Montant</th>
                                <th style={{ padding: '1rem', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '0.9rem' }}>Actions</th>
                                
                            </tr>
                        </thead>
                        <tbody>
                            {stats.participations.map((p: any) => (
                                <tr key={p.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(p.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                                    <td style={{ padding: '1rem', fontWeight: '500' }}>
                                        {p.is_company ? p.company_name : (p.nom_contributeur || '-')}
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'normal' }}>{p.email_contributeur}</div>
                                    </td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{p.nombre_de_vaccins || 0}</td>
                                    <td style={{ padding: '1rem' }}>{p.montant_total || 0} FCFA</td>
                                    
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={() => generateAdminBadge(p)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.4rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#334155', fontWeight: 'bold' }}>📸 Badge</button>
                                            <button onClick={() => generateAdminCertificate(p)} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '0.4rem 0.5rem', cursor: 'pointer', fontSize: '0.8rem', color: '#334155', fontWeight: 'bold' }}>📜 Certificat</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {stats.participations.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Aucune participation pour le moment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
