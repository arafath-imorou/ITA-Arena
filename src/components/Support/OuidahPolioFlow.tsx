"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './OuidahPolioFlow.module.css';
import { supabase } from '@/lib/supabase';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import Head from 'next/head';

interface Props {
    campaign: any;
}

export default function OuidahPolioFlow({ campaign }: Props) {
    const [step, setStep] = useState<'intro' | 'selector' | 'form' | 'payment' | 'success'>('intro');
    
    // Vaccine selection
    const pricePerVaccine = campaign.price_per_unit || 525;
    const [vaccineCount, setVaccineCount] = useState<number>(10);
    const [isCustom, setIsCustom] = useState(false);
    
    // Form data
    const [isCompany, setIsCompany] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        representativeName: '',
        consentPublic: false
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [participationId, setParticipationId] = useState<string | null>(null);
    const [certificatId, setCertificatId] = useState<string | null>(null);
    const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
    
    // Stats
    const [stats, setStats] = useState({ vaccins: 0, montant: 0, soutiens: 0, objectif: 100000 });

    useEffect(() => {
        // Load FedaPay script
        if (!document.getElementById('fedapay-script')) {
            const script = document.createElement('script');
            script.src = "https://checkout.fedapay.com/js/checkout.js";
            script.id = 'fedapay-script';
            script.async = true;
            document.body.appendChild(script);
        }
        
        // Fetch stats
        fetchStats();
    }, [campaign.id]);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('support_participations')
                .select('nombre_de_vaccins, montant_total')
                .eq('campaign_id', campaign.id)
                .eq('statut_paiement', 'SUCCESS');
            
            if (data && !error) {
                const totalVaccins = data.reduce((acc, curr) => acc + (curr.nombre_de_vaccins || 0), 0);
                const totalMontant = data.reduce((acc, curr) => acc + (curr.montant_total || 0), 0);
                setStats(prev => ({ ...prev, vaccins: totalVaccins, montant: totalMontant, soutiens: data.length }));
            }
        } catch (err) {
            console.error("Erreur stats", err);
        }
    };

    const handleQuickSelect = (count: number) => {
        setVaccineCount(count);
        setIsCustom(false);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('payment');
        handlePayment();
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        const totalAmount = vaccineCount * pricePerVaccine;
        
        const checkoutSessionId = typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : 'OSP-' + Date.now().toString(36);
            
        const certId = 'OSP-2026-' + Math.floor(100000 + Math.random() * 900000).toString();

        try {
            // Pre-save participation as PENDING
            const { data: partData, error: partError } = await supabase.from('support_participations').insert({
                campaign_id: campaign.id,
                nombre_de_vaccins: vaccineCount,
                prix_unitaire: pricePerVaccine,
                montant_total: totalAmount,
                statut_paiement: 'PENDING',
                checkout_session_id: checkoutSessionId,
                nom_contributeur: isCompany ? formData.companyName : `${formData.firstName} ${formData.lastName}`,
                email_contributeur: formData.email,
                telephone_contributeur: formData.phone,
                is_company: isCompany,
                company_name: formData.companyName,
                consent_public: formData.consentPublic,
                certificat_id: certId
            }).select().single();

            if (partError) throw partError;

            const fedapayKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
            
            const fedaConfig = {
                public_key: fedapayKey,
                transaction: {
                    amount: totalAmount,
                    description: `Achat de ${vaccineCount} vaccins - Ouidah Sans Polio`,
                    custom_metadata: {
                        checkout_session_id: checkoutSessionId,
                        campaign_id: campaign.id,
                        type: 'ouidah_polio'
                    }
                },
                customer: {
                    email: formData.email,
                    lastname: isCompany ? formData.companyName : formData.lastName,
                    firstname: isCompany ? formData.representativeName : formData.firstName,
                    phone_number: {
                        number: formData.phone,
                        country: "bj"
                    }
                },
                onComplete: async (response: any) => {
                    const status = response.status || (response.transaction && response.transaction.status);
                    if (status === 'approved' || status === 'successful' || status === 'completed') {
                        // Validate
                        await supabase.from('support_participations')
                            .update({ statut_paiement: 'SUCCESS', transaction_id: response.transaction?.id?.toString() })
                            .eq('id', partData.id);
                        setParticipationId(partData.id);
                        setCertificatId(certId);
                        setStep('success');
                        fetchStats();
                    } else {
                        alert("Le paiement a échoué ou a été annulé.");
                        await supabase.from('support_participations')
                            .update({ statut_paiement: 'FAILED' })
                            .eq('id', partData.id);
                        setStep('form');
                    }
                    setIsProcessing(false);
                }
            };

            // @ts-ignore
            if (window.FedaPay) {
                // @ts-ignore
                const checkout = window.FedaPay.init(fedaConfig);
                checkout.open();
            } else {
                alert("Erreur de chargement du module de paiement.");
                setIsProcessing(false);
            }
        } catch (err) {
            console.error("Erreur de paiement", err);
            alert("Une erreur est survenue lors de l'initialisation du paiement.");
            setIsProcessing(false);
            setStep('form');
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setUploadedPhoto(ev.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const finishBadgeDrawing = (canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `Badge_OuidahSansPolio.jpg`;
        // Compression JPEG (0.85) pour réduire drastiquement la taille comme demandé (ex: de 3Mo à ~150ko)
        link.href = canvas.toDataURL('image/jpeg', 0.85);
        link.click();
    };

    const generateBadge = () => {
        const canvas = document.createElement('canvas');
        // poliobadge26.png original fait 2480x2468. 
        // On le dessine sur un canevas 1080x1075 pour avoir une excellente qualité HD tout en restant très léger
        const SCALE = 1080 / 2480;
        canvas.width = 1080;
        canvas.height = Math.round(2468 * SCALE); // ~1075
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const templateImg = new Image();
        templateImg.onload = () => {
            // Fond blanc (utile si le badge a des bords semi-transparents non désirés en JPEG)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const drawTemplateAndFinish = () => {
                // Dessiner le cadre PAR-DESSUS la photo
                ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                finishBadgeDrawing(canvas);
            };

            if (uploadedPhoto) {
                const userImg = new Image();
                userImg.onload = () => {
                    // Les coordonnées du trou transparent dans l'image 2480x2468
                    const cx = 1255 * SCALE; 
                    const cy = 1110 * SCALE;
                    // On dessine la photo un peu plus large que le trou pour éviter les espaces vides
                    const drawSize = 1400 * SCALE; 

                    const imgSize = Math.min(userImg.width, userImg.height);
                    const sx = (userImg.width - imgSize) / 2;
                    const sy = (userImg.height - imgSize) / 2;

                    ctx.save();
                    // On place la photo de l'utilisateur
                    ctx.drawImage(
                        userImg, 
                        sx, sy, imgSize, imgSize, 
                        cx - (drawSize / 2), 
                        cy - (drawSize / 2), 
                        drawSize, drawSize
                    );
                    ctx.restore();

                    drawTemplateAndFinish();
                };
                userImg.src = uploadedPhoto;
            } else {
                drawTemplateAndFinish();
            }
        };
        templateImg.src = '/images/poliobadge26.png';
    };

    const generateCertificate = async () => {
        const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [1000, 700] });
        
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 1000, 700, 'F');
        
        // Border
        doc.setDrawColor(255, 90, 31);
        doc.setLineWidth(10);
        doc.rect(20, 20, 960, 660);

        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(40);
        doc.text("CERTIFICAT DE RECONNAISSANCE", 500, 120, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(24);
        doc.text("Ce certificat est décerné à", 500, 200, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(50);
        doc.setTextColor(255, 90, 31);
        const name = isCompany ? formData.companyName : `${formData.firstName} ${formData.lastName}`;
        doc.text(name.toUpperCase(), 500, 280, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text("en reconnaissance de sa contribution à la campagne", 500, 360, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(30);
        doc.text("OUIDAH SANS POLIO", 500, 420, { align: "center" });
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(20);
        doc.text("« Ensemble pour un monde sans polio. »", 500, 480, { align: "center" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(16);
        doc.text("Date : Du 24 Sept. au 24 Oct. 2026", 100, 600);
        doc.text("Lieu: OUIDAH, BÉNIN", 100, 630);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Rotary | District 9103 | End Polio Now | OMS | UNICEF | Ministère de la Santé", 500, 650, { align: "center" });
        
        if (certificatId) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(`ID: ${certificatId}`, 800, 600);
            
            try {
                const qrUrl = await QRCode.toDataURL(`${window.location.origin}/verification/certificat/${certificatId}`);
                doc.addImage(qrUrl, "PNG", 800, 610, 60, 60);
            } catch (err) {}
        }

        doc.save(`Certificat_OuidahSansPolio_${name}.pdf`);
    };

    const handleShare = () => {
        const text = `Je soutiens Ouidah Sans Polio !\n\nJ'ai choisi de contribuer à la mobilisation pour un monde sans polio.\n\nEt vous ?\n\n#OuidahSansPolio #EndPolioNow #JeSoutiens #UnMondeSansPolio\n${window.location.href}`;
        if (navigator.share) {
            navigator.share({
                title: 'Ouidah Sans Polio',
                text: text,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(text);
            alert("Lien et message copiés dans le presse-papier !");
        }
    };

    return (
        <div className={styles.polioWrapper}>
            {step === 'intro' && (
                <div className={styles.heroSection}>
                    <h1 className={styles.title}>OUIDAH SANS POLIO</h1>
                    <h2 className={styles.subtitle}>« Mobilisons-nous pour un monde sans polio. »</h2>

<div className={styles.statsBar}>
                        <div className={styles.statBox}>
                            <span className={styles.statVal}>{stats.vaccins}</span>
                            <span className={styles.statLabel}>VACCINS FINANCÉS</span>
                        </div>
                        <div className={styles.statBox}>
                            <span className={styles.statVal}>{new Intl.NumberFormat('fr-FR').format(stats.montant)} FCFA</span>
                            <span className={styles.statLabel}>MONTANT MOBILISÉ</span>
                        </div>
                        <div className={styles.statBox}>
                            <span className={styles.statVal}>{stats.soutiens}</span>
                            <span className={styles.statLabel}>SOUTIENS</span>
                        </div>
                    </div>

                    <div className={styles.progressContainer}>
                        <div className={styles.progressHeader}>
                            <span>Objectif : {new Intl.NumberFormat('fr-FR').format(stats.objectif)} vaccins</span>
                            <span>{Math.min(100, Math.round((stats.vaccins / stats.objectif) * 100))}%</span>
                        </div>
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${Math.min(100, (stats.vaccins / stats.objectif) * 100)}%` }}></div>
                        </div>
                    </div>

                    <button className={styles.ctaBtn} onClick={() => setStep('selector')}>
                        JE SOUTIENS LA CAUSE
                    </button>

<p className={styles.dateLoc}>24 SEPTEMBRE AU 24 OCTOBRE 2026<br/>OUIDAH — BÉNIN</p>
                    
                    <div className={styles.logos}>
                        <span>Rotary</span>
                        <span>District 9103</span>
                        <span>End Polio Now</span>
                        <span>OMS</span>
                        <span>UNICEF</span>
                        <span>Ministère de la Santé</span>
                    </div>

                    <div className={styles.presentation}>
                        <p>Ouidah Sans Polio est une mobilisation citoyenne autour de l'éradication de la poliomyélite.</p>
                        <p>À travers les Foulées contre la Polio, la collecte, le Village “En finir avec la Polio”, la sensibilisation et le rattrapage vaccinal, la campagne rassemble citoyens, Rotariens, entreprises et partenaires autour d'un même objectif.</p>
                        <ul className={styles.activities}>
                            <li>🏃 Foulées contre la Polio</li>
                            <li>💉 Contribution à l'achat de vaccins</li>
                            <li>🟣 Badge de soutien</li>
                            <li>🏘️ Village « En finir avec la Polio »<br/>- Sensibilisation & Panels<br/>- Stands / Espaces partenaires<br/>- Jeux & animations</li>
                            <li>💉 Unité de rattrapage vaccinal</li>
                        </ul>
                    </div>
                </div>
            )}

            {step === 'selector' && (
                <div className={styles.selectorSection}>
                    <h2 className={styles.sectionTitle}>COMBIEN DE VACCINS SOUHAITEZ-VOUS CONTRIBUER À FINANCER ?</h2>
                    <div className={styles.priceTag}>1 VACCIN = {pricePerVaccine} FCFA</div>

                    {!isCustom ? (
                        <>
                            <div className={styles.quickGrid}>
                                {[10, 20, 50, 100, 200].map(qty => (
                                    <button 
                                        key={qty} 
                                        className={vaccineCount === qty ? styles.qtyBtnActive : styles.qtyBtn}
                                        onClick={() => handleQuickSelect(qty)}
                                    >
                                        <span className={styles.qtyLabel}>{qty} VACCINS</span>
                                        <span className={styles.qtyPrice}>{new Intl.NumberFormat('fr-FR').format(qty * pricePerVaccine)} FCFA</span>
                                    </button>
                                ))}
                                <button className={styles.qtyBtn} onClick={() => setIsCustom(true)}>
                                    <span className={styles.qtyLabel}>AUTRE NOMBRE</span>
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.customSelector}>
                            <div className={styles.spinner}>
                                <button onClick={() => setVaccineCount(Math.max(1, vaccineCount - 1))}>−</button>
                                <input 
                                    type="number" 
                                    value={vaccineCount} 
                                    onChange={(e) => setVaccineCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    min="1"
                                />
                                <button onClick={() => setVaccineCount(vaccineCount + 1)}>+</button>
                            </div>
                            <div className={styles.customResult}>
                                <strong>{vaccineCount} VACCINS</strong>
                                <span>{new Intl.NumberFormat('fr-FR').format(vaccineCount * pricePerVaccine)} FCFA</span>
                            </div>
                        </div>
                    )}

                    <div className={styles.impactMessage}>
                        <p>Vous contribuez à financer <strong>{vaccineCount} vaccins</strong>.</p>
                        <p className={styles.impactSub}>Chaque contribution compte. Ensemble, faisons la différence.</p>
                    </div>

                    <div className={styles.summaryCard}>
                        <h3>VOTRE SOUTIEN</h3>
                        <div className={styles.summaryRow}>
                            <span>{vaccineCount} VACCINS</span>
                            <span>{pricePerVaccine} FCFA / vaccin</span>
                        </div>
                        <div className={styles.summaryTotal}>
                            <span>TOTAL</span>
                            <span>{new Intl.NumberFormat('fr-FR').format(vaccineCount * pricePerVaccine)} FCFA</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button className={styles.backBtn} onClick={() => setStep('intro')}>Retour</button>
                        <button className={styles.ctaBtn} onClick={() => setStep('form')} style={{ flex: 1, margin: 0 }}>CONTINUER VERS LE PAIEMENT</button>
                    </div>
                </div>
            )}

            {step === 'form' && (
                <div className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>VOS INFORMATIONS</h2>
                    
                    <div className={styles.typeSelector}>
                        <label>
                            <input type="radio" checked={!isCompany} onChange={() => setIsCompany(false)} />
                            Particulier
                        </label>
                        <label>
                            <input type="radio" checked={isCompany} onChange={() => setIsCompany(true)} />
                            Entreprise / Organisation
                        </label>
                    </div>

                    <form onSubmit={handleFormSubmit} className={styles.infoForm}>
                        {!isCompany ? (
                            <>
                                <input type="text" placeholder="Prénom *" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                                <input type="text" placeholder="Nom *" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                            </>
                        ) : (
                            <>
                                <input type="text" placeholder="Nom de l'entreprise *" required value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                                <input type="text" placeholder="Nom du représentant *" required value={formData.representativeName} onChange={e => setFormData({...formData, representativeName: e.target.value})} />
                            </>
                        )}
                        <input type="email" placeholder="Email *" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        <input type="tel" placeholder="Téléphone *" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        
                        <label className={styles.consentLabel}>
                            <input type="checkbox" checked={formData.consentPublic} onChange={e => setFormData({...formData, consentPublic: e.target.checked})} />
                            Je souhaite apparaître publiquement parmi les soutiens.
                        </label>

                        <div className={styles.summaryCard} style={{ marginTop: '1rem' }}>
                            <div className={styles.summaryTotal}>
                                <span>TOTAL À PAYER</span>
                                <span>{new Intl.NumberFormat('fr-FR').format(vaccineCount * pricePerVaccine)} FCFA</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button type="button" className={styles.backBtn} onClick={() => setStep('selector')} disabled={isProcessing}>Retour</button>
                            <button type="submit" className={styles.ctaBtn} disabled={isProcessing} style={{ flex: 1, margin: 0 }}>
                                {isProcessing ? 'TRAITEMENT...' : 'PROCÉDER AU PAIEMENT'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {step === 'payment' && (
                <div className={styles.loadingSection}>
                    <h2>Ouverture de l'interface de paiement...</h2>
                    <p>Veuillez finaliser votre paiement dans la fenêtre sécurisée.</p>
                    <div className={styles.spinnerIcon}></div>
                </div>
            )}

            {step === 'success' && (
                <div className={styles.successSection}>
                    <div className={styles.successIcon}>🎉</div>
                    <h2 className={styles.title}>MERCI POUR VOTRE SOUTIEN !</h2>
                    <p className={styles.successSub}>Votre contribution participe à la mobilisation pour un monde sans polio.</p>
                    
                    <div className={styles.summaryCard} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <h3 style={{ color: '#166534' }}>VOUS CONTRIBUEZ À FINANCER</h3>
                        <div className={styles.summaryTotal} style={{ color: '#166534', border: 'none' }}>
                            <span style={{ fontSize: '1.5rem' }}>{vaccineCount} VACCINS</span>
                        </div>
                        <p style={{ textAlign: 'center', color: '#15803d', fontWeight: 'bold' }}>SOUTIEN DE {new Intl.NumberFormat('fr-FR').format(vaccineCount * pricePerVaccine)} FCFA</p>
                    </div>

                    <div className={styles.badgeConfig}>
                        <h3>Personnalisez votre badge</h3>
                        <p>Ajoutez votre photo pour personnaliser votre badge.</p>
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} />
                        {uploadedPhoto && (
                            <div className={styles.photoPreview}>
                                <img src={uploadedPhoto} alt="Aperçu" />
                            </div>
                        )}
                    </div>

                    <div className={styles.actionGrid}>
                        <button className={styles.actionBtn} onClick={generateBadge}>
                            🎖️ TÉLÉCHARGER MON BADGE
                        </button>
                        <button className={styles.actionBtn} onClick={generateCertificate}>
                            📜 TÉLÉCHARGER MON CERTIFICAT
                        </button>
                        <button className={styles.actionBtnAlt} onClick={handleShare}>
                            📲 PARTAGER MON SOUTIEN
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// FORCE HOT RELOAD 2
