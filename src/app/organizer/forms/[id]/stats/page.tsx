"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

export default function FormStatsPage() {
    const params = useParams();
    const formId = params.id as string;

    const [form, setForm] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!formId) return;

        const fetchData = async () => {
            try {
                // 1. Fetch Form details
                const { data: formData, error: formError } = await supabase
                    .from("forms")
                    .select("*")
                    .eq("id", formId)
                    .single();
                if (formError) throw formError;
                setForm(formData);

                // 2. Fetch Fields
                const { data: fieldsData, error: fieldsError } = await supabase
                    .from("form_fields")
                    .select("*")
                    .eq("form_id", formId)
                    .order("order_index", { ascending: true });
                if (fieldsError) throw fieldsError;
                setFields(fieldsData || []);

                // 3. Fetch Submissions with Responses
                const { data: subData, error: subError } = await supabase
                    .from("form_submissions")
                    .select(`
                        id,
                        status,
                        created_at,
                        qr_code,
                        form_responses(field_id, value, value_json)
                    `)
                    .eq("form_id", formId)
                    .order("created_at", { ascending: false });
                
                if (subError) throw subError;
                
                // Restructure data for easier table display
                const structuredSubmissions = (subData || []).map(sub => {
                    const responseMap: Record<string, any> = {};
                    sub.form_responses.forEach((resp: any) => {
                        responseMap[resp.field_id] = resp.value_json || resp.value;
                    });
                    return {
                        id: sub.id,
                        date: new Date(sub.created_at).toLocaleString("fr-FR"),
                        status: sub.status,
                        qr_code: sub.qr_code,
                        responses: responseMap
                    };
                });
                
                setSubmissions(structuredSubmissions);

            } catch (err) {
                console.error("Error fetching stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [formId]);

    const handleExportExcel = () => {
        if (!form || submissions.length === 0) return;

        // Prepare data for Excel
        const exportData = submissions.map(sub => {
            const row: Record<string, any> = {
                "Date d'inscription": sub.date,
                "Statut": sub.status,
                "QR Code": sub.qr_code
            };

            fields.forEach(field => {
                const val = sub.responses[field.id];
                row[field.label] = Array.isArray(val) ? val.join(", ") : val || "";
            });

            return row;
        });

        // Create workbook
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inscrits");

        // Download file
        XLSX.writeFile(workbook, `Inscrits_${form.title.replace(/\s+/g, '_')}.xlsx`);
    };

    if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Chargement des données...</div>;
    if (!form) return <div style={{ padding: "4rem", textAlign: "center" }}>Formulaire introuvable.</div>;

    return (
        <div style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", color: "#0A2E73", margin: 0 }}>Statistiques : {form.title}</h1>
                    <p style={{ color: "#666", marginTop: "0.5rem" }}>Gérez les inscrits et exportez les données</p>
                </div>
                <button 
                    onClick={handleExportExcel}
                    style={{
                        padding: "0.8rem 1.5rem",
                        backgroundColor: "#10b981",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                    }}
                >
                    <span>📊</span> Exporter en Excel
                </button>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ flex: 1, backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                    <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#0A2E73", margin: 0 }}>{submissions.length}</p>
                    <p style={{ color: "#666", margin: 0 }}>Total Inscrits</p>
                </div>
                <div style={{ flex: 1, backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                    <p style={{ fontSize: "2.5rem", fontWeight: "bold", color: "#F7931E", margin: 0 }}>{form.max_participants || "∞"}</p>
                    <p style={{ color: "#666", margin: 0 }}>Places Disponibles</p>
                </div>
                <div style={{ flex: 1, backgroundColor: "#fff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e5e7eb", textAlign: "center" }}>
                    <p style={{ fontSize: "1.2rem", fontWeight: "bold", color: form.status === "active" ? "#10b981" : "#ef4444", margin: "1rem 0" }}>
                        {form.status === "active" ? "En cours" : "Fermé"}
                    </p>
                    <p style={{ color: "#666", margin: 0 }}>Statut</p>
                </div>
            </div>

            <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        <tr>
                            <th style={{ padding: "1rem", color: "#374151", fontWeight: "bold", whiteSpace: "nowrap" }}>Date</th>
                            {fields.map(f => (
                                <th key={f.id} style={{ padding: "1rem", color: "#374151", fontWeight: "bold", whiteSpace: "nowrap" }}>{f.label}</th>
                            ))}
                            <th style={{ padding: "1rem", color: "#374151", fontWeight: "bold", whiteSpace: "nowrap" }}>QR Code</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.length === 0 ? (
                            <tr>
                                <td colSpan={fields.length + 2} style={{ padding: "2rem", textAlign: "center", color: "#9ca3af" }}>
                                    Aucun participant pour le moment.
                                </td>
                            </tr>
                        ) : (
                            submissions.map((sub, idx) => (
                                <tr key={sub.id} style={{ borderBottom: idx === submissions.length - 1 ? "none" : "1px solid #e5e7eb" }}>
                                    <td style={{ padding: "1rem", color: "#6b7280", fontSize: "0.9rem", whiteSpace: "nowrap" }}>{sub.date}</td>
                                    {fields.map(f => {
                                        const val = sub.responses[f.id];
                                        const displayVal = Array.isArray(val) ? val.join(", ") : val;
                                        
                                        // If it's a file upload (URL starting with http)
                                        const isLink = typeof displayVal === "string" && displayVal.startsWith("http");

                                        return (
                                            <td key={f.id} style={{ padding: "1rem", color: "#111827", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {isLink ? <a href={displayVal} target="_blank" rel="noreferrer" style={{ color: "#3b82f6" }}>Voir le fichier</a> : (displayVal || "-")}
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: "1rem", color: "#111827", fontWeight: "500" }}>{sub.qr_code}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
