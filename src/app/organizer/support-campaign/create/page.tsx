"use client";

import React, { useState, useRef } from "react";
import styles from "./CreateCampaign.module.css";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FrameBuilder from "@/components/FrameBuilder/FrameBuilder";
import { useAuth } from "@/context/AuthContext";

export default function CreateSupportCampaign() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successUrl, setSuccessUrl] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: "Sensibilisation",
        startDate: "",
        endDate: "",
        allowDownload: true,
        allowShare: true,
        showCounter: true,
        showLogo: true,
    });

    const [frameFile, setFrameFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [frameMode, setFrameMode] = useState<'upload' | 'build'>('upload');

    const categories = [
        "Sensibilisation",
        "Santé",
        "Education",
        "ONG",
        "Association",
        "Evénement",
        "Autre"
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check size (10 MB max)
            if (file.size > 10 * 1024 * 1024) {
                setError("La taille du fichier ne doit pas dépasser 10 MB.");
                return;
            }
            // Check type (PNG only)
            if (file.type !== "image/png") {
                setError("Veuillez uploader uniquement un fichier PNG transparent.");
                return;
            }

            setFrameFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);
            setError(null);
        }
    };

    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, '') + '-' + Math.floor(Math.random() * 10000);
    };

    const handleNext = () => {
        if (step === 1) {
            if (!formData.title) {
                setError("Le titre est requis.");
                return;
            }
        }
        if (step === 2) {
            if (!frameFile) {
                setError("Veuillez uploader un cadre au format PNG.");
                return;
            }
        }
        setError(null);
        setStep(prev => prev + 1);
    };

    const handlePrev = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!user) return;
        setIsLoading(true);
        setError(null);

        try {
            // 1. Upload File
            const fileExt = frameFile!.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('campaign_frames')
                .upload(fileName, frameFile!);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from('campaign_frames')
                .getPublicUrl(fileName);

            const frameImageUrl = publicUrlData.publicUrl;
            const slug = generateSlug(formData.title);

            // 2. Insert into Database
            const { data: campaignData, error: insertError } = await supabase
                .from('support_campaigns')
                .insert({
                    title: formData.title,
                    slug: slug,
                    description: formData.description,
                    category: formData.category,
                    frame_image: frameImageUrl,
                    start_date: formData.startDate || null,
                    end_date: formData.endDate || null,
                    allow_download: formData.allowDownload,
                    allow_share: formData.allowShare,
                    show_counter: formData.showCounter,
                    show_logo: formData.showLogo,
                    created_by: user.id,
                    status: 'active'
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Success
            setSuccessUrl(`${window.location.origin}/support/${slug}`);
            setStep(5); // Success step
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Une erreur s'est produite lors de la publication.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (successUrl) {
            navigator.clipboard.writeText(successUrl);
            alert("Lien copié !");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Créer une Campagne de Soutien</h1>
                <p>Configurez un cadre visuel pour permettre à votre communauté de vous soutenir.</p>
            </div>

            {step < 5 && (
                <div className={styles.stepper}>
                    <div className={`${styles.step} ${step >= 1 ? styles.active : ''} ${step > 1 ? styles.completed : ''}`}>
                        <div className={styles.stepIcon}>1</div>
                        <span className={styles.stepLabel}>Informations</span>
                    </div>
                    <div className={`${styles.step} ${step >= 2 ? styles.active : ''} ${step > 2 ? styles.completed : ''}`}>
                        <div className={styles.stepIcon}>2</div>
                        <span className={styles.stepLabel}>Cadre</span>
                    </div>
                    <div className={`${styles.step} ${step >= 3 ? styles.active : ''} ${step > 3 ? styles.completed : ''}`}>
                        <div className={styles.stepIcon}>3</div>
                        <span className={styles.stepLabel}>Paramètres</span>
                    </div>
                    <div className={`${styles.step} ${step >= 4 ? styles.active : ''}`}>
                        <div className={styles.stepIcon}>4</div>
                        <span className={styles.stepLabel}>Publication</span>
                    </div>
                </div>
            )}

            <div className={styles.card}>
                {error && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

                {/* STEP 1: INFORMATIONS */}
                {step === 1 && (
                    <div className="animate-in">
                        <div className={styles.formGroup}>
                            <label>Titre de la campagne *</label>
                            <input
                                type="text"
                                name="title"
                                placeholder="Ex: Je soutiens la conférence Tech 2026"
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Description</label>
                            <textarea
                                name="description"
                                rows={4}
                                placeholder="Décrivez brièvement l'objectif de cette campagne..."
                                value={formData.description}
                                onChange={handleInputChange}
                            ></textarea>
                        </div>

                        <div className={styles.row}>
                            <div className={`${styles.formGroup} ${styles.col}`}>
                                <label>Catégorie</label>
                                <select name="category" value={formData.category} onChange={handleInputChange}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className={styles.row}>
                            <div className={`${styles.formGroup} ${styles.col}`}>
                                <label>Date de début (optionnel)</label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
                            </div>
                            <div className={`${styles.formGroup} ${styles.col}`}>
                                <label>Date de fin (optionnel)</label>
                                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: CADRE GRAPHIQUE */}
                {step === 2 && (
                    <div className="animate-in">
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '12px' }}>
                            <button 
                                onClick={() => setFrameMode('upload')} 
                                className={frameMode === 'upload' ? styles.btnPrimary : styles.btnSecondary}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}
                            >
                                Uploader mon cadre
                            </button>
                            <button 
                                onClick={() => setFrameMode('build')} 
                                className={frameMode === 'build' ? styles.btnPrimary : styles.btnSecondary}
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px' }}
                            >
                                Créer avec l'outil intégré
                            </button>
                        </div>

                        {frameMode === 'upload' ? (
                            <div className={styles.formGroup}>
                                <label>Uploadez votre cadre (PNG transparent)</label>
                                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                                    Le centre de l'image doit être transparent pour laisser apparaître la photo de l'utilisateur.
                                    Taille recommandée : 1080 x 1080 pixels (Max 10 MB).
                                </p>
                                
                                <input
                                    type="file"
                                    accept="image/png"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                
                                <div className={styles.uploadArea} onClick={() => fileInputRef.current?.click()}>
                                    <div className={styles.uploadIcon}>🖼️</div>
                                    <div className={styles.uploadText}>Cliquez pour uploader ou glissez-déposez</div>
                                    <div className={styles.uploadHint}>Uniquement PNG avec transparence</div>
                                </div>

                                {previewUrl && (
                                    <div className={styles.previewContainer}>
                                        <label>Aperçu du cadre :</label>
                                        <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ marginTop: '1rem' }}>
                                {previewUrl && frameFile ? (
                                    <div className={styles.previewContainer}>
                                        <label>Cadre généré avec succès !</label>
                                        <img src={previewUrl} alt="Preview" className={styles.previewImage} />
                                        <button 
                                            onClick={() => { setFrameFile(null); setPreviewUrl(null); }}
                                            className={styles.btnSecondary}
                                            style={{ marginTop: '1rem' }}
                                        >
                                            Recommencer la création
                                        </button>
                                    </div>
                                ) : (
                                    <FrameBuilder 
                                        onComplete={(file, dataUrl) => {
                                            setFrameFile(file);
                                            setPreviewUrl(dataUrl);
                                        }}
                                        onCancel={() => setFrameMode('upload')}
                                    />
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* STEP 3: PARAMETRES */}
                {step === 3 && (
                    <div className="animate-in">
                        <label className={styles.checkboxGroup}>
                            <input type="checkbox" name="allowDownload" checked={formData.allowDownload} onChange={handleInputChange} />
                            <div className={styles.checkboxInfo}>
                                <h4>Autoriser le téléchargement</h4>
                                <p>Permet aux utilisateurs de télécharger leur visuel final.</p>
                            </div>
                        </label>

                        <label className={styles.checkboxGroup}>
                            <input type="checkbox" name="allowShare" checked={formData.allowShare} onChange={handleInputChange} />
                            <div className={styles.checkboxInfo}>
                                <h4>Autoriser le partage direct</h4>
                                <p>Affiche les boutons de partage Facebook, X, WhatsApp, etc.</p>
                            </div>
                        </label>

                        <label className={styles.checkboxGroup}>
                            <input type="checkbox" name="showCounter" checked={formData.showCounter} onChange={handleInputChange} />
                            <div className={styles.checkboxInfo}>
                                <h4>Afficher le compteur de participants</h4>
                                <p>Affiche publiquement combien de personnes ont généré leur visuel.</p>
                            </div>
                        </label>

                        <label className={styles.checkboxGroup}>
                            <input type="checkbox" name="showLogo" checked={formData.showLogo} onChange={handleInputChange} />
                            <div className={styles.checkboxInfo}>
                                <h4>Afficher le logo ITA ARENA</h4>
                                <p>Maintient la signature de la plateforme sur la page publique.</p>
                            </div>
                        </label>
                    </div>
                )}

                {/* STEP 4: RECAPITULATIF */}
                {step === 4 && (
                    <div className="animate-in">
                        <h3 style={{ color: '#0A2E73', marginBottom: '1.5rem', textAlign: 'center' }}>Récapitulatif de la campagne</h3>
                        
                        <div className={styles.summary}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Titre</span>
                                <span className={styles.summaryValue}>{formData.title}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Catégorie</span>
                                <span className={styles.summaryValue}>{formData.category}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Cadre fourni</span>
                                <span className={styles.summaryValue}>{frameFile ? "Oui ✅" : "Non ❌"}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Compteur visible</span>
                                <span className={styles.summaryValue}>{formData.showCounter ? "Oui" : "Non"}</span>
                            </div>
                        </div>

                        <p style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
                            Prêt à lancer votre campagne ? Cliquez sur "Publier la campagne" pour la mettre en ligne.
                        </p>
                    </div>
                )}

                {/* STEP 5: SUCCESS */}
                {step === 5 && (
                    <div className={`${styles.successMessage} animate-in`}>
                        <div className={styles.successIcon}>🎉</div>
                        <h2 style={{ color: '#0A2E73', marginBottom: '1rem' }}>Campagne publiée avec succès !</h2>
                        <p style={{ marginBottom: '2rem', color: '#666' }}>
                            Votre campagne est maintenant en ligne. Partagez ce lien avec votre communauté :
                        </p>
                        
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                            <input 
                                type="text" 
                                readOnly 
                                value={successUrl || ''} 
                                style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#f9f9f9' }}
                            />
                            <button onClick={copyToClipboard} className={styles.btnSecondary} style={{ padding: '0.8rem 1.5rem' }}>Copier</button>
                        </div>

                        <button onClick={() => router.push('/organizer/support-campaign/dashboard')} className={styles.btnPrimary}>
                            Aller au tableau de bord
                        </button>
                    </div>
                )}

                {/* Navigation Buttons */}
                {step < 5 && (
                    <div className={styles.actions}>
                        {step > 1 ? (
                            <button onClick={handlePrev} className={styles.btnSecondary} disabled={isLoading}>
                                Précédent
                            </button>
                        ) : (
                            <div></div> // Spacer
                        )}
                        
                        {step < 4 ? (
                            <button onClick={handleNext} className={styles.btnPrimary}>
                                Suivant
                            </button>
                        ) : (
                            <button onClick={handleSubmit} className={styles.btnPrimary} disabled={isLoading}>
                                {isLoading ? "Publication..." : "Publier la campagne"}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
