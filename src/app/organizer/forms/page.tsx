"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export default function FormsDashboardPage() {
    const { user } = useAuth();
    const [forms, setForms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchForms = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from("forms")
                    .select("*, form_submissions(count)")
                    .eq("organizer_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setForms(data || []);
            } catch (err) {
                console.error("Error fetching forms:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchForms();
    }, [user]);

    if (loading) {
        return (
            <div style={{ padding: "2rem", textAlign: "center" }}>
                Chargement de vos formulaires...
            </div>
        );
    }

    return (
        <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "2rem", color: "#0A2E73" }}>Mes Formulaires</h1>
                <Link
                    href="/organizer/forms/create"
                    style={{
                        padding: "0.8rem 1.5rem",
                        backgroundColor: "#F7931E",
                        color: "#fff",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontWeight: "bold",
                    }}
                >
                    + Créer un formulaire
                </Link>
            </div>

            {forms.length === 0 ? (
                <div style={{ textAlign: "center", padding: "4rem", backgroundColor: "#fff", borderRadius: "12px", border: "1px dashed #ccc" }}>
                    <h3 style={{ color: "#666", marginBottom: "1rem" }}>Vous n'avez créé aucun formulaire pour le moment.</h3>
                    <p style={{ color: "#999" }}>Utilisez ITA Forms pour gérer les inscriptions à vos événements.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    {forms.map((form) => (
                        <div key={form.id} style={{ backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)", border: "1px solid #f0f0f0" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <span style={{
                                    padding: "0.2rem 0.6rem",
                                    borderRadius: "20px",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    backgroundColor: form.status === "active" ? "#e6ffed" : "#f1f1f1",
                                    color: form.status === "active" ? "#22863a" : "#666",
                                }}>
                                    {form.status === "active" ? "Actif" : "Brouillon / Fermé"}
                                </span>
                                <span style={{ color: "#999", fontSize: "0.85rem" }}>
                                    {new Date(form.created_at).toLocaleDateString("fr-FR")}
                                </span>
                            </div>
                            
                            <h3 style={{ margin: "0 0 0.5rem 0", color: "#1A1A1A" }}>{form.title}</h3>
                            <p style={{ margin: "0 0 1.5rem 0", color: "#666", fontSize: "0.9rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                {form.description || "Aucune description"}
                            </p>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", padding: "0.8rem", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                                <div style={{ textAlign: "center" }}>
                                    <span style={{ display: "block", fontWeight: "bold", color: "#0A2E73", fontSize: "1.2rem" }}>
                                        {form.form_submissions?.[0]?.count || 0}
                                    </span>
                                    <span style={{ fontSize: "0.8rem", color: "#666" }}>Inscrits</span>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                    <span style={{ display: "block", fontWeight: "bold", color: "#0A2E73", fontSize: "1.2rem" }}>
                                        {form.max_participants ? form.max_participants : "∞"}
                                    </span>
                                    <span style={{ fontSize: "0.8rem", color: "#666" }}>Places</span>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <Link
                                    href={`/organizer/forms/${form.id}/stats`}
                                    style={{ flex: 1, textAlign: "center", padding: "0.6rem", border: "1px solid #0A2E73", color: "#0A2E73", borderRadius: "6px", textDecoration: "none", fontSize: "0.9rem", fontWeight: "500" }}
                                >
                                    Gérer
                                </Link>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/f/${form.id}`;
                                        navigator.clipboard.writeText(url);
                                        alert("Lien copié !");
                                    }}
                                    style={{ padding: "0.6rem 1rem", backgroundColor: "#f0f4f8", border: "none", color: "#0A2E73", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}
                                    title="Copier le lien public"
                                >
                                    🔗
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
