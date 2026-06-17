"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "./CreateVote.module.css";
import { v4 as uuidv4 } from "uuid";

export default function CreateVotePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [campaignId, setCampaignId] = useState<string | null>(null);

    // Step 1: Infos
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Autre");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [coverImage, setCoverImage] = useState<File | null>(null);

    // Step 2: Paramètres
    const [isPaid, setIsPaid] = useState(false);
    const [pricePerVote, setPricePerVote] = useState(500);
    const [voteLimit, setVoteLimit] = useState(0);
    const [showResults, setShowResults] = useState(true);

    // Step 3: Candidats
    const [candidates, setCandidates] = useState<any[]>([]);
    const [newCandidate, setNewCandidate] = useState({ name: "", number: "", description: "", category: "" });
    const [candidatePhoto, setCandidatePhoto] = useState<File | null>(null);

    const CATEGORIES = ["Miss", "Concours artistique", "Élection", "Prix & distinctions", "Association", "École / Université", "Autre"];

    const handleNextStep = async () => {
        if (step === 1) {
            if (!title) return alert("Le titre est requis.");
            setStep(2);
        } else if (step === 2) {
            if (!user) return;
            setLoading(true);
            try {
                let coverUrl = null;
                if (coverImage) {
                    const ext = coverImage.name.split('.').pop();
                    const path = `${uuidv4()}.${ext}`;
                    await supabase.storage.from('vote_uploads').upload(path, coverImage);
                    const { data } = supabase.storage.from('vote_uploads').getPublicUrl(path);
                    coverUrl = data.publicUrl;
                }

                const { data, error } = await supabase.from('votes_campaigns').insert({
                    organizer_id: user.id,
                    title,
                    description,
                    category,
                    cover_image: coverUrl,
                    start_date: startDate ? new Date(startDate).toISOString() : null,
                    end_date: endDate ? new Date(endDate).toISOString() : null,
                    is_paid: isPaid,
                    price_per_vote: isPaid ? pricePerVote : 0,
                    vote_limit_per_user: voteLimit,
                    show_results: showResults,
                    status: 'active'
                }).select().single();

                if (error) throw error;
                setCampaignId(data.id);
                setStep(3);
            } catch (err) {
                console.error(err);
                alert("Erreur lors de la création de la campagne.");
            } finally {
                setLoading(false);
            }
        } else if (step === 3) {
            router.push(`/organizer/votes/${campaignId}/results`);
        }
    };

    const handleAddCandidate = async () => {
        if (!campaignId || !newCandidate.name) return;
        setLoading(true);
        try {
            let photoUrl = null;
            if (candidatePhoto) {
                const ext = candidatePhoto.name.split('.').pop();
                const path = `candidates/${uuidv4()}.${ext}`;
                await supabase.storage.from('vote_uploads').upload(path, candidatePhoto);
                const { data } = supabase.storage.from('vote_uploads').getPublicUrl(path);
                photoUrl = data.publicUrl;
            }

            const { data, error } = await supabase.from('vote_candidates').insert({
                campaign_id: campaignId,
                name: newCandidate.name,
                number: newCandidate.number,
                description: newCandidate.description,
                category: newCandidate.category,
                photo_url: photoUrl
            }).select().single();

            if (error) throw error;
            setCandidates([...candidates, data]);
            setNewCandidate({ name: "", number: "", description: "", category: "" });
            setCandidatePhoto(null);
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'ajout du candidat.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Créer une campagne de Vote</h1>
                <div className={styles.stepper}>
                    <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>1. Infos</div>
                    <div className={styles.stepLine}></div>
                    <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>2. Paramètres</div>
                    <div className={styles.stepLine}></div>
                    <div className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>3. Candidats</div>
                </div>
            </div>

            <div className={styles.card}>
                {step === 1 && (
                    <div className={styles.formGroup}>
                        <label>Titre de la campagne *</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Miss Université 2026" className={styles.input} />

                        <label>Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Expliquez le but du vote..." className={styles.textarea}></textarea>

                        <label>Catégorie</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className={styles.input}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        <div className={styles.row}>
                            <div className={styles.col}>
                                <label>Date de début</label>
                                <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.input} />
                            </div>
                            <div className={styles.col}>
                                <label>Date de fin</label>
                                <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className={styles.input} />
                            </div>
                        </div>

                        <label>Image de couverture</label>
                        <input type="file" accept="image/*" onChange={e => setCoverImage(e.target.files?.[0] || null)} className={styles.input} />
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.formGroup}>
                        <div className={styles.cardOptions}>
                            <label className={`${styles.radioCard} ${!isPaid ? styles.radioActive : ''}`}>
                                <input type="radio" checked={!isPaid} onChange={() => setIsPaid(false)} />
                                <div>
                                    <h4>Vote Gratuit</h4>
                                    <p>Les utilisateurs votent sans payer</p>
                                </div>
                            </label>
                            <label className={`${styles.radioCard} ${isPaid ? styles.radioActive : ''}`}>
                                <input type="radio" checked={isPaid} onChange={() => setIsPaid(true)} />
                                <div>
                                    <h4>Vote Payant</h4>
                                    <p>Les utilisateurs achètent des votes</p>
                                </div>
                            </label>
                        </div>

                        {isPaid && (
                            <div className={styles.paidSettings}>
                                <label>Prix d'un vote (FCFA)</label>
                                <input type="number" value={pricePerVote} onChange={e => setPricePerVote(Number(e.target.value))} className={styles.input} min={100} />
                                <p className={styles.helpText}>L'utilisateur pourra choisir librement le nombre de votes qu'il souhaite acheter au moment de payer via FedaPay.</p>
                            </div>
                        )}

                        <hr className={styles.divider} />

                        <label>Limiter les votes par personne</label>
                        <select value={voteLimit} onChange={e => setVoteLimit(Number(e.target.value))} className={styles.input}>
                            <option value={0}>Illimité</option>
                            <option value={1}>1 seul vote par personne</option>
                            <option value={5}>Maximum 5 votes</option>
                        </select>

                        <label className={styles.checkboxLabel}>
                            <input type="checkbox" checked={showResults} onChange={e => setShowResults(e.target.checked)} />
                            Afficher les résultats en direct au public
                        </label>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.candidatesSection}>
                        <div className={styles.candidateList}>
                            {candidates.map((c, i) => (
                                <div key={i} className={styles.candidateCard}>
                                    <div className={styles.candidatePhoto} style={{ backgroundImage: `url(${c.photo_url || '/placeholder.png'})` }}></div>
                                    <div className={styles.candidateInfo}>
                                        <h4>{c.name} {c.number && <span>#{c.number}</span>}</h4>
                                        <p>{c.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.addCandidateForm}>
                            <h3>Ajouter un candidat</h3>
                            <div className={styles.row}>
                                <div className={styles.col}>
                                    <label>Nom complet *</label>
                                    <input type="text" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} className={styles.input} />
                                </div>
                                <div className={styles.col}>
                                    <label>Numéro de candidat</label>
                                    <input type="text" value={newCandidate.number} onChange={e => setNewCandidate({ ...newCandidate, number: e.target.value })} className={styles.input} />
                                </div>
                            </div>
                            <label>Catégorie (Optionnel)</label>
                            <input type="text" value={newCandidate.category} onChange={e => setNewCandidate({ ...newCandidate, category: e.target.value })} className={styles.input} />
                            
                            <label>Description courte</label>
                            <textarea value={newCandidate.description} onChange={e => setNewCandidate({ ...newCandidate, description: e.target.value })} className={styles.textarea}></textarea>
                            
                            <label>Photo du candidat</label>
                            <input type="file" accept="image/*" onChange={e => setCandidatePhoto(e.target.files?.[0] || null)} className={styles.input} />

                            <button onClick={handleAddCandidate} disabled={loading || !newCandidate.name} className={styles.addBtn}>
                                {loading ? "Ajout..." : "+ Ajouter ce candidat"}
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.footer}>
                    {step > 1 && step < 3 && <button onClick={() => setStep(step - 1)} className={styles.backBtn}>Retour</button>}
                    <button onClick={handleNextStep} disabled={loading} className={styles.nextBtn}>
                        {loading ? "Chargement..." : step === 1 ? "Continuer" : step === 2 ? "Créer et ajouter des candidats" : "Terminer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
