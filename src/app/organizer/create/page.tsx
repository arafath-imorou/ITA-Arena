"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./CreateEvent.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useMode } from "@/context/ModeContext";
import BackButton from "@/components/BackButton";

import { useAuth } from "@/context/AuthContext";

export default function CreateEventPage() {
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
        // Step 2: Location
        is_online: false,
        country: "Côte d'Ivoire",
        city: "",
        address: "",
        location: "", // Combined for DB compatibility
        // Step 3: Date
        timezone: "Africa/Porto-Novo (GMT+1)",
        start_date: "",
        end_date: "",
        start_time: "",
        end_time: "",
        // Step 4: Tickets
        is_free: false,
        currency: "F CFA (XOF)",
        price: "0",
        ticket_categories: [
            { id: 1, name: "", price: "", stock: "", description: "", instructions: "" }
        ],
        image_url: "",
        type: "event",
        organizer_id: "" // Will be set on submit
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
                .eq('type', 'event');
            
            if (error) {
                console.error("Error fetching categories:", error);
                alert("Erreur catégories : " + error.message);
            } else if (data) {
                console.log("Categories loaded:", data);
                if (data.length === 0) {
                    alert("Aucune catégorie trouvée dans la base de données.");
                }
                setCategories(data);
                if (!formData.category_id && data.length > 0) {
                    setFormData(prev => ({ ...prev, category_id: data[0].id }));
                }
            }
        }
        fetchCategories();
    }, []);

    const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `events/${fileName}`;

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
            alert("Erreur lors de l'envoi de l'image : " + (error.message || "Erreur inconnue"));
        } finally {
            setUploading(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);

        // Prepare simplified data for the current schema
        const finalLocation = formData.is_online ? "En ligne" : `${formData.address}, ${formData.city}, ${formData.country}`;
        const finalDate = `${formData.start_date} au ${formData.end_date}`;
        const finalTime = `${formData.start_time}`;

        const submissionData = {
            title: formData.title,
            category_id: formData.category_id,
            description: formData.description,
            location: finalLocation,
            date: finalDate,
            time: finalTime,
            price: formData.is_free ? "0" : (formData.ticket_categories[0]?.price || "0"),
            image_url: formData.image_url,
            type: formData.type,
            organizer_id: formData.organizer_id
        };

        const { data, error } = await supabase
            .schema('ita_arena')
            .from('events')
            .insert([submissionData]);

        if (error) {
            console.error('Error creating event:', error);
            alert("Erreur lors de la création de l'évènement : " + error.message);
            setLoading(false);
            return;
        } else {
            setShowSuccess(true);
        }
        setLoading(false);
    };

    return (
        <div>
            <BackButton variant="dark" />
            <h1 className={styles.pageTitle}>
                {step === 5 ? "Résumé de l'évènement" : "Créer un évènement"}
            </h1>
            <div className={styles.breadcrumb}>
                <Link href="/organizer">Dashboard</Link> &gt; <span>{step === 5 ? "Résumé" : "Créer un évènement"}</span>
            </div>

            {/* Stepper */}
            <div className={styles.stepper}>
                {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className={`${styles.stepItem} ${step >= s ? styles.stepActive : ''} ${step === s ? styles.stepCurrent : ''}`}>
                        <div className={styles.stepCircle}>{s}</div>
                        <span className={styles.stepLabel}>
                            {s === 1 && 'Description'}
                            {s === 2 && 'Où ?'}
                            {s === 3 && 'Quand ?'}
                            {s === 4 && 'Billetterie'}
                            {s === 5 && 'Résumé'}
                        </span>
                        {s < 5 && <div className={styles.stepLine}></div>}
                    </div>
                ))}
            </div>

            {/* Form Container */}
            <div className={styles.formCard}>
                {step === 1 && (
                    <Step1_Description
                        onNext={nextStep}
                        formData={formData}
                        setFormData={setFormData}
                        onFileClick={() => fileInputRef.current?.click()}
                        uploading={uploading}
                        categories={categories}
                    />
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                {step === 2 && <Step2_Location onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />}
                {step === 3 && <Step3_Date onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />}
                {step === 4 && <Step4_Tickets onNext={nextStep} onPrev={prevStep} formData={formData} setFormData={setFormData} />}
                {step === 5 && <Step5_Summary onPrev={prevStep} onFinish={handleFinish} loading={loading} formData={formData} categories={categories} />}
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.successIcon}>✓</div>
                        <h2>Évènement publié !</h2>
                        <p>Votre évènement "<strong>{formData.title}</strong>" est maintenant en ligne et visible par tous.</p>
                        <div className={styles.modalActions}>
                            <button className={styles.modalBtn} onClick={() => router.push('/organizer')}>
                                Retour au Dashboard
                            </button>
                            <button className={styles.modalBtnSecondary} onClick={() => window.location.href = '/'}>
                                Voir sur le site
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Step1_Description({ onNext, formData, setFormData, onFileClick, uploading, categories }: {
    onNext: () => void,
    formData: any,
    setFormData: any,
    onFileClick: () => void,
    uploading: boolean,
    categories: any[]
}) {
    return (
        <div className={styles.stepContent}>
            <div className={styles.formRow}>
                <div className={styles.imageUpload}>
                    <label>Image de couverture *</label>
                    <div className={styles.uploadBox} onClick={onFileClick}>
                        {formData.image_url ? (
                            <>
                                <img src={formData.image_url} alt="Preview" className={styles.imagePreview} />
                                <button
                                    className={styles.removeImageBtn}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFormData({ ...formData, image_url: "" });
                                    }}
                                >
                                    ✕
                                </button>
                            </>
                        ) : (
                            <div className={styles.uploadPlaceholder}>
                                <span>🖼️</span>
                                <p>{uploading ? "Envoi en cours..." : "Choisir une image"}</p>
                                <small>Recommandé : 1200x630px</small>
                            </div>
                        )}
                        {uploading && (
                            <div className={styles.uploadLoading}>
                                <div className={styles.spinner}></div>
                            </div>
                        )}
                    </div>
                </div>
                <div className={styles.inputsColumn}>
                    <div className={styles.inputGroup}>
                        <label>Titre de l'évènement *</label>
                        <input
                            type="text"
                            placeholder="Donnez un titre captivant"
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
                <label>Description textuelle</label>
                <div className={styles.richTextEditor}>
                    <textarea
                        placeholder="Décrivez l'évènement et encouragez les visiteurs à participer"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                </div>
            </div>

            <div className={styles.formActionsUnderline}>
                <button className={styles.nextBtn} onClick={onNext}>Suivant →</button>
            </div>
        </div>
    );
}

