"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./Confirmation.module.css";
import Link from "next/link";
import { downloadTicket } from "@/lib/ticketUtils";
import QRCode from "qrcode";

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session");
    const eventId = searchParams.get("event");
    const [tickets, setTickets] = useState<any[]>([]);
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (!sessionId) {
            router.push("/");
            return;
        }

        async function fetchData() {
            setLoading(true);
            try {
                // 1. Fetch all tickets for this session
                const { data: ticketsData, error: ticketsError } = await supabase
                    .from('tickets')
                    .select('*')
                    .eq('checkout_session_id', sessionId);

                if (ticketsError) throw ticketsError;
                setTickets(ticketsData || []);

                // Generate QR codes for UI
                const codes: { [key: string]: string } = {};
                for (const t of (ticketsData || [])) {
                    codes[t.id] = await QRCode.toDataURL(t.qr_code_key);
                }
                setQrCodes(codes);

                // 2. Fetch event
                const idToUse = eventId || (ticketsData && ticketsData[0]?.event_id);
                if (idToUse) {
                    const { data: eventData, error: eventError } = await supabase
                        .from('events')
                        .select('*')
                        .eq('id', idToUse)
                        .single();

                    if (eventError) throw eventError;
                    setEvent(eventData);
                }

            } catch (err) {
                console.error("Error fetching multi-ticket data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [sessionId, eventId, router]);

    const downloadSingleTicket = async (ticket: any) => {
        await downloadTicket(ticket, event);
    };

    const downloadAllTickets = async () => {
        for (const ticket of tickets) {
            await downloadSingleTicket(ticket);
            // Small delay to avoid browser blocking multiple downloads
            await new Promise(r => setTimeout(r, 500));
        }
    };

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement de vos tickets...</p>
        </div>
    );

    if (tickets.length === 0 || !event) return (
        <div className={styles.loadingContainer}>
            <p>Aucun ticket trouvé pour cette session.</p>
            <Link href="/" className={styles.homeBtn}>Retour à l'accueil</Link>
        </div>
    );

    const buyerName = tickets[0]?.user_name || "Client";
    const totalPaid = tickets.reduce((acc, t) => acc + Number(t.amount), 0);

    return (
        <div className={styles.confirmationWrapper}>
            <div className={styles.successHeader}>
                <div className={styles.checkIcon}>✓</div>
                <h1>Paiement Réussi !</h1>
                <p>Vos tickets sont prêts. Vous pouvez les télécharger ou les présenter à l'entrée.</p>
            </div>

            <div className={styles.receiptCard}>
                <div className={styles.receiptHeader}>
                    <div className={styles.receiptInfo}>
                        <h2>Reçu de paiement</h2>
                        <div className={styles.buyerDetails}>
                            <span>👤 {buyerName}</span>
                            <span>📧 {tickets[0]?.user_email}</span>
                        </div>
                    </div>
                    <div className={styles.totalAmountBox}>
                        <span>Total Payé</span>
                        <strong>{totalPaid.toLocaleString()} F CFA</strong>
                    </div>
                </div>
            </div>

            <div className={styles.ticketsGrid}>
                {tickets.map((t, index) => (
                    <div key={t.id} className={styles.ticketCardPremium}>
                        <div 
                            className={styles.ticketTop}
                            style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'})` }}
                        >
                            <div className={styles.ticketCategory}>{t.category}</div>
                            <div className={styles.ticketEventName}>{event.title}</div>
                        </div>
                        
                        <div className={styles.ticketDivider}></div>

                        <div className={styles.ticketBottom}>
                            <div className={styles.ticketInfo}>
                                <div className={styles.ticketInfoGroup} style={{ marginBottom: '10px' }}>
                                    <span>N° TICKET</span>
                                    <strong>#{t.ticket_number.toString().padStart(5, '0')}</strong>
                                </div>
                                <div className={styles.ticketInfoGroup}>
                                    <span>PRIX</span>
                                    <strong>{t.amount.toLocaleString()} F CFA</strong>
                                </div>
                            </div>
                            
                            <div className={styles.ticketQRContainer}>
                                {qrCodes[t.id] && <img src={qrCodes[t.id]} alt="QR Code" />}
                            </div>
                        </div>

                        <button className={styles.downloadBtnSmall} onClick={() => downloadSingleTicket(t)}>
                            📥 Télécharger PDF
                        </button>
                    </div>
                ))}
            </div>

            <div className={styles.footerActions}>
                <button className={styles.downloadAllBtn} onClick={downloadAllTickets}>
                    📥 Télécharger tous les tickets ({tickets.length})
                </button>
                <Link href="/" className={styles.homeBtn}>Retour à l'accueil</Link>
            </div>
        </div>
    );
}

export default function ConfirmationPage() {
    return (
        <Suspense fallback={<div className={styles.loadingContainer}><div className={styles.spinner}></div></div>}>
            <ConfirmationContent />
        </Suspense>
    );
}
