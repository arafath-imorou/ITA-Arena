"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { v4 as uuidv4 } from "uuid";
import { useEffect } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type FieldType = "text" | "email" | "phone" | "select" | "radio" | "checkbox" | "file" | "photo";

interface FormField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    options: string[];
}

const FIELD_TYPES: { type: FieldType; label: string; icon: string }[] = [
    { type: "text", label: "Texte court/long", icon: "✍️" },
    { type: "email", label: "Email", icon: "📧" },
    { type: "phone", label: "Téléphone", icon: "📱" },
    { type: "select", label: "Menu déroulant", icon: "🔽" },
    { type: "radio", label: "Choix unique", icon: "🔘" },
    { type: "checkbox", label: "Choix multiples", icon: "☑️" },
    { type: "file", label: "Fichier (CV, PDF)", icon: "📎" },
    { type: "photo", label: "Photo / Image", icon: "🖼️" },
];

function SortableFieldItem({ 
    field, 
    onUpdate, 
    onDelete 
}: { 
    field: FormField; 
    onUpdate: (f: FormField) => void; 
    onDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const needsOptions = ["select", "radio", "checkbox"].includes(field.type);

    const handleOptionChange = (index: number, val: string) => {
        const newOptions = [...field.options];
        newOptions[index] = val;
        onUpdate({ ...field, options: newOptions });
    };

    const addOption = () => {
        onUpdate({ ...field, options: [...field.options, `Option ${field.options.length + 1}`] });
    };

    const removeOption = (index: number) => {
        const newOptions = field.options.filter((_, i) => i !== index);
        onUpdate({ ...field, options: newOptions });
    };

    return (
        <div ref={setNodeRef} style={style} className="field-card">
            <div className="field-header">
                <div {...attributes} {...listeners} className="drag-handle">
                    ⋮⋮
                </div>
                <div className="field-title-bar">
                    <span className="field-type-badge">{FIELD_TYPES.find(t => t.type === field.type)?.icon} {FIELD_TYPES.find(t => t.type === field.type)?.label}</span>
                </div>
                <button onClick={onDelete} className="delete-btn">🗑️</button>
            </div>

            <div className="field-body">
                <div className="input-group">
                    <label>Question / Libellé</label>
                    <input 
                        type="text" 
                        value={field.label} 
                        onChange={(e) => onUpdate({ ...field, label: e.target.value })}
                        placeholder="Ex: Quel est votre nom ?"
                        style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                </div>

                {needsOptions && (
                    <div className="options-group">
                        <label>Options de réponse</label>
                        {field.options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <input 
                                    type="text" 
                                    value={opt} 
                                    onChange={(e) => handleOptionChange(i, e.target.value)}
                                    style={{ flex: 1, padding: '0.6rem', border: '1px solid #ccc', borderRadius: '4px' }}
                                />
                                <button onClick={() => removeOption(i)} style={{ padding: '0.6rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✖</button>
                            </div>
                        ))}
                        <button onClick={addOption} style={{ fontSize: '0.9rem', color: '#0A2E73', background: 'none', border: '1px dashed #0A2E73', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>+ Ajouter une option</button>
                    </div>
                )}

                <div className="toggle-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input 
                            type="checkbox" 
                            checked={field.required} 
                            onChange={(e) => onUpdate({ ...field, required: e.target.checked })}
                        />
                        Champ obligatoire
                    </label>
                </div>
            </div>

            <style jsx>{`
                .field-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    margin-bottom: 1rem;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                }
                .field-header {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                    border-radius: 8px 8px 0 0;
                }
                .drag-handle {
                    cursor: grab;
                    padding: 0.5rem;
                    color: #9ca3af;
                    font-weight: bold;
                }
                .field-title-bar {
                    flex: 1;
                    padding-left: 0.5rem;
                }
                .field-type-badge {
                    background: #e0f2fe;
                    color: #0369a1;
                    padding: 0.2rem 0.6rem;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }
                .delete-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 4px;
                }
                .delete-btn:hover { background: #fee2e2; }
                .field-body {
                    padding: 1.5rem;
                }
                .input-group, .options-group {
                    margin-bottom: 1rem;
                }
                .input-group label, .options-group label {
                    display: block;
                    font-weight: bold;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    color: #374151;
                }
                .toggle-group {
                    margin-top: 1rem;
                    padding-top: 1rem;
                    border-top: 1px dashed #e5e7eb;
                }
            `}</style>
        </div>
    );
}

export default function CreateFormPage() {
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const [loading, setLoading] = useState(false);
    const [initialFetchDone, setInitialFetchDone] = useState(false);

    // Form settings
    const [title, setTitle] = useState("Mon Nouveau Formulaire");
    const [description, setDescription] = useState("");
    const [maxParticipants, setMaxParticipants] = useState<number | "">("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [coverImage, setCoverImage] = useState<string>("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Form Fields
    const [fields, setFields] = useState<FormField[]>([]);

    useEffect(() => {
        if (!editId) {
            setInitialFetchDone(true);
            return;
        }

        async function fetchForm() {
            try {
                setLoading(true);
                const { data: formData, error: formError } = await supabase
                    .from('forms')
                    .select('*')
                    .eq('id', editId)
                    .single();
                
                if (formError) throw formError;

                setTitle(formData.title || "");
                setDescription(formData.description || "");
                setMaxParticipants(formData.max_participants || "");
                setStartDate(formData.start_date ? formData.start_date.slice(0, 16) : "");
                setEndDate(formData.end_date ? formData.end_date.slice(0, 16) : "");
                setCoverImage(formData.cover_image || "");

                const { data: fieldsData, error: fieldsError } = await supabase
                    .from('form_fields')
                    .select('*')
                    .eq('form_id', editId)
                    .order('order_index', { ascending: true });

                if (fieldsError) throw fieldsError;

                if (fieldsData) {
                    setFields(fieldsData.map((f: any) => ({
                        id: f.id, // Using DB ID, or could generate new
                        type: f.type,
                        label: f.label,
                        required: f.required,
                        options: f.options || []
                    })));
                }
            } catch (err) {
                console.error("Error fetching form:", err);
                alert("Erreur lors du chargement du formulaire.");
            } finally {
                setLoading(false);
                setInitialFetchDone(true);
            }
        }

        fetchForm();
    }, [editId]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setFields((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addField = (type: FieldType) => {
        const newField: FormField = {
            id: uuidv4(),
            type,
            label: "Nouvelle question",
            required: false,
            options: ["select", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : []
        };
        setFields([...fields, newField]);
    };

    const updateField = (updatedField: FormField) => {
        setFields(fields.map(f => f.id === updatedField.id ? updatedField : f));
    };

    const deleteField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const handleSave = async () => {
        if (!user) return;
        if (!title.trim()) {
            alert("Le titre est obligatoire");
            return;
        }

        try {
            setLoading(true);

            let formId = editId;

            const formPayload = {
                title,
                description,
                max_participants: maxParticipants || null,
                start_date: startDate ? new Date(startDate).toISOString() : null,
                end_date: endDate ? new Date(endDate).toISOString() : null,
                cover_image: coverImage || null,
                status: 'active'
            };

            if (editId) {
                // Update Form
                const { error: updateError } = await supabase
                    .from("forms")
                    .update(formPayload)
                    .eq('id', editId);
                
                if (updateError) throw updateError;
                
                // Delete old fields
                await supabase.from("form_fields").delete().eq('form_id', editId);
            } else {
                // Insert Form
                const { data: formData, error: formError } = await supabase
                    .from("forms")
                    .insert({
                        ...formPayload,
                        organizer_id: user.id
                    })
                    .select()
                    .single();

                if (formError) throw formError;
                formId = formData.id;
            }

            // 2. Insert Fields
            if (fields.length > 0) {
                const fieldsToInsert = fields.map((f, index) => ({
                    form_id: formId,
                    type: f.type,
                    label: f.label,
                    required: f.required,
                    options: f.options.length > 0 ? f.options : null,
                    order_index: index
                }));

                const { error: fieldsError } = await supabase.from("form_fields").insert(fieldsToInsert);
                if (fieldsError) throw fieldsError;
            }

            alert(editId ? "Formulaire modifié avec succès !" : "Formulaire créé avec succès !");
            router.push(user.id ? "/organizer/forms" : "/admin");

        } catch (err: any) {
            console.error("Error saving form:", err);
            alert("Erreur lors de l'enregistrement du formulaire : " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", color: "#0A2E73", margin: 0 }}>{editId ? "Modifier le Formulaire" : "Créer un Formulaire"}</h1>
                    <p style={{ color: "#666", marginTop: "0.5rem" }}>Construisez votre formulaire sur-mesure</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={loading}
                    style={{
                        padding: "0.8rem 2rem",
                        backgroundColor: "#F7931E",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        fontWeight: "bold",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? "Enregistrement..." : "Enregistrer et Publier"}
                </button>
            </div>

            <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
                
                {/* Left Panel: Elements Palette */}
                <div style={{ width: "250px", backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb", position: "sticky", top: "2rem" }}>
                    <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.1rem", color: "#1A1A1A" }}>Ajouter un champ</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                        {FIELD_TYPES.map(ft => (
                            <button
                                key={ft.type}
                                onClick={() => addField(ft.type)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.8rem",
                                    padding: "0.8rem",
                                    backgroundColor: "#f9fafb",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    textAlign: "left",
                                    color: "#374151",
                                    fontWeight: "500",
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => e.currentTarget.style.borderColor = "#F7931E"}
                                onMouseOut={(e) => e.currentTarget.style.borderColor = "#e5e7eb"}
                            >
                                <span style={{ fontSize: "1.2rem" }}>{ft.icon}</span>
                                {ft.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: Form Builder Area */}
                <div style={{ flex: 1, backgroundColor: "#f3f4f6", padding: "2rem", borderRadius: "12px" }}>
                    
                    {/* General Settings */}
                    <div style={{ backgroundColor: "#fff", padding: "2rem", borderRadius: "12px", border: "1px solid #e5e7eb", marginBottom: "2rem" }}>
                        <h3 style={{ margin: "0 0 1.5rem 0", borderBottom: "1px solid #eee", paddingBottom: "0.5rem" }}>Paramètres Généraux</h3>
                        
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>Affiche de l'événement / Formation</label>
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    
                                    try {
                                        setUploading(true);
                                        const fileExt = file.name.split('.').pop();
                                        const fileName = `${uuidv4()}.${fileExt}`;
                                        const filePath = `forms/${fileName}`;

                                        const { error: uploadError } = await supabase.storage
                                            .from('events')
                                            .upload(filePath, file);

                                        if (uploadError) throw uploadError;

                                        const { data: { publicUrl } } = supabase.storage
                                            .from('events')
                                            .getPublicUrl(filePath);

                                        setCoverImage(publicUrl);
                                    } catch (err) {
                                        console.error('Upload error:', err);
                                        alert("Erreur lors du téléchargement de l'image");
                                    } finally {
                                        setUploading(false);
                                    }
                                }}
                            />
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: "100%",
                                    height: "150px",
                                    border: "2px dashed #ccc",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    background: coverImage ? `url(${coverImage}) center/cover` : "#f9fafb",
                                    overflow: "hidden",
                                    position: "relative"
                                }}
                            >
                                {!coverImage && (
                                    <span style={{ color: "#666" }}>{uploading ? "Envoi en cours..." : "🖼️ Cliquez pour ajouter une affiche"}</span>
                                )}
                                {coverImage && (
                                    <div style={{ position: "absolute", bottom: 0, width: "100%", background: "rgba(0,0,0,0.5)", color: "white", textAlign: "center", padding: "0.5rem", fontSize: "0.85rem" }}>Modifier l'image</div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>Titre du formulaire *</label>
                            <input 
                                type="text" 
                                value={title} 
                                onChange={e => setTitle(e.target.value)} 
                                style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", borderRadius: "6px", fontSize: "1.1rem" }}
                            />
                        </div>

                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>Description</label>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                rows={3}
                                style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", borderRadius: "6px", resize: "vertical" }}
                                placeholder="Expliquez brièvement l'objectif de ce formulaire..."
                            />
                        </div>

                        <div style={{ display: "flex", gap: "1.5rem" }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>Limite de participants</label>
                                <input 
                                    type="number" 
                                    value={maxParticipants} 
                                    onChange={e => setMaxParticipants(e.target.value ? parseInt(e.target.value) : "")} 
                                    style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", borderRadius: "6px" }}
                                    placeholder="Laisser vide pour illimité"
                                    min="1"
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>Date d'ouverture</label>
                                <input 
                                    type="datetime-local" 
                                    value={startDate} 
                                    onChange={e => setStartDate(e.target.value)} 
                                    style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", borderRadius: "6px" }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>Date de fermeture</label>
                                <input 
                                    type="datetime-local" 
                                    value={endDate} 
                                    onChange={e => setEndDate(e.target.value)} 
                                    style={{ width: "100%", padding: "0.8rem", border: "1px solid #ccc", borderRadius: "6px" }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Draggable Fields */}
                    <div>
                        <h3 style={{ margin: "0 0 1.5rem 0", color: "#374151" }}>Champs du formulaire ({fields.length})</h3>
                        
                        {fields.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "3rem", backgroundColor: "#fff", borderRadius: "12px", border: "2px dashed #ccc", color: "#9ca3af" }}>
                                Cliquez sur un champ à gauche pour l'ajouter à votre formulaire.
                            </div>
                        ) : (
                            <DndContext 
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext 
                                    items={fields.map(f => f.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {fields.map(field => (
                                        <SortableFieldItem 
                                            key={field.id} 
                                            field={field} 
                                            onUpdate={updateField} 
                                            onDelete={() => deleteField(field.id)}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
