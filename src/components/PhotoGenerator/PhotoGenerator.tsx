"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './PhotoGenerator.module.css';

interface PhotoGeneratorProps {
    frameUrl: string;
    campaignId: string;
    campaignTitle?: string;
    onDownload?: () => void;
}

export default function PhotoGenerator({ frameUrl, campaignId, campaignTitle = "", onDownload }: PhotoGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [userImage, setUserImage] = useState<HTMLImageElement | null>(null);
    const [frameImage, setFrameImage] = useState<HTMLImageElement | null>(null);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Transform state
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    const CANVAS_SIZE = 1080;

    // Detect if this is the polio frame to automatically apply a circular mask
    // We check both the URL (for 'polio') and the specific campaign ID just in case
    const isPolioCampaign = frameUrl.toLowerCase().includes('polio') || campaignTitle.toLowerCase().includes('polio');
    const isSillageCampaign = frameUrl.toLowerCase().includes('sillage') || campaignTitle.toLowerCase().includes('sillage');
    const isPlageCampaign = campaignTitle.toLowerCase().includes('plage') || campaignTitle.toLowerCase().includes('acte');

    // Load Frame Image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            setFrameImage(img);
            setIsLoading(false);
        };
        img.onerror = () => {
            console.error("Failed to load frame image");
            setIsLoading(false);
        };
        // Add a timestamp to bypass browser cache for updated images
        const cacheBusterUrl = frameUrl + (frameUrl.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
        img.src = cacheBusterUrl;
    }, [frameUrl]);

    // Draw Canvas
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        
        // Background (white or transparent)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        // 1. For Sillage or Plage (which might have opaque circles), draw the frame FIRST
        if ((isSillageCampaign || isPlageCampaign) && frameImage) {
            ctx.drawImage(frameImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }

        // Draw User Image
        if (userImage) {
            ctx.save();
            
            if (isPolioCampaign) {
                ctx.beginPath();
                ctx.arc(480, 440, 340, 1.3, 5.8);
                ctx.quadraticCurveTo(900, 350, 800, 450);
                ctx.quadraticCurveTo(800, 550, 750, 580);
                ctx.quadraticCurveTo(800, 650, 571, 768);
                ctx.clip();
            } else if (isSillageCampaign) {
                ctx.beginPath();
                // Circular mask for Sillage
                ctx.arc(762, 650, 240, 0, Math.PI * 2);
                ctx.clip();
            } else if (isPlageCampaign) {
                ctx.beginPath();
                // Exact Circular mask for Plage to cover the placeholder
                ctx.arc(645, 325, 290, 0, Math.PI * 2);
                ctx.clip();
            }

            // Move to center of canvas (or center of mask for specific campaigns)
            let centerX = CANVAS_SIZE / 2;
            let centerY = CANVAS_SIZE / 2;
            
            if (isSillageCampaign) {
                centerX = 762;
                centerY = 650;
            } else if (isPlageCampaign) {
                // Approximate center for the "Tous à la plage" frame
                centerX = 645;
                centerY = 325;
            }

            ctx.translate(centerX + offset.x, centerY + offset.y);
            // Rotate
            ctx.rotate((rotation * Math.PI) / 180);
            // Scale
            ctx.scale(scale, scale);
            
            // Draw image centered
            ctx.drawImage(
                userImage,
                -userImage.width / 2,
                -userImage.height / 2,
                userImage.width,
                userImage.height
            );
            ctx.restore();
        }

        // 2. For Polio and others (transparent center), draw the frame LAST
        if (!isSillageCampaign && !isPlageCampaign && frameImage) {
            ctx.drawImage(frameImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
        }

    }, [userImage, frameImage, scale, rotation, offset, isPolioCampaign, isSillageCampaign]);

    useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // Handle File Upload
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setUserImage(img);
                
                // Auto scale to fit
                const minScale = Math.max(
                    CANVAS_SIZE / img.width,
                    CANVAS_SIZE / img.height
                );
                setScale(minScale);
                setOffset({ x: 0, y: 0 });
                setRotation(0);
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    // Mouse / Touch Events for Dragging
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!userImage) return;
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDragging || !userImage) return;
        
        // Calculate ratio between screen size and canvas actual size
        const rect = canvasRef.current!.getBoundingClientRect();
        const ratio = CANVAS_SIZE / rect.width;

        const dx = (e.clientX - dragStart.x) * ratio;
        const dy = (e.clientY - dragStart.y) * ratio;

        setOffset(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
        }));
        
        setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        setIsDragging(false);
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    };

    // Download Image
    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Create temporary link
        const link = document.createElement('a');
        link.download = `soutien-ita-arena-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        if (onDownload) {
            onDownload();
        }
    };

    const handleReset = () => {
        setUserImage(null);
        setScale(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className={styles.container}>
            {isLoading && <div className={styles.loadingOverlay}>Chargement du cadre...</div>}
            
            <div className={styles.workspace}>
                <div className={styles.canvasContainer}>
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className={styles.canvas}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    />
                </div>

                {!userImage && !isLoading && (
                    <div className={styles.uploadOverlay} onClick={() => fileInputRef.current?.click()}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F7931E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <h3 style={{ color: '#0A2E73', marginTop: '1rem' }}>Ajouter ma photo</h3>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>Cliquez pour sélectionner</p>
                    </div>
                )}
            </div>

            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                className={styles.hiddenInput}
                onChange={handleFileChange}
            />

            {userImage && (
                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <span className={styles.controlLabel}>Zoom</span>
                        </div>
                        <input
                            type="range"
                            min={0.1}
                            max={3}
                            step={0.01}
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className={styles.slider}
                        />
                    </div>

                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <span className={styles.controlLabel}>Rotation</span>
                        </div>
                        <input
                            type="range"
                            min={-180}
                            max={180}
                            step={1}
                            value={rotation}
                            onChange={(e) => setRotation(parseFloat(e.target.value))}
                            className={styles.slider}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleReset}>
                            🔄 Changer de photo
                        </button>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownload}>
                            ⬇️ Télécharger mon visuel
                        </button>
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                        Astuce : Vous pouvez glisser l'image pour l'ajuster
                    </p>
                </div>
            )}
        </div>
    );
}
