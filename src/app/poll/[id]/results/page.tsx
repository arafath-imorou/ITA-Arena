"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function PollResultsPage() {
    const params = useParams();
    const formId = params.id as string;

    const [form, setForm] = useState<any>(null);
    const [fields, setFields] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    const COLORS = ['#0A2E73', '#F7931E', '#10b981', '#3b82f6', '#f43f5e', '#8b5cf6', '#eab308'];

    useEffect(() => {
        if (!formId) return;

        const fetchData = async () => {
            try {
                // Fetch form
                const { data: formData, error: formError } = await supabase
                    .from("forms")
                    .select("*")
                    .eq("id", formId)
                    .single();

                if (formError) throw formError;
                
                if (formData.form_type !== 'poll' || !formData.show_public_results) {
                    throw new Error("Les résultats de ce sondage ne sont pas publics.");
                }
                
                setForm(formData);

                // Fetch fields
                const { data: fieldsData, error: fieldsError } = await supabase
                    .from("form_fields")
                    .select("*")
                    .eq("form_id", formId)
                    .in("type", ["radio", "checkbox", "select"]) // only aggregatable types
                    .order("order_index", { ascending: true });

                if (fieldsError) throw fieldsError;
                setFields(fieldsData || []);

                // Fetch responses
                const { data: responsesData, error: respError } = await supabase
                    .from("form_responses")
                    .select("field_id, value, value_json")
                    .in("field_id", (fieldsData || []).map(f => f.id));

                if (respError) throw respError;

                // Compute stats
                const newStats: any = {};
                (fieldsData || []).forEach(f => {
                    newStats[f.id] = {};
                    (f.options || []).forEach((opt: string) => {
                        newStats[f.id][opt] = 0;
                    });
                });

                (responsesData || []).forEach(resp => {
                    const fieldId = resp.field_id;
                    if (!newStats[fieldId]) return;

                    if (resp.value_json && Array.isArray(resp.value_json)) {
                        resp.value_json.forEach((val: string) => {
                            if (newStats[fieldId][val] !== undefined) {
                                newStats[fieldId][val]++;
                            } else {
                                newStats[fieldId][val] = 1;
                            }
                        });
                    } else if (resp.value) {
                        if (newStats[fieldId][resp.value] !== undefined) {
                            newStats[fieldId][resp.value]++;
                        } else {
                            newStats[fieldId][resp.value] = 1;
                        }
                    }
                });

                setStats(newStats);

            } catch (err: any) {
                console.error(err);
                alert(err.message || "Erreur de chargement des résultats.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [formId]);

    if (loading) return <div style={{ textAlign: "center", padding: "4rem" }}>Chargement des résultats...</div>;
    if (!form) return <div style={{ textAlign: "center", padding: "4rem" }}>Sondage introuvable</div>;

    return (
        <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "2rem 1rem" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}>
                
                <div style={{ padding: "3rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h1 style={{ color: "#0A2E73", fontSize: "2rem", margin: 0 }}>Résultats : {form.title}</h1>
                        <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", padding: "0.4rem 1rem", borderRadius: "9999px", fontWeight: "bold", fontSize: "0.9rem" }}>Sondage Public</span>
                    </div>
                    {form.description && <p style={{ color: "#666", fontSize: "1.1rem", marginBottom: "3rem", whiteSpace: "pre-wrap" }}>{form.description}</p>}
                    
                    {fields.length === 0 ? (
                        <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem" }}>Aucune question à choix multiples trouvée pour les statistiques.</p>
                    ) : (
                        fields.map((field) => {
                            const fieldStats = stats[field.id] || {};
                            const data = Object.keys(fieldStats).map(key => ({
                                name: key,
                                count: fieldStats[key]
                            })).sort((a, b) => b.count - a.count);

                            return (
                                <div key={field.id} style={{ marginBottom: "3rem", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "1.5rem" }}>
                                    <h3 style={{ margin: "0 0 1.5rem 0", color: "#111827", fontSize: "1.2rem" }}>{field.label}</h3>
                                    <div style={{ height: "300px", width: "100%" }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <XAxis type="number" allowDecimals={false} />
                                                <YAxis dataKey="name" type="category" width={150} tick={{fill: '#4b5563', fontSize: 12}} />
                                                <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}} />
                                                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                                    {data.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    <div style={{ marginTop: "3rem", textAlign: "center" }}>
                        <Link 
                            href="/"
                            style={{ display: "inline-block", padding: "1rem 2rem", backgroundColor: "#f3f4f6", color: "#374151", textDecoration: "none", borderRadius: "8px", fontWeight: "bold" }}
                        >
                            Retour à l'accueil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
