"use client";

import React, { useRef, useEffect, useState } from 'react';
import styles from './FrameBuilder.module.css';

interface FrameBuilderProps {
    onComplete: (file: File, dataUrl: string) => void;
    onCancel: () => void;
}

export default function FrameBuilder({ onComplete, onCancel }: FrameBuilderProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [title, setTitle] = useState("Je soutiens la campagne !");
    const [badgeText, setBadgeText] = useState("Je m'engage");
    const [template, setTemplate] = useState<1 | 2>(1);
    
    const [mainLogo, setMainLogo] = useState<HTMLImageElement | null>(null);
    const [mainLogoName, setMainLogoName] = useState("");
    const [partnerLogo, setPartnerLogo] = useState<HTMLImageElement | null>(null);
    const [partnerLogoName, setPartnerLogoName] = useState("");

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setImg: (img: HTMLImageElement) => void, setName: (name: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            setName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => setImg(img);
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const drawFrame = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = 1080;
        const height = 1080;
        canvas.width = width;
        canvas.height = height;

        ctx.clearRect(0, 0, width, height);

        // Common Colors
        const primaryColor = '#0A2E73';
        const secondaryColor = '#F7931E';

        if (template === 1) {
            // Template 1: Classic Banners
            
            // Top Banner
            ctx.fillStyle = primaryColor;
            ctx.fillRect(0, 0, width, 220);

            // Bottom Banner
            ctx.fillStyle = secondaryColor;
            ctx.fillRect(0, height - 220, width, 220);

            // Left and Right Borders
            ctx.fillStyle = primaryColor;
            ctx.fillRect(0, 0, 30, height);
            ctx.fillRect(width - 30, 0, 30, height);

            // Text - Title
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 50px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Draw title with word wrap if needed
            ctx.fillText(title, width / 2, 110, width - 400);

            // Badge Text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 75px "Inter", sans-serif';
            ctx.fillText(badgeText, width / 2, height - 110);

            // Logos
            if (mainLogo) {
                const logoSize = 140;
                // Draw white background circle for logo
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(120, 110, 80, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw logo
                ctx.save();
                ctx.beginPath();
                ctx.arc(120, 110, 75, 0, Math.PI * 2);
                ctx.clip();
                // Draw image centered in circle
                const scale = Math.max(150 / mainLogo.width, 150 / mainLogo.height);
                const w = mainLogo.width * scale;
                const h = mainLogo.height * scale;
                ctx.drawImage(mainLogo, 120 - w/2, 110 - h/2, w, h);
                ctx.restore();
            }
            
            if (partnerLogo) {
                const logoSize = 140;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(width - 120, 110, 80, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.save();
                ctx.beginPath();
                ctx.arc(width - 120, 110, 75, 0, Math.PI * 2);
                ctx.clip();
                const scale = Math.max(150 / partnerLogo.width, 150 / partnerLogo.height);
                const w = partnerLogo.width * scale;
                const h = partnerLogo.height * scale;
                ctx.drawImage(partnerLogo, width - 120 - w/2, 110 - h/2, w, h);
                ctx.restore();
            }
            
        } else if (template === 2) {
            // Template 2: Solid Background with Circle Cutout
            
            // Fill entire background
            ctx.fillStyle = primaryColor;
            ctx.fillRect(0, 0, width, height);

            // Draw decorative corner
            ctx.fillStyle = secondaryColor;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(500, 0);
            ctx.lineTo(0, 500);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(width, height);
            ctx.lineTo(width - 500, height);
            ctx.lineTo(width, height - 500);
            ctx.closePath();
            ctx.fill();

            // Draw Center Cutout (Circle)
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(width / 2, height / 2 + 50, 360, 0, Math.PI * 2);
            ctx.fill();
            
            // Restore normal drawing
            ctx.globalCompositeOperation = 'source-over';

            // Add circle border
            ctx.lineWidth = 20;
            ctx.strokeStyle = secondaryColor;
            ctx.stroke();

            // Text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 60px "Inter", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, width / 2, 100, width - 100);

            // Badge
            ctx.fillStyle = secondaryColor;
            // Draw a pill shape for badge
            const badgeW = 600;
            const badgeH = 120;
            const badgeX = width / 2 - badgeW / 2;
            const badgeY = height - 160;
            
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 60);
            ctx.fill();
            
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 50px "Inter", sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, width / 2, badgeY + badgeH / 2);

            // Logos
            if (mainLogo) {
                const logoSize = 180;
                ctx.drawImage(mainLogo, 50, height - 200, logoSize, logoSize);
            }
            if (partnerLogo) {
                const logoSize = 180;
                ctx.drawImage(partnerLogo, width - 230, height - 200, logoSize, logoSize);
            }
        }
    };

    useEffect(() => {
        drawFrame();
    }, [title, badgeText, template, mainLogo, partnerLogo]);

    const handleConfirm = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const dataUrl = canvas.toDataURL('image/png');
        
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `frame_standard_${Date.now()}.png`, { type: 'image/png' });
                onComplete(file, dataUrl);
            }
        }, 'image/png');
    };

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Modèle de cadre</label>
                    <div className={styles.templateGrid}>
                        <div 
                            className={`${styles.templateOption} ${template === 1 ? styles.active : ''}`}
                            onClick={() => setTemplate(1)}
                        >
                            <svg viewBox="0 0 100 100">
                                <rect x="0" y="0" width="100" height="20" fill="#0A2E73" />
                                <rect x="0" y="80" width="100" height="20" fill="#F7931E" />
                                <rect x="0" y="0" width="5" height="100" fill="#0A2E73" />
                                <rect x="95" y="0" width="5" height="100" fill="#0A2E73" />
                            </svg>
                        </div>
                        <div 
                            className={`${styles.templateOption} ${template === 2 ? styles.active : ''}`}
                            onClick={() => setTemplate(2)}
                        >
                            <svg viewBox="0 0 100 100">
                                <rect x="0" y="0" width="100" height="100" fill="#0A2E73" />
                                <polygon points="0,0 50,0 0,50" fill="#F7931E" />
                                <polygon points="100,100 50,100 100,50" fill="#F7931E" />
                                <circle cx="50" cy="55" r="35" fill="white" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Titre de la campagne</label>
                    <input 
                        type="text" 
                        className={styles.input} 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        maxLength={40}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Texte d'engagement (Badge)</label>
                    <select className={styles.select} value={badgeText} onChange={(e) => setBadgeText(e.target.value)}>
                        <option value="Je soutiens">Je soutiens</option>
                        <option value="Je m'engage">Je m'engage</option>
                        <option value="Je participe">Je participe</option>
                        <option value="J'y serai">J'y serai</option>
                        <option value="Fier soutien">Fier soutien</option>
                        <option value="Ambassadeur">Ambassadeur</option>
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Logo principal</label>
                    <div className={styles.fileInputWrapper}>
                        <label className={styles.fileLabel}>
                            Choisir une image
                            <input type="file" accept="image/png, image/jpeg" className={styles.fileInput} onChange={(e) => handleImageUpload(e, setMainLogo, setMainLogoName)} />
                        </label>
                        {mainLogoName && <span className={styles.fileName}>{mainLogoName}</span>}
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>Logo partenaire (Optionnel)</label>
                    <div className={styles.fileInputWrapper}>
                        <label className={styles.fileLabel}>
                            Choisir une image
                            <input type="file" accept="image/png, image/jpeg" className={styles.fileInput} onChange={(e) => handleImageUpload(e, setPartnerLogo, setPartnerLogoName)} />
                        </label>
                        {partnerLogoName && <span className={styles.fileName}>{partnerLogoName}</span>}
                    </div>
                </div>
            </div>

            <div className={styles.previewArea}>
                <h3 style={{marginBottom: '1rem', color: '#0A2E73', fontSize: '1rem'}}>Prévisualisation</h3>
                <div className={styles.canvasWrapper}>
                    <canvas ref={canvasRef} className={styles.canvas} />
                </div>
                <div className={styles.buttonGroup}>
                    <button className={styles.btnSecondary} onClick={onCancel}>Annuler</button>
                    <button className={styles.btnPrimary} onClick={handleConfirm}>Générer le cadre</button>
                </div>
            </div>
        </div>
    );
}
