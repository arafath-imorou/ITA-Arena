"use client";

import { useState, useRef, useEffect } from "react";
import styles from "../../create/CreateEvent.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/BackButton";
import { useAuth } from "@/context/AuthContext";

export default function CreateCotisationPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        title: "",
        category_id: "",
        description: "",
        target_amount: "",
        end_date: "",
        image_url: "",
        type: "cotisation",
        organizer_id: ""
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({ ...prev, organizer_id: user.id }));
        }
    }, [user]);

    useEffect(() => {
        async function fetchCategories() {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('type', 'cotisation');
            
            if (error) {
                console.error("Error fetching categories:", error);
            } else if (data) {
                setCategories(data);
                if (!formData.category_id && data.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: data[0].id }));
                }
            }
        }
        fetchCategories();
    }, []);

    const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `cotisations/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert("Erreur lors de l'envoi de l'image");
        } finally {
            setUploading(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);

        const submissionData = {
            title: formData.title,
            category_id: formData.category_id,
            description: formData.description,
            location: "En ligne",
            date: `Jusqu'au ${formData.end_date}`,
            price: "Libre",
            image_url: formData.image_url,
            type: formData.type,
            organizer_id: formData.organizer_id,
            target_amount: parseInt(formData.target_amount) || 0
        };

        const { data, error } = await supabase
            .schema('ita_arena')
            .from('events')
            .insert([submissionData]);

        if (error) {
            console.error('Error creating cotisation:', error);
            alert("Erreur lors de la création : " + error.message);
        } else {
            setShowSuccess(true);
        }
        setLoading(false);
    };

    return (
        <div>
            <BackButton variant="dark" />
            <h1 className={styles.pageTitle}>
                {step === 3 ? "Résumé de la cotisation" : "Créer une cotisation"}
            </h1>
            <div className={styles.breadcrumb}>
                <Link href="/organizer?mode=cotisations">Dashboard</Link> &gt; <span>{step === 3 ? "Résumé" : "Nouvelle cotisation"}</span>
            </div>

            <div className={styles.stepper}>
                {[1, 2, 3].map((s) => (
                    <div key={s} className={`${styles.stepItem} ${step >= s ? styles.stepActive : ''} ${step === s ? styles.stepCurrent : ''}`}>
                        <div className={styles.stepCircle}>{s}</div>
                        <span className={styles.stepLabel}>
                            {s === 1 && 'Description'}
                            {s === 2 && 'Objectif'}
                            {s === 3 && 'Résumé'}
                        </span>
                        {s < 3 && <div className={styles.stepLine}></div>}
                    </div>
                ))}
            </div>

            <div className={styles.formCard}>
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <div className={styles.formRow}>
                            <div className={styles.imageUpload}>
                                <label>Image illustrative *</label>
                                <div className={styles.uploadBox} onClick={() => fileInputRef.current?.click()}>
                                    {formData.image_url ? (
                                        <img src={formData.image_url} alt="Preview" className={styles.imagePreview} />
                                    ) : (
                                        <div className={styles.uploadPlaceholder}>
                                            <span>💰</span>
                                            <p>{uploading ? "Envoi..." : "Choisir une image"}</p>
                                        </div>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileSelect} />
                            </div>
                            <div className={styles.inputsColumn}>
                                <div className={styles.inputGroup}>
                                    <label>Titre de la cotisation *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Soutien à la famille X, Projet Y..."
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Catégorie *</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Pourquoi cette collecte ?</label>
                            <textarea
                                placeholder="Expliquez l'objectif de cette cotisation"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{ height: '150px' }}
                            ></textarea>
                        </div>
                        <div className={styles.formActionsUnderline}>
                            <button className={styles.nextBtn} onClick={nextStep}>Suivant →</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.stepContent}>
                        <div className={styles.formGrid}>
                            <div className={styles.inputGroup}>
                                <label>Objectif financier (F CFA) *</label>
                                <input
                                    type="number"
                                    placeholder="Ex: 500000"
                                    value={formData.target_amount}
                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Date limite de collecte *</label>
                                <input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className={styles.formActionsUnderline}>
                            <button className={styles.prevBtn} onClick={prevStep}>← Précédent</button>
                            <button className={styles.nextBtn} onClick={nextStep}>Suivant →</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.stepContent}>
                        <div className={styles.summaryContent}>
                            <div className={styles.summaryInfo}>
                                <h3>Résumé de votre collecte</h3>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Titre :</span>
                                    <span className={styles.summaryValue}>{formData.title}</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Objectif :</span>
                                    <span className={styles.summaryValue}>{parseInt(formData.target_amount).toLocaleString()} F CFA</span>
                                </div>
                                <div className={styles.summaryRow}>
                                    <span className={styles.summaryLabel}>Fin :</span>
                                    <span className={styles.summaryValue}>{formData.end_date}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.formActionsUnderline}>
                            <button className={styles.prevBtn} onClick={prevStep}>← Précédent</button>
                            <button
                                className={styles.nextBtn}
                                style={{ background: '#28a745' }}
                                onClick={handleFinish}
                                disabled={loading}
                            >
                                {loading ? 'Création...' : 'Lancer la cotisation 🚀'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {showSuccess && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.successIcon}>✓</div>
                        <h2>Cotisation lancée !</h2>
                        <p>Votre collecte est maintenant active.</p>
                        <button className={styles.modalBtn} onClick={() => router.push('/organizer?mode=cotisations')}>
                            Retour au Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
