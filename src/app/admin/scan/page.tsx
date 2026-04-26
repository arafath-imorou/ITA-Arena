"use client";

import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import styles from "./Scan.module.css";
import BackButton from "@/components/BackButton";

export default function ScanPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string, details?: any } | null>(null);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Fetch events
        async function fetchEvents() {
            const { data } = await supabase.from('events').select('id, title').order('date', { ascending: false });
            if (data) {
                setEvents(data);
                if (data.length > 0) setSelectedEventId(data[0].id);
            }
        }
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;

        // Fetch stats for the selected event
        async function fetchStats() {
            const { data: tickets } = await supabase
                .from('tickets')
                .select('status')
                .eq('event_id', selectedEventId);
            
            if (tickets) {
                setStats({
                    total: tickets.length,
                    checkedIn: tickets.filter(t => t.status === 'checked-in').length
                });
            }
        }
        fetchStats();

        // Initialize Scanner
        if (!scannerRef.current) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }

        return () => {
            // Optional: Cleanup if needed, but scanner.render manages its own lifecycle usually
        };
    }, [selectedEventId]);

    async function onScanSuccess(decodedText: string) {
        // Extract key if it's the rich format or just the key
        let qrKey = decodedText;
        if (decodedText.includes('CLÉ RÉF : ')) {
            qrKey = decodedText.split('CLÉ RÉF : ')[1].trim();
        }

        // 1. Find ticket
        const { data: ticket, error } = await supabase
            .from('tickets')
            .select('*, event:events(title)')
            .eq('qr_code_key', qrKey)
            .single();

        if (error || !ticket) {
            setResult({ type: 'error', message: "Ticket invalide ou introuvable." });
            return;
        }

        // 2. Check event
        if (ticket.event_id !== selectedEventId) {
            setResult({ 
                type: 'error', 
                message: "Mauvais événement !", 
                details: { info: `Ce ticket appartient à : ${ticket.event?.title}` } 
            });
            return;
        }

        // 3. Check status
        if (ticket.status === 'checked-in') {
            setResult({ 
                type: 'error', 
                message: "Ticket déjà utilisé !", 
                details: { info: `Scanné le: ${new Date(ticket.updated_at).toLocaleString()}` } 
            });
            return;
        }

        // 4. Mark as checked-in
        const { error: updateError } = await supabase
            .from('tickets')
            .update({ status: 'checked-in', updated_at: new Date().toISOString() })
            .eq('id', ticket.id);

        if (updateError) {
            setResult({ type: 'error', message: "Erreur lors de la validation." });
            return;
        }

        // 5. Success
        setResult({ 
            type: 'success', 
            message: "Ticket Validé !", 
            details: { name: ticket.user_name, category: ticket.category } 
        });

        // Update local stats and recent scans
        setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
        setRecentScans(prev => [{
            name: ticket.user_name,
            category: ticket.category,
            time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 5));

        // Vibration for tactile feedback
        if (navigator.vibrate) navigator.vibrate(100);
    }

    function onScanFailure(error: any) {
        // Handle scan failure, usually silent
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <BackButton />
                    <h1>Scanner de Tickets</h1>
                </div>
                <p>Validez les entrées en temps réel</p>
                
                <select 
                    className={styles.eventSelector}
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                >
                    {events.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                </select>
            </div>

            <div className={styles.scannerWrapper}>
                <div id="reader"></div>
                
                {result && (
                    <div className={styles.overlay}>
                        {result.type === 'success' ? (
                            <>
                                <div className={styles.successIcon}>✅</div>
                                <h2 className={styles.resultTitle}>{result.message}</h2>
                                <div className={styles.resultDetails}>
                                    <p>Acheteur: <strong>{result.details.name}</strong></p>
                                    <p>Catégorie: <strong>{result.details.category}</strong></p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.errorIcon}>❌</div>
                                <h2 className={styles.resultTitle}>{result.message}</h2>
                                {result.details?.info && (
                                    <div className={styles.resultDetails}>
                                        <p>{result.details.info}</p>
                                    </div>
                                )}
                            </>
                        )}
                        <button className={styles.closeBtn} onClick={() => setResult(null)}>
                            CONTINUER LE SCAN
                        </button>
                    </div>
                )}
            </div>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statVal}>{stats.checkedIn}</span>
                    <span className={styles.statLabel}>Présents</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statVal}>{stats.total}</span>
                    <span className={styles.statLabel}>Total Vendus</span>
                </div>
            </div>

            {recentScans.length > 0 && (
                <div className={styles.lastScans}>
                    <h2>Derniers scans réussis</h2>
                    {recentScans.map((scan, i) => (
                        <div key={i} className={styles.scanRow}>
                            <div className={styles.scanInfo}>
                                <h4>{scan.name}</h4>
                                <p>{scan.category}</p>
                            </div>
                            <span className={styles.scanTime}>{scan.time}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
