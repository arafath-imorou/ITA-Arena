"use client";

import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import styles from "./Scan.module.css";
import BackButton from "@/components/BackButton";

export default function ScanPage() {
    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string, details?: any } | null>(null);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    
    const html5QrCode = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            const { data } = await supabase.from('events').select('id, title').order('date', { ascending: false });
            if (data) {
                setEvents(data);
                if (data.length > 0) setSelectedEventId(data[0].id);
            }
        }
        fetchEvents();

        return () => {
            if (html5QrCode.current && html5QrCode.current.isScanning) {
                html5QrCode.current.stop();
            }
        };
    }, []);

    useEffect(() => {
        if (!selectedEventId) return;
        fetchStats();
    }, [selectedEventId]);

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

    const startScanner = async () => {
        setErrorMsg("");
        try {
            if (!html5QrCode.current) {
                html5QrCode.current = new Html5Qrcode("reader");
            }

            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            await html5QrCode.current.start(
                { facingMode: "environment" }, 
                config, 
                onScanSuccess,
                onScanFailure // Missing 4th argument fixed
            );
            setIsCameraActive(true);
        } catch (err: any) {
            console.error(err);
            setErrorMsg("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
    };

    const stopScanner = async () => {
        if (html5QrCode.current && html5QrCode.current.isScanning) {
            await html5QrCode.current.stop();
            setIsCameraActive(false);
        }
    };

    async function onScanSuccess(decodedText: string) {
        // Play sound if possible
        try { new Audio('/success.mp3').play(); } catch(e) {}

        let qrKey = decodedText;
        if (decodedText.includes('CLÉ RÉF : ')) {
            qrKey = decodedText.split('CLÉ RÉF : ')[1].trim();
        }

        const { data: ticket, error } = await supabase
            .from('tickets')
            .select('*, event:events(title)')
            .eq('qr_code_key', qrKey)
            .single();

        if (error || !ticket) {
            setResult({ type: 'error', message: "Ticket invalide ou inconnu." });
            return;
        }

        if (ticket.event_id !== selectedEventId) {
            setResult({ 
                type: 'error', 
                message: "Mauvais événement !", 
                details: { info: `Appartient à : ${ticket.event?.title}` } 
            });
            return;
        }

        if (ticket.status === 'checked-in') {
            setResult({ 
                type: 'error', 
                message: "Déjà utilisé !", 
                details: { info: `Scanné le: ${new Date(ticket.updated_at).toLocaleString()}` } 
            });
            return;
        }

        const { error: updateError } = await supabase
            .from('tickets')
            .update({ status: 'checked-in', updated_at: new Date().toISOString() })
            .eq('id', ticket.id);

        if (updateError) {
            setResult({ type: 'error', message: "Erreur de validation base de données." });
            return;
        }

        setResult({ 
            type: 'success', 
            message: "Entrée Validée !", 
            details: { name: ticket.user_name, category: ticket.category } 
        });

        setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
        setRecentScans(prev => [{
            name: ticket.user_name,
            category: ticket.category,
            time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 5));

        if (navigator.vibrate) navigator.vibrate(200);
    }

    function onScanFailure(error: any) {
        // Handle scan failure, usually silent
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                    <BackButton />
                    <h1>Scanner Pro</h1>
                </div>
                
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
                <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                
                {!isCameraActive && !result && (
                    <div className={styles.cameraPlaceholder}>
                        <button className={styles.startBtn} onClick={startScanner}>
                            📷 ACTIVER LA CAMÉRA
                        </button>
                        {errorMsg && <p className={styles.errorText}>{errorMsg}</p>}
                    </div>
                )}
                
                {result && (
                    <div className={styles.overlay} style={{ backgroundColor: result.type === 'success' ? 'rgba(22, 101, 52, 0.95)' : 'rgba(153, 27, 27, 0.95)' }}>
                        {result.type === 'success' ? (
                            <>
                                <div className={styles.successIcon}>✅</div>
                                <h2 className={styles.resultTitle}>{result.message}</h2>
                                <div className={styles.resultDetails}>
                                    <p><strong>{result.details.name}</strong></p>
                                    <p>{result.details.category}</p>
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
                            CONTINUER
                        </button>
                    </div>
                )}
            </div>

            {isCameraActive && (
                <button className={styles.stopBtn} onClick={stopScanner}>
                    Arrêter la caméra
                </button>
            )}

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statVal}>{stats.checkedIn}</span>
                    <span className={styles.statLabel}>Présents</span>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statVal}>{stats.total}</span>
                    <span className={styles.statLabel}>Total</span>
                </div>
            </div>

            {recentScans.length > 0 && (
                <div className={styles.lastScans}>
                    <h2>Derniers passages</h2>
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
