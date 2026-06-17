"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export default function PublicFormPage() {
    const params = useParams();
    const router = useRouter();
    const formId = params.id as string;

    const [form, setForm] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");
    
    const [responses, setResponses] = useState<Record<string, any>>({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!formId) return;

        const fetchForm = async () => {
            try {
                // Fetch form details
                const { data: formData, error: formError } = await supabase
                    .from("forms")
                    .select("*, form_submissions(count)")
                    .eq("id", formId)
                    .single();

                if (formError) throw formError;

                // Validation: Status
                if (formData.status !== "active") {
                    throw new Error("Ce formulaire est actuellement fermé.");
                }

                // Validation: Dates
                const now = new Date();
                if (formData.start_date && new Date(formData.start_date) > now) {
                    throw new Error("Ce formulaire n'est pas encore ouvert.");
                }
                if (formData.end_date && new Date(formData.end_date) < now) {
                    throw new Error("La date limite de ce formulaire est dépassée.");
                }

                // Validation: Limits
                if (formData.max_participants) {
                    const count = formData.form_submissions?.[0]?.count || 0;
                    if (count >= formData.max_participants) {
                        throw new Error("Ce formulaire a atteint le nombre maximum de participants.");
                    }
                }

                setForm(formData);

                // Fetch fields
                const { data: fieldsData, error: fieldsError } = await supabase
                    .from("form_fields")
                    .select("*")
                    .eq("form_id", formId)
                    .order("order_index", { ascending: true });

                if (fieldsError) throw fieldsError;
                setFields(fieldsData || []);

            } catch (err: any) {
                setErrorMsg(err.message || "Erreur lors du chargement du formulaire.");
            } finally {
                setLoading(false);
            }
        };

        fetchForm();
    }, [formId]);

    const handleFieldChange = (fieldId: string, value: any) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleCheckboxChange = (fieldId: string, option: string, isChecked: boolean) => {
        setResponses(prev => {
            const current = prev[fieldId] || [];
            if (isChecked) {
                return { ...prev, [fieldId]: [...current, option] };
            } else {
                return { ...prev, [fieldId]: current.filter((o: string) => o !== option) };
            }
        });
    };

    const handleFileUpload = async (fieldId: string, file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExt}`;
            const filePath = `${formId}/${fileName}`;

            const { error: uploadError, data } = await supabase.storage
                .from("form_uploads")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
                .from("form_uploads")
                .getPublicUrl(filePath);

            handleFieldChange(fieldId, publicUrlData.publicUrl);
        } catch (err) {
            console.error("Erreur upload:", err);
            alert("Erreur lors de l'upload du fichier.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        for (const field of fields) {
            if (field.required && !responses[field.id]) {
                alert(`Le champ "${field.label}" est obligatoire.`);
                return;
            }
        }

        try {
            setSubmitting(true);
            const qrCodeValue = `ITA-FORM-${uuidv4().split('-')[0].toUpperCase()}`;

            // 1. Create Submission
            const { data: submissionData, error: subError } = await supabase
                .from("form_submissions")
                .insert({
                    form_id: formId,
                    qr_code: qrCodeValue
                })
                .select()
                .single();

            if (subError) throw subError;

            // 2. Insert Responses
            const responseInserts = Object.keys(responses).map(fieldId => {
                const value = responses[fieldId];
                const isComplex = Array.isArray(value) || typeof value === "object";
                return {
                    submission_id: submissionData.id,
                    field_id: fieldId,
                    value: isComplex ? null : value,
                    value_json: isComplex ? value : null
                };
            });

            if (responseInserts.length > 0) {
                const { error: respError } = await supabase.from("form_responses").insert(responseInserts);
                if (respError) throw respError;
            }

            // Redirect to success
            router.push(`/f/${formId}/success?sub=${submissionData.id}`);

        } catch (err: any) {
            console.error(err);
            alert("Une erreur est survenue lors de l'envoi de votre formulaire.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div style={{ textAlign: "center", padding: "4rem" }}>Chargement...</div>;
    }

    if (errorMsg) {
        return (
            <div style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "2rem", backgroundColor: "#fee2e2", borderRadius: "12px", color: "#ef4444" }}>
                <h2>Oups !</h2>
                <p>{errorMsg}</p>
            </div>
        );
    }

    if (!form) return null;

    return (
        <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
                {form.cover_image && (
                    <div style={{ height: "200px", backgroundImage: `url(${form.cover_image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                )}
                
                <div style={{ padding: "3rem" }}>
                    <h1 style={{ color: "#0A2E73", fontSize: "2.5rem", marginBottom: "1rem" }}>{form.title}</h1>
                    {form.description && <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: "2rem", whiteSpace: "pre-wrap" }}>{form.description}</p>}
                    
                    <form onSubmit={handleSubmit}>
                        {fields.map(field => (
                            <div key={field.id} style={{ marginBottom: "2rem" }}>
                                <label style={{ display: "block", fontWeight: "bold", color: "#1A1A1A", marginBottom: "0.8rem", fontSize: "1.1rem" }}>
                                    {field.label} {field.required && <span style={{ color: "#ef4444" }}>*</span>}
                                </label>
                                
                                {field.type === "text" && (
                                    <input 
                                        type="text" 
                                        required={field.required}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
                                    />
                                )}
                                
                                {field.type === "email" && (
                                    <input 
                                        type="email" 
                                        required={field.required}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
                                    />
                                )}
                                
                                {field.type === "phone" && (
                                    <input 
                                        type="tel" 
                                        required={field.required}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem" }} 
                                    />
                                )}

                                {field.type === "select" && (
                                    <select 
                                        required={field.required}
                                        onChange={e => handleFieldChange(field.id, e.target.value)}
                                        style={{ width: "100%", padding: "1rem", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "1rem", backgroundColor: "#fff" }}
                                    >
                                        <option value="">Sélectionnez une option</option>
                                        {field.options?.map((opt: string, i: number) => (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                )}

                                {field.type === "radio" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {field.options?.map((opt: string, i: number) => (
                                            <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                                <input 
                                                    type="radio" 
                                                    name={`field_${field.id}`}
                                                    value={opt}
                                                    required={field.required}
                                                    onChange={e => handleFieldChange(field.id, e.target.value)}
                                                    style={{ width: "1.2rem", height: "1.2rem", accentColor: "#F7931E" }}
                                                />
                                                <span style={{ fontSize: "1rem", color: "#374151" }}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {field.type === "checkbox" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        {field.options?.map((opt: string, i: number) => (
                                            <label key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                                                <input 
                                                    type="checkbox" 
                                                    value={opt}
                                                    onChange={e => handleCheckboxChange(field.id, opt, e.target.checked)}
                                                    style={{ width: "1.2rem", height: "1.2rem", accentColor: "#F7931E" }}
                                                />
                                                <span style={{ fontSize: "1rem", color: "#374151" }}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {(field.type === "file" || field.type === "photo") && (
                                    <div>
                                        <input 
                                            type="file"
                                            accept={field.type === "photo" ? "image/*" : ".pdf,.doc,.docx"}
                                            required={field.required && !responses[field.id]}
                                            onChange={e => e.target.files && handleFileUpload(field.id, e.target.files[0])}
                                            style={{ display: "block", width: "100%", padding: "1rem", border: "2px dashed #d1d5db", borderRadius: "8px", cursor: "pointer", backgroundColor: "#f9fafb" }}
                                        />
                                        {responses[field.id] && <p style={{ color: "#10b981", fontSize: "0.9rem", marginTop: "0.5rem" }}>✓ Fichier téléchargé avec succès</p>}
                                    </div>
                                )}
                            </div>
                        ))}

                        <button 
                            type="submit" 
                            disabled={submitting}
                            style={{
                                width: "100%",
                                padding: "1.2rem",
                                backgroundColor: "#F7931E",
                                color: "#fff",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "1.2rem",
                                fontWeight: "bold",
                                cursor: submitting ? "not-allowed" : "pointer",
                                opacity: submitting ? 0.7 : 1,
                                marginTop: "2rem"
                            }}
                        >
                            {submitting ? "Envoi en cours..." : "Soumettre mon inscription"}
                        </button>
                    </form>
                </div>
                
                <div style={{ backgroundColor: "#f9fafb", padding: "1.5rem", textAlign: "center", borderTop: "1px solid #e5e7eb" }}>
                    <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                        Propulsé par <strong>ITA ARENA</strong>
                    </p>
                </div>
            </div>
        </div>
    );
}
