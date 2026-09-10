"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "@/lib/supabase";
import styles from "./Scan.module.css";
import BackButton from "@/components/BackButton";
import { useSearchParams } from "next/navigation";

function ScannerContent() {
    const searchParams = useSearchParams();
    const forcedEventId = searchParams.get('eventId');

    const [events, setEvents] = useState<any[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string>("");
    const [result, setResult] = useState<{ type: 'success' | 'error', message: string, details?: any } | null>(null);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, checkedIn: 0 });
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string>("");
    
    const selectedEventIdRef = useRef<string>("");
    const html5QrCode = useRef<Html5Qrcode | null>(null);
    const isProcessingRef = useRef<boolean>(false);
    const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        async function fetchEvents() {
            const { data } = await supabase.from('events').select('id, title').order('date', { ascending: false });
            if (data) {
                setEvents(data);
                if (forcedEventId && data.find(e => e.id === forcedEventId)) {
                    setSelectedEventId(forcedEventId);
                    selectedEventIdRef.current = forcedEventId;
                } else if (data.length > 0) {
                    setSelectedEventId(data[0].id);
                    selectedEventIdRef.current = data[0].id;
                }
            }
        }
        fetchEvents();

        return () => {
            if (html5QrCode.current && html5QrCode.current.isScanning) {
                html5QrCode.current.stop();
            }
            if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        };
    }, [forcedEventId]);

    const handleEventChange = (id: string) => {
        if (forcedEventId) return; // Locked
        setSelectedEventId(id);
        selectedEventIdRef.current = id;
        fetchStats(id);
    };

    useEffect(() => {
        if (!selectedEventId) return;
        fetchStats(selectedEventId);
    }, [selectedEventId]);

    async function fetchStats(eventId: string) {
        const { data: tickets } = await supabase
            .from('tickets')
            .select('status')
            .eq('event_id', eventId);
        
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

            const config = { 
                fps: 20, 
                qrbox: { width: 300, height: 300 },
                aspectRatio: 1.0
            };
            
            await html5QrCode.current.start(
                { facingMode: "environment" }, 
                config, 
                onScanSuccess,
                onScanFailure
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

    const clearResult = () => {
        setResult(null);
        isProcessingRef.current = false;
        if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
        
        // Ensure scanner is actively looking for the next code
        if (html5QrCode.current && html5QrCode.current.isScanning && html5QrCode.current.getState() === 3 /* PAUSED */) {
            try { html5QrCode.current.resume(); } catch(e) {}
        }
    };

    async function onScanSuccess(decodedText: string) {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        
        // Try to pause scanner to prevent duplicate scans
        if (html5QrCode.current && html5QrCode.current.isScanning) {
            try { html5QrCode.current.pause(); } catch(e) {}
        }

        const currentEventId = selectedEventIdRef.current;
        
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

        const showResult = (data: any) => {
            setResult(data);
            // Auto close after 3 seconds to scan another one
            if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
            resultTimeoutRef.current = setTimeout(() => {
                clearResult();
            }, 3000);
        };

        if (error || !ticket) {
            showResult({ type: 'error', message: "Ticket invalide ou inconnu." });
            return;
        }

        if (ticket.event_id !== currentEventId) {
            showResult({ 
                type: 'error', 
                message: "Mauvais événement !", 
                details: { info: `Appartient à : ${ticket.event?.title}` } 
            });
            return;
        }

        if (ticket.status === 'checked-in') {
            showResult({ 
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
            showResult({ type: 'error', message: "Erreur de validation base de données." });
            return;
        }

        showResult({ 
            type: 'success', 
            message: "Entrée Validée !", 
            details: { 
                name: ticket.user_name || "Ticket Physique", 
                category: ticket.category,
                eventName: ticket.event?.title,
                number: ticket.ticket_number
            } 
        });

        setStats(prev => ({ ...prev, checkedIn: prev.checkedIn + 1 }));
        setRecentScans(prev => [{
            name: ticket.ticket_number ? `#${String(ticket.ticket_number).padStart(5, '0')}` : ticket.user_name,
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
                
                {forcedEventId ? (
                    <div className={styles.eventSelector} style={{ opacity: 0.8, pointerEvents: 'none', background: '#e2e8f0', textAlign: 'center' }}>
                        {events.find(e => e.id === forcedEventId)?.title || "Chargement de l'événement..."}
                    </div>
                ) : (
                    <select 
                        className={styles.eventSelector}
                        value={selectedEventId}
                        onChange={(e) => handleEventChange(e.target.value)}
                    >
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                        ))}
                    </select>
                )}
            </div>

            <div className={styles.scannerWrapper}>
                <div id="reader" style={{ width: '100%', height: '100%' }}></div>
                
                {!isCameraActive && !result && (
                    <div className={styles.cameraPlaceholder}>
                        <button className={styles.startBtn} onClick={startScanner}>
                            📸 ACTIVER LA CAMÉRA
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
                                <div className={styles.resultDetails} style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
                                    {result.details.eventName && <p><strong>Événement :</strong> {result.details.eventName}</p>}
                                    <p><strong>Catégorie :</strong> {result.details.category}</p>
                                    {result.details.number && <p><strong>Ticket :</strong> #{String(result.details.number).padStart(5, '0')}</p>}
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
                        <button className={styles.closeBtn} onClick={clearResult} style={{ marginTop: '2rem' }}>
                            SCANNER LE SUIVANT
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
                    <span className={styles.statLabel}>En salle</span>
                </div>
                <div className={styles.statCard} style={{ background: '#fef3c7', color: '#92400e' }}>
                    <span className={styles.statVal}>{Math.max(0, stats.total - stats.checkedIn)}</span>
                    <span className={styles.statLabel}>Restants</span>
                </div>
                <div className={styles.statCard} style={{ background: '#f1f5f9', color: '#475569' }}>
                    <span className={styles.statVal}>{stats.total}</span>
                    <span className={styles.statLabel}>Total tickets</span>
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

export default function ScanPage() {
    return (
        <Suspense fallback={<div style={{textAlign: 'center', padding: '2rem'}}>Chargement du scanner...</div>}>
            <ScannerContent />
        </Suspense>
    );
}
