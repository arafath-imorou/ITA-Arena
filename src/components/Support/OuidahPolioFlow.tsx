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
        isRotarian: false,
        clubName: '',
        companyName: '',
        representativeName: '',
        consentPublic: false
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [participationId, setParticipationId] = useState<string | null>(null);
    const [certificatId, setCertificatId] = useState<string | null>(null);
    const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

    // Photo adjustment & crop state
    const [photoZoom, setPhotoZoom] = useState<number>(1);
    const [photoOffset, setPhotoOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [photoRotation, setPhotoRotation] = useState<number>(0);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
    
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

    
    // Handle DL link for recovering badge/certificate
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const dl = params.get('dl');
            if (dl) {
                // Fetch the participation
                fetch('/api/support/verify-dl', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dl })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.error) {
                        if (data.error === 'EXPIRED') {
                            alert("Désolé, ce lien personnel a expiré car il a déjà été utilisé 2 fois au maximum. Veuillez soutenir à nouveau pour générer un nouveau badge.");
                        } else {
                            alert("Lien invalide ou paiement non finalisé.");
                        }
                        window.history.replaceState({}, document.title, window.location.pathname);
                    } else if (data.id) {
                        setParticipationId(data.id);
                        setCertificatId(data.certificat_id || ('OSP-2026-' + data.id.substring(0,6).toUpperCase()));
                        setVaccineCount(data.nombre_de_vaccins || 1);
                        setIsCompany(data.is_company || false);
                        
                        if (data.is_company) {
                            setFormData(prev => ({ 
                                ...prev, 
                                companyName: data.company_name || data.nom_contributeur || '',
                                isRotarian: data.is_rotarian || false,
                                clubName: data.club_name || ''
                            }));
                        } else {
                            const parts = (data.nom_contributeur || '').split(' ');
                            const fn = parts[0] || '';
                            const ln = parts.slice(1).join(' ') || '';
                            setFormData(prev => ({ 
                                ...prev, 
                                firstName: fn, 
                                lastName: ln,
                                isRotarian: data.is_rotarian || false,
                                clubName: data.club_name || ''
                            }));
                        }
                        setStep('success');
                    }
                })
                .catch(err => console.error("Erreur dl:", err));
            }
        }
    }, []);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.isRotarian && !formData.clubName.trim()) {
            alert("Veuillez préciser le nom de votre club Rotary ou Rotaract.");
            return;
        }
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
            const insertPayload: any = {
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
            };

            let { data: partData, error: partError } = await supabase.from('support_participations').insert({
                ...insertPayload,
                is_rotarian: formData.isRotarian,
                club_name: formData.isRotarian ? formData.clubName.trim() : null
            }).select().single();

            // Graceful fallback if columns don't exist yet in Supabase schema cache
            if (partError && (partError.message?.includes('column') || partError.code === 'PGRST204')) {
                console.warn("Colonnes is_rotarian/club_name absentes dans Supabase, repli sur payload de base:", partError);
                const retry = await supabase.from('support_participations').insert(insertPayload).select().single();
                partData = retry.data;
                partError = retry.error;
            }

            if (partError) throw partError;

            const fedapayKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
            
            let checkout: any = null;
            const fedaConfig = {
                public_key: fedapayKey,
                transaction: {
                    amount: totalAmount,
                    description: `Achat de ${vaccineCount} vaccins - MONDE SANS POLIO`,
                    custom_metadata: {
                        checkout_session_id: checkoutSessionId,
                        campaign_id: campaign.id,
                        type: 'ouidah_polio',
                        is_rotarian: formData.isRotarian,
                        club_name: formData.isRotarian ? formData.clubName.trim() : ''
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
                    // FORCE CLOSE FEDAPAY WIDGET to reveal download page
                    try {
                        if (checkout) {
                            if (typeof checkout.close === 'function') checkout.close();
                            if (typeof checkout.destroy === 'function') checkout.destroy();
                            if (typeof checkout.closeDialog === 'function') checkout.closeDialog();
                        }
                        // Fallback DOM removal
                        setTimeout(() => {
                            document.querySelectorAll('iframe').forEach((ifr: any) => {
                                if (ifr.src && ifr.src.includes('fedapay')) {
                                    if (ifr.parentElement && ifr.parentElement.style.zIndex) {
                                        ifr.parentElement.remove();
                                    } else {
                                        ifr.remove();
                                    }
                                }
                            });
                        }, 500);
                    } catch (e) {
                        console.error('Erreur fermeture FedaPay', e);
                    }

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
                checkout = window.FedaPay.init(fedaConfig);
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
                setPhotoZoom(1);
                setPhotoOffset({ x: 0, y: 0 });
                setPhotoRotation(0);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(true);
        setDragStart({
            x: e.clientX - photoOffset.x,
            y: e.clientY - photoOffset.y
        });
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setPhotoOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        try {
            (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        } catch (err) {}
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.05 : -0.05;
        setPhotoZoom(prev => Math.min(2.5, Math.max(0.5, Math.round((prev + delta) * 100) / 100)));
    };

    const handleZoomStep = (delta: number) => {
        setPhotoZoom(prev => Math.min(2.5, Math.max(0.5, Math.round((prev + delta) * 10) / 10)));
    };

    const handleRotatePhoto = () => {
        setPhotoRotation(prev => (prev + 90) % 360);
    };

    const handleResetPhotoAdjustments = () => {
        setPhotoZoom(1);
        setPhotoOffset({ x: 0, y: 0 });
        setPhotoRotation(0);
    };

    const finishBadgeDrawing = (canvas: HTMLCanvasElement, name?: string) => {
        const link = document.createElement('a');
        const cleanName = (name || 'MondeSansPolio').replace(/[^a-zA-Z0-9_\-]/g, '_');
        link.download = `Badge_MondeSansPolio_${cleanName}.jpg`;
        // Compression JPEG (0.85) pour réduire drastiquement la taille comme demandé (ex: de 3Mo à ~150ko)
        link.href = canvas.toDataURL('image/jpeg', 0.85);
        link.click();
    };

    const drawCompanyTextOnCanvas = (
        ctx: CanvasRenderingContext2D,
        text: string,
        cx: number,
        cy: number,
        maxW: number = 480,
        maxH: number = 360,
        color: string = '#0033A0'
    ) => {
        const cleanText = text.trim();
        if (!cleanText) return;

        const words = cleanText.toUpperCase().split(/\s+/).filter(Boolean);
        if (words.length === 0) return;

        // Ajuster dynamiquement la taille de police pour qu'elle sorte bien grande et tienne parfaitement dans le cercle
        let bestFontSize = 24;
        let bestLines: string[] = [words.join(' ')];
        let bestLineHeight = 28;
        let bestTotalH = 28;

        for (let size = 64; size >= 24; size -= 2) {
            ctx.font = `bold ${size}px "Arial", "Helvetica Neue", sans-serif`;
            const lines: string[] = [];
            let currentLine = '';

            for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxW && currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            }
            if (currentLine) lines.push(currentLine);

            const exceedsW = lines.some(line => ctx.measureText(line).width > maxW);
            const lH = size * 1.15;
            const tH = lines.length * lH;

            if (!exceedsW && tH <= maxH) {
                bestFontSize = size;
                bestLines = lines;
                bestLineHeight = lH;
                bestTotalH = tH;
                break;
            }
        }

        ctx.save();
        ctx.fillStyle = color;
        ctx.font = `bold ${bestFontSize}px "Arial", "Helvetica Neue", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const startY = cy - (bestTotalH / 2) + (bestLineHeight / 2);
        for (let i = 0; i < bestLines.length; i++) {
            const y = startY + (i * bestLineHeight);
            ctx.fillText(bestLines[i], cx, y);
        }
        ctx.restore();
    };

    const generateBadge = () => {
        const canvas = document.createElement('canvas');
        // poliobadge26new.png original fait 2480x2468. 
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

            const cx = 1260 * SCALE; 
            const cy = (1095 * SCALE) + 15; // Centré dans le cercle photo visible (~492px)

            const drawTemplateAndFinish = () => {
                // Dessiner le cadre PAR-DESSUS la photo ou le texte
                ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                const displayName = isCompany 
                    ? (formData.companyName || 'Entreprise') 
                    : (`${formData.firstName || ''}_${formData.lastName || ''}`.trim() || 'MondeSansPolio');
                finishBadgeDrawing(canvas, displayName);
            };

            if (uploadedPhoto) {
                const userImg = new Image();
                userImg.onload = () => {
                    const PREVIEW_SIZE = 220;
                    const HOLE_SIZE = 600;
                    const RATIO = HOLE_SIZE / PREVIEW_SIZE;

                    // Échelle de base équivalente à object-fit: cover dans le cercle
                    const canvasBaseScale = HOLE_SIZE / Math.min(userImg.width, userImg.height);
                    const drawW = userImg.width * canvasBaseScale * photoZoom;
                    const drawH = userImg.height * canvasBaseScale * photoZoom;

                    const canvasTargetX = cx + (photoOffset.x * RATIO);
                    const canvasTargetY = (1095 * SCALE) + (photoOffset.y * RATIO);

                    ctx.save();
                    ctx.translate(canvasTargetX, canvasTargetY);
                    if (photoRotation !== 0) {
                        ctx.rotate((photoRotation * Math.PI) / 180);
                    }
                    ctx.drawImage(
                        userImg, 
                        -drawW / 2, 
                        -drawH / 2, 
                        drawW, 
                        drawH
                    );
                    ctx.restore();

                    drawTemplateAndFinish();
                };
                userImg.src = uploadedPhoto;
            } else {
                // Si aucune photo n'a été ajoutée :
                // Pour les entreprises / associations, le nom sort bien écrit et bien grand en bleu
                const nameToDisplay = isCompany 
                    ? (formData.companyName || '').trim() 
                    : `${formData.firstName || ''} ${formData.lastName || ''}`.trim();

                if (nameToDisplay) {
                    drawCompanyTextOnCanvas(ctx, nameToDisplay, cx, cy, 480, 360, '#0033A0');
                }
                drawTemplateAndFinish();
            }
        };
        templateImg.src = '/images/poliobadge26new.png';
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

        if (formData.isRotarian && formData.clubName && formData.clubName.trim()) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(18);
            doc.setTextColor(0, 51, 160);
            doc.text(formData.clubName.trim().toUpperCase(), 500, 315, { align: "center" });
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text("en reconnaissance de sa contribution à la campagne", 500, 360, { align: "center" });
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(30);
        doc.text("MONDE SANS POLIO", 500, 410, { align: "center" });
        doc.setFontSize(22);
        doc.text("Célébration WORLD POLIO DAY - OUIDAH 2026", 500, 450, { align: "center" });
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(20);
        doc.text("« Ensemble pour un monde sans polio. »", 500, 500, { align: "center" });

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

        doc.save(`Certificat_MondeSansPolio_${name}.pdf`);
    };

    const getShareCaption = () => {
        const campaignUrl = typeof window !== 'undefined' ? window.location.href : 'https://itaarena.com';
        if (isCompany) {
            const compName = (formData.companyName || '').trim() || 'Notre entreprise';
            return `🤝 ${compName.toUpperCase()} S'ENGAGE POUR UN MONDE SANS POLIO ! 🌍💉\n\nDans le cadre de notre engagement citoyen et communautaire, nous avons financé ${vaccineCount} vaccins pour contribuer activement à l'éradication définitive de la poliomyélite.\n\nChaque geste compte pour protéger l'avenir de nos enfants. Ensemble avec le Rotary, l'OMS, l'UNICEF et le Ministère de la Santé, faisons la différence !\n\n👉 Rejoignez la mobilisation vous aussi :\n${campaignUrl}\n\n#MondeSansPolio #EndPolioNow #RotaryDistrict9103 #RSE #EngagementCitoyen #Ouidah2026`;
        } else {
            const participantName = `${formData.firstName} ${formData.lastName}`.trim();
            const clubMention = (formData.isRotarian && formData.clubName && formData.clubName.trim()) 
                ? ` (Membre du ${formData.clubName.trim()})` 
                : '';
            const byLine = participantName ? `Je suis fier(e) d'avoir contribué${clubMention} en finançant ${vaccineCount} vaccins` : `J'ai contribué en finançant ${vaccineCount} vaccins`;
            return `🔴 UN MONDE SANS POLIO EST POSSIBLE ! 🌍💉\n\n${byLine} pour la campagne de célébration WORLD POLIO DAY - OUIDAH 2026.\n\nEnsemble avec le Rotary, l'OMS, l'UNICEF et le Ministère de la Santé, protégeons chaque enfant.\n\nEt vous, quel sera votre impact ? Obtenez votre badge officiel et participez à la cause :\n${campaignUrl}\n\n#MondeSansPolio #EndPolioNow #RotaryDistrict9103 #JeSoutiens #UnMondeSansPolio #Ouidah2026`;
        }
    };

    const handleCopyCaption = () => {
        const caption = getShareCaption();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(caption).then(() => {
                setCopiedCaption(true);
                setTimeout(() => setCopiedCaption(false), 3000);
            }).catch(() => {
                alert("Légende copiée !");
            });
        } else {
            alert("Légende copiée !");
        }
    };

    const handleShare = () => {
        const text = getShareCaption();
        if (navigator.share) {
            navigator.share({
                title: 'MONDE SANS POLIO - Mon soutien',
                text: text,
                url: window.location.href
            }).catch(console.error);
        } else {
            handleCopyCaption();
            alert("Légende copiée dans le presse-papier !");
        }
    };

    return (
        <div className={styles.polioWrapper}>
            {step === 'intro' && (
                <div className={styles.heroSection}>
                    <h1 className={styles.title}>MONDE SANS POLIO, Célébration WORLD POLIO DAY - OUIDAH 2026</h1>
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
                        <p>MONDE SANS POLIO, Célébration WORLD POLIO DAY - OUIDAH 2026, est une mobilisation citoyenne autour de l'éradication de la poliomyélite.</p>
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
                    <div className={styles.typeSelector} style={{ marginBottom: '2rem' }}>
                        <label>
                            <input type="radio" checked={!isCompany} onChange={() => { setIsCompany(false); setIsCustom(false); setVaccineCount(10); }} />
                            Particulier
                        </label>
                        <label>
                            <input type="radio" checked={isCompany} onChange={() => { setIsCompany(true); setIsCustom(false); setVaccineCount(100); }} />
                            Entreprise / Organisation
                        </label>
                    </div>

                    <h2 className={styles.sectionTitle}>COMBIEN DE VACCINS SOUHAITEZ-VOUS CONTRIBUER À FINANCER ?</h2>
                    <div className={styles.priceTag}>1 VACCIN = {pricePerVaccine} FCFA</div>

                    {!isCustom ? (
                        <>
                            <div className={styles.quickGrid}>
                                {(isCompany ? [100, 200, 500, 1000, 5000] : [10, 20, 50, 100, 200]).map(qty => (
                                    <button 
                                        key={qty} 
                                        className={vaccineCount === qty ? styles.qtyBtnActive : styles.qtyBtn}
                                        onClick={() => handleQuickSelect(qty)}
                                    >
                                        <span className={styles.qtyLabel}>{qty} VACCINS</span>
                                        <span className={styles.qtyPrice}>{new Intl.NumberFormat('fr-FR').format(qty * pricePerVaccine)} FCFA</span>
                                    </button>
                                ))}
                                {!isCompany && (
                                <button className={styles.qtyBtn} onClick={() => setIsCustom(true)}>
                                    <span className={styles.qtyLabel}>AUTRE NOMBRE</span>
                                </button>
                                )}
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
                        
                        <div className={styles.rotaryGroup}>
                            <span className={styles.rotaryQuestion}>Êtes-vous Rotarien ou Rotaractien ?</span>
                            <div className={styles.rotaryOptions}>
                                <label className={`${styles.rotaryOption} ${formData.isRotarian ? styles.rotaryOptionActive : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="isRotarian" 
                                        value="oui"
                                        checked={formData.isRotarian === true} 
                                        onChange={() => setFormData({ ...formData, isRotarian: true })} 
                                    />
                                    <span>Oui</span>
                                </label>
                                <label className={`${styles.rotaryOption} ${!formData.isRotarian ? styles.rotaryOptionActive : ''}`}>
                                    <input 
                                        type="radio" 
                                        name="isRotarian" 
                                        value="non"
                                        checked={formData.isRotarian === false} 
                                        onChange={() => setFormData({ ...formData, isRotarian: false, clubName: '' })} 
                                    />
                                    <span>Non</span>
                                </label>
                            </div>

                            {formData.isRotarian && (
                                <div className={styles.clubInputWrapper}>
                                    <input 
                                        type="text" 
                                        placeholder="Nom de votre club (ex: Rotary Club Cotonou...) *" 
                                        required={formData.isRotarian}
                                        value={formData.clubName} 
                                        onChange={e => setFormData({ ...formData, clubName: e.target.value })} 
                                        className={styles.clubInput}
                                    />
                                </div>
                            )}
                        </div>

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
                        <p>
                            {isCompany 
                                ? "Ajoutez votre logo ou photo (optionnel). Sans photo, le nom de votre entreprise / association apparaîtra directement en grand sur le badge." 
                                : "Ajoutez votre photo pour personnaliser votre badge."}
                        </p>
                        
                        <div className={styles.fileInputWrapper}>
                            <input 
                                type="file" 
                                id="badge-photo-file-input" 
                                accept="image/*" 
                                onChange={handlePhotoUpload} 
                                className={styles.fileInput} 
                            />
                            <label htmlFor="badge-photo-file-input" className={styles.uploadBtn}>
                                📷 {uploadedPhoto ? "Changer de photo" : "Choisir une photo"}
                            </label>
                        </div>

                        {uploadedPhoto && (
                            <div className={styles.cropContainer}>
                                <div 
                                    className={styles.cropCircle}
                                    onPointerDown={handlePointerDown}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={handlePointerUp}
                                    onPointerCancel={handlePointerUp}
                                    onWheel={handleWheel}
                                    title="Glissez avec la souris ou le doigt pour déplacer la photo"
                                >
                                    <img 
                                        src={uploadedPhoto} 
                                        alt="Aperçu du badge" 
                                        draggable={false}
                                        style={{
                                            transform: `translate(calc(-50% + ${photoOffset.x}px), calc(-50% + ${photoOffset.y}px)) rotate(${photoRotation}deg) scale(${photoZoom})`
                                        }}
                                    />
                                </div>

                                <p className={styles.cropHint}>
                                    <span>✋</span> <strong>Glissez la photo</strong> pour la centrer. Ajustez le zoom pour éviter qu'elle soit coupée.
                                </p>

                                <div className={styles.cropControls}>
                                    <div className={styles.zoomRow}>
                                        <button 
                                            type="button" 
                                            className={styles.cropToolBtn} 
                                            onClick={() => handleZoomStep(-0.1)} 
                                            title="Dézoomer"
                                        >
                                            ➖
                                        </button>
                                        <input 
                                            type="range" 
                                            min="0.5" 
                                            max="2.5" 
                                            step="0.05" 
                                            value={photoZoom} 
                                            onChange={e => setPhotoZoom(parseFloat(e.target.value))} 
                                            className={styles.zoomSlider} 
                                            aria-label="Niveau de zoom"
                                        />
                                        <button 
                                            type="button" 
                                            className={styles.cropToolBtn} 
                                            onClick={() => handleZoomStep(0.1)} 
                                            title="Zoomer"
                                        >
                                            ➕
                                        </button>
                                        <span className={styles.zoomValue}>{Math.round(photoZoom * 100)}%</span>
                                    </div>

                                    <div className={styles.cropButtonsRow}>
                                        <button 
                                            type="button" 
                                            className={styles.cropToolBtn} 
                                            onClick={handleRotatePhoto} 
                                            title="Pivoter de 90°"
                                        >
                                            🔄 Pivoter
                                        </button>
                                        <button 
                                            type="button" 
                                            className={styles.cropToolBtn} 
                                            onClick={handleResetPhotoAdjustments} 
                                            title="Recentrer et réinitialiser"
                                        >
                                            ↺ Recentrer
                                        </button>
                                    </div>
                                </div>
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

                    <div className={styles.captionSection}>
                        <div className={styles.captionHeader}>
                            <span className={styles.captionTitle}>📢 Légende pour vos publications</span>
                            <button 
                                type="button" 
                                className={styles.copyCaptionBtn} 
                                onClick={handleCopyCaption}
                            >
                                {copiedCaption ? "✅ Légende copiée !" : "📋 Copier la légende"}
                            </button>
                        </div>
                        <p className={styles.captionDesc}>
                            Vous pouvez copier ce texte pour accompagner votre badge sur WhatsApp (statut), Facebook, LinkedIn ou Instagram :
                        </p>
                        <div className={styles.captionText}>
                            {getShareCaption()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// FORCE HOT RELOAD 2