function Step2_Location({ onNext, onPrev, formData, setFormData }: { onNext: () => void, onPrev: () => void, formData: any, setFormData: any }) {
    return (
        <div className={styles.stepContent}>
            <div className={styles.inputGroup}>
                <label>Où aura lieu l'évènement ? *</label>
                <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="locationType"
                            checked={formData.is_online}
                            onChange={() => setFormData({ ...formData, is_online: true })}
                        /> En ligne
                    </label>
                    <label className={styles.radioLabel}>
                        <input
                            type="radio"
                            name="locationType"
                            checked={!formData.is_online}
                            onChange={() => setFormData({ ...formData, is_online: false })}
                        /> En présentiel
                    </label>
                </div>
            </div>

            {!formData.is_online && (
                <div className={styles.formGrid}>
                    <div className={styles.inputGroup}>
                        <label>Pays *</label>
                        <select
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        >
                            <option>Côte d'Ivoire</option>
                            <option>Bénin</option>
                            <option>Sénégal</option>
                            <option>France</option>
                        </select>
                    </div>
                    <div className={styles.inputGroup}>
                        <label>Ville *</label>
                        <input
                            type="text"
                            placeholder="Entrez une ville"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                    </div>
                    <div className={styles.inputGroup} style={{ gridColumn: 'span 2' }}>
                        <label>Adresse complète *</label>
                        <input
                            type="text"
                            placeholder="Rue, Quartier, Immeuble..."
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                </div>
            )}

            <div className={styles.formActionsUnderline}>
                <button className={styles.prevBtn} onClick={onPrev}>← Précédent</button>
                <button className={styles.nextBtn} onClick={onNext}>Suivant →</button>
            </div>
        </div>
    );
}

