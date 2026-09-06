"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";
import styles from "./CotisationStats.module.css";

import { downloadCotisationInvoice } from "@/lib/invoiceUtils";

export default function CotisationStatsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: cotisationId } = use(params);
    const [data, setData] = useState<{ event: any; tickets: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const res = await fetch(`/api/admin/events/${cotisationId}`);
                const json = await res.json();

                if (!res.ok || json.error) {
                    throw new Error(json.error || "Erreur de chargement des statistiques de la cotisation");
                }

                setData(json);
            } catch (err: any) {
                console.error(err);
                setError(err.message || "Impossible de charger les données");
            } finally {
                setLoading(false);
            }
        }

        if (cotisationId) {
            fetchStats();
        }
    }, [cotisationId]);

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #FF5A1F', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
                    <p style={{ color: '#64748b', fontWeight: 600 }}>Chargement des cotisations...</p>
                </div>
            </div>
        );
    }

    if (error || !data || !data.event) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                <h2>❌ Erreur</h2>
                <p style={{ color: '#64748b', margin: '1rem 0' }}>{error || "Cotisation introuvable."}</p>
                <Link href="/organizer/cotisations" style={{ background: '#FF5A1F', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 'bold' }}>
                    Retour aux cotisations
                </Link>
            </div>
        );
    }

    const { event, tickets } = data;
    const totalCollected = tickets.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const contributorsCount = tickets.length;
    const avgContribution = contributorsCount > 0 ? Math.round(totalCollected / contributorsCount) : 0;
    const targetAmount = Number(event.target_amount) || 0;
    const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((totalCollected / targetAmount) * 100)) : 0;

    const filteredTickets = tickets.filter(t => {
        const q = searchQuery.toLowerCase();
        return (
            (t.user_name || '').toLowerCase().includes(q) ||
            (t.user_email || '').toLowerCase().includes(q) ||
            (t.user_phone || '').toLowerCase().includes(q) ||
            (t.payment_phone || '').toLowerCase().includes(q)
        );
    });

    const exportCSV = () => {
        if (tickets.length === 0) {
            alert("Aucune cotisation à exporter.");
            return;
        }

        const headers = ["ID Ticket", "Nom & Prenom", "Email", "Telephone", "Montant (FCFA)", "Date", "Statut"];
        const rows = tickets.map(t => [
            t.id,
            `"${(t.user_name || 'Anonyme').replace(/"/g, '""')}"`,
            `"${(t.user_email || '').replace(/"/g, '""')}"`,
            `"${(t.user_phone || t.payment_phone || '').replace(/"/g, '""')}"`,
            t.amount || 0,
            `"${new Date(t.created_at).toLocaleString('fr-FR')}"`,
            t.status || 'valid'
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `cotisants_${event.title.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '4rem' }}>
            <div className="container" style={{ paddingTop: '2rem' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                    <BackButton variant="dark" />
                    <HomeButton variant="dark" />
                </div>

                {/* Header */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', marginBottom: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.8rem', fontWeight: 700, padding: '0.3rem 0.75rem', borderRadius: '1rem', display: 'inline-block', marginBottom: '0.5rem' }}>
                                COTISATION
                            </span>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                                {event.title}
                            </h1>
                            <p style={{ color: '#64748b', margin: '0.4rem 0 0', fontSize: '0.95rem' }}>
                                Organisé par : <strong>{event.organizer?.full_name || 'Organisateur'}</strong>
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Link href={`/events/${event.slug || event.id}`} target="_blank" style={{ background: '#f1f5f9', color: '#334155', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                                🔗 Voir la page
                            </Link>
                            <button onClick={exportCSV} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                                📥 Exporter CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>TOTAL RÉCOLTÉ</p>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#059669', margin: '0.4rem 0 0' }}>
                            {totalCollected.toLocaleString('fr-FR')} F CFA
                        </h2>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>NOMBRE DE COTISANTS</p>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', margin: '0.4rem 0 0' }}>
                            {contributorsCount}
                        </h2>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>CONTRIBUTION MOYENNE</p>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706', margin: '0.4rem 0 0' }}>
                            {avgContribution.toLocaleString('fr-FR')} F CFA
                        </h2>
                    </div>

                    {targetAmount > 0 && (
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>OBJECTIF ({progressPercent}%)</p>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.4rem 0 0.5rem' }}>
                                {targetAmount.toLocaleString('fr-FR')} F CFA
                            </h2>
                            <div style={{ background: '#e2e8f0', borderRadius: '1rem', height: '8px', overflow: 'hidden' }}>
                                <div style={{ background: '#FF5A1F', width: `${progressPercent}%`, height: '100%' }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Table of Contributors */}
                <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                            Liste des Cotisants ({filteredTickets.length})
                        </h3>
                        <input
                            type="text"
                            placeholder="Rechercher un cotisant (nom, email, téléphone)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '0.6rem 1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.9rem',
                                width: '320px',
                                maxWidth: '100%',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>#</th>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Cotisant</th>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Email</th>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Téléphone</th>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Montant Versé</th>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Date</th>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Statut</th>
                                    <th style={{ padding: '0.85rem', color: '#475569', fontWeight: 700 }}>Facture</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTickets.length > 0 ? (
                                    filteredTickets.map((t, idx) => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.85rem', color: '#94a3b8' }}>{idx + 1}</td>
                                            <td style={{ padding: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                                                {t.user_name || 'Anonyme'}
                                            </td>
                                            <td style={{ padding: '0.85rem', color: '#64748b' }}>
                                                {t.user_email || '—'}
                                            </td>
                                            <td style={{ padding: '0.85rem', color: '#64748b' }}>
                                                {t.user_phone || t.payment_phone || '—'}
                                            </td>
                                            <td style={{ padding: '0.85rem', fontWeight: 800, color: '#059669' }}>
                                                {(Number(t.amount) || 0).toLocaleString('fr-FR')} F CFA
                                            </td>
                                            <td style={{ padding: '0.85rem', color: '#64748b' }}>
                                                {new Date(t.created_at).toLocaleString('fr-FR')}
                                            </td>
                                            <td style={{ padding: '0.85rem' }}>
                                                <span style={{
                                                    background: '#dcfce7',
                                                    color: '#15803d',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    padding: '0.25rem 0.6rem',
                                                    borderRadius: '1rem'
                                                }}>
                                                    ✅ Validé
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.85rem' }}>
                                                <button
                                                    onClick={() => downloadCotisationInvoice(t, event)}
                                                    style={{
                                                        background: '#0A2E73',
                                                        color: 'white',
                                                        border: 'none',
                                                        padding: '0.35rem 0.75rem',
                                                        borderRadius: '0.4rem',
                                                        fontWeight: 700,
                                                        fontSize: '0.75rem',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    📄 Facture PDF
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#94a3b8' }}>
                                            Aucun cotisant trouvé pour le moment.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