function Step3_Date({ onNext, onPrev, formData, setFormData }: { onNext: () => void, onPrev: () => void, formData: any, setFormData: any }) {
    return (
        <div className={styles.stepContent}>
            <div className={styles.inputGroup}>
                <label>Fuseau horaire de l'évènement *</label>
                <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                >
                    <option>Africa/Porto-Novo (GMT+1)</option>
                    <option>Africa/Abidjan (GMT+0)</option>
                    <option>Europe/Paris (GMT+1)</option>
                </select>
            </div>

            <div className={styles.formGrid}>
                <div className={styles.inputGroup}>
                    <label>Date et heure de début *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                        <input
                            type="time"
                            value={formData.start_time}
                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        />
                    </div>
                </div>
                <div className={styles.inputGroup}>
                    <label>Date et heure de fin *</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        />
                        <input
                            type="time"
                            value={formData.end_time}
                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <button className={styles.addDateBtn}>+ Ajouter une date</button>

            <div className={styles.formActionsUnderline}>
                <button className={styles.prevBtn} onClick={onPrev}>← Précédent</button>
                <button className={styles.nextBtn} onClick={onNext}>Suivant →</button>
            </div>
        </div>
    );
}

function Step4_Tickets({ onNext, onPrev, formData, setFormData }: { onNext: () => void, onPrev: () => void, formData: any, setFormData: any }) {
    const addCategory = () => {
        const newCat = { id: Date.now(), name: "", price: "", stock: "", description: "", instructions: "" };
        setFormData({ ...formData, ticket_categories: [...formData.ticket_categories, newCat] });
    };

    const removeCategory = (id: number) => {
        if (formData.ticket_categories.length > 1) {
            setFormData({ ...formData, ticket_categories: formData.ticket_categories.filter((cat: any) => cat.id !== id) });
        }
    };

    const updateCategory = (id: number, field: string, value: string) => {
        const updated = formData.ticket_categories.map((cat: any) =>
            cat.id === id ? { ...cat, [field]: value } : cat
        );
        setFormData({ ...formData, ticket_categories: updated });
    };

    return (
        <div className={styles.stepContent}>
            <div className={styles.formGrid} style={{ marginBottom: '2rem' }}>
                <div className={styles.inputGroup}>
                    <label>L'évènement est-il gratuit ? *</label>
                    <div className={styles.radioGroup}>
                        <label className={styles.radioLabel}>
                            <input type="radio" checked={formData.is_free} onChange={() => setFormData({ ...formData, is_free: true })} /> Oui
                        </label>
                        <label className={styles.radioLabel}>
                            <input type="radio" checked={!formData.is_free} onChange={() => setFormData({ ...formData, is_free: false })} /> Non
                        </label>
                    </div>
                </div>
                <div className={styles.inputGroup}>
                    <label>Devise des tickets *</label>
                    <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                        <option>F CFA (XOF)</option>
                        <option>Euro (EUR)</option>
                        <option>Dollar (USD)</option>
                    </select>
                </div>
            </div>

            {formData.ticket_categories.map((cat: any, index: number) => (
                <div key={cat.id} className={styles.categoryCard}>
                    <div className={styles.categoryCardHeader}>
                        <span className={styles.categoryTitle}>Catégorie {index + 1}</span>
                        {formData.ticket_categories.length > 1 && (
                            <button className={styles.delCatBtn} onClick={() => removeCategory(cat.id)}>Supprimer</button>
                        )}
                    </div>
                    <div className={styles.formGrid}>
                        <div className={styles.inputGroup}>
                            <label>Nom *</label>
                            <input
                                type="text" placeholder="Ex: Grand public, VIP..."
                                value={cat.name} onChange={(e) => updateCategory(cat.id, 'name', e.target.value)}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Stock en ligne *</label>
                            <input
                                type="text" placeholder="100"
                                value={cat.stock} onChange={(e) => updateCategory(cat.id, 'stock', e.target.value)}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Prix d'un ticket *</label>
                            <input
                                type="text" placeholder="0"
                                value={cat.price} onChange={(e) => updateCategory(cat.id, 'price', e.target.value)}
                                disabled={formData.is_free}
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Description (Facultative)</label>
                            <input
                                type="text" placeholder="Avantages du ticket"
                                value={cat.description} onChange={(e) => updateCategory(cat.id, 'description', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button className={styles.addCatBtn} onClick={addCategory}>+ Ajouter une catégorie</button>

            <div className={styles.formActionsUnderline}>
                <button className={styles.prevBtn} onClick={onPrev}>← Précédent</button>
                <button className={styles.nextBtn} onClick={onNext}>Suivant →</button>
            </div>
        </div>
    );
}

function Step5_Summary({ onPrev, onFinish, loading, formData, categories }: { onPrev: () => void, onFinish: () => void, loading: boolean, formData: any, categories: any[] }) {
    const categoryLabel = categories.find(c => c.id === formData.category_id)?.label || formData.category_id;

    return (
        <div className={styles.stepContent}>
            <div className={styles.summaryTabs}>
                <div className={`${styles.summaryTab} ${styles.summaryTabActive}`}>Informations générales</div>
            </div>

            <div className={styles.summaryContent}>
                <div className={styles.summaryPoster}>
                    <img src={formData.image_url || "/placeholder-event.jpg"} alt="Event Poster" />
                </div>
                <div className={styles.summaryInfo}>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Titre :</span>
                        <span className={styles.summaryValue}>{formData.title}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Catégorie :</span>
                        <span className={styles.summaryValue}>{categoryLabel}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Description :</span>
                        <span className={styles.summaryValue}>{formData.description || "Aucune description"}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Lieu :</span>
                        <span className={styles.summaryValue}>
                            {formData.is_online ? '🌐 En ligne' : `📍 ${formData.address}, ${formData.city}, ${formData.country}`}
                        </span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Date :</span>
                        <span className={styles.summaryValue}>
                            📅 Du {formData.start_date} à {formData.start_time} <br />
                            au {formData.end_date} à {formData.end_time}
                        </span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Fuseau :</span>
                        <span className={styles.summaryValue}>{formData.timezone}</span>
                    </div>
                    <div className={styles.summaryRow}>
                        <span className={styles.summaryLabel}>Billetterie :</span>
                        <span className={styles.summaryValue}>
                            {formData.is_free ? (
                                <span className={`${styles.badge} ${styles.badgeGratuit}`}>Gratuit</span>
                            ) : (
                                <div>
                                    {formData.ticket_categories.map((cat: any) => (
                                        <div key={cat.id} style={{ marginBottom: '4px' }}>
                                            • {cat.name} : <strong>{cat.price} {formData.currency.split(' ')[0]}</strong> ({cat.stock} places)
                                        </div>
                                    ))}
                                </div>
                            )}
                        </span>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <span className={`${styles.badge} ${styles.badgePublic}`}>Public</span>
                    </div>
                </div>
            </div>

            <div className={styles.formActionsUnderline}>
                <button className={styles.prevBtn} onClick={onPrev}>← Précédent</button>
                <button
                    className={styles.nextBtn}
                    style={{ background: '#28a745' }}
                    onClick={onFinish}
                    disabled={loading}
                >
                    {loading ? 'Publication...' : 'Publier l\'évènement 🚀'}
                </button>
            </div>
        </div>
    );
}
