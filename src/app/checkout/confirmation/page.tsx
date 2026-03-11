"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "./Confirmation.module.css";
import Link from "next/link";
import jsPDF from "jspdf";
import QRCode from "qrcode";

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const ticketId = searchParams.get("id");
    const [ticket, setTicket] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!ticketId) {
            router.push("/");
            return;
        }

        async function fetchTicketData() {
            setLoading(true);
            try {
                // Fetch ticket
                const { data: ticketData, error: ticketError } = await supabase
                    .from('tickets')
                    .select('*')
                    .eq('id', ticketId)
                    .single();

                if (ticketError) throw ticketError;
                setTicket(ticketData);

                // Fetch event
                const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', ticketData.event_id)
                    .single();

                if (eventError) throw eventError;
                setEvent(eventData);

                // Generate QR Code
                const qrUrl = await QRCode.toDataURL(ticketData.qr_code_key, {
                    width: 400,
                    margin: 2,
                    color: {
                        dark: "#1a1a1a",
                        light: "#ffffff"
                    }
                });
                setQrDataUrl(qrUrl);

            } catch (err) {
                console.error("Error fetching confirmation data:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchTicketData();
    }, [ticketId, router]);

    const downloadPDF = () => {
        if (!ticket || !event || !qrDataUrl) return;

        const doc = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: [160, 80] // Horizontal format
        });

        // 1. Background Header (Left Strip)
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 0, 40, 80, "F");

        // Vertical Event Title (on the left strip)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(event.title.toUpperCase(), 60);
        // Rotate text for the vertical strip
        doc.text(titleLines, 15, 40, { angle: 90, align: "center" });

        // 2. Main Ticket Body (White)
        doc.setTextColor(51, 51, 51);
        
        // Event Info Main
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(event.title.toUpperCase(), 45, 15);
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const dateStr = new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(dateStr, 45, 22);

        // 3. Middle Section: Details & QR
        
        // QR Code
        doc.addImage(qrDataUrl, "PNG", 110, 25, 40, 40);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text("SCANNEZ À L'ENTRÉE", 130, 68, { align: "center" });

        // Details
        doc.setTextColor(51, 51, 51);
        doc.setFontSize(8);
        doc.text("CATÉGORIE", 45, 40);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(ticket.category, 45, 46);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("PRIX", 75, 40);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${ticket.amount.toLocaleString()} F CFA`, 75, 46);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("ACHETEUR", 45, 58);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(ticket.user_email, 45, 63);

        // 4. Stub (Right Side)
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(105, 0, 105, 80);
        
        doc.setTextColor(255, 90, 31); // Brand Orange
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("TICKET N°", 130, 15, { align: "center" });
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`#${ticket.ticket_number.toString().padStart(5, '0')}`, 130, 22, { align: "center" });

        // Logo/Brand
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(8);
        doc.text("ITA ARENA", 75, 75, { align: "center" });

        doc.save(`Ticket_ITA_Landscape_${ticket.ticket_number}.pdf`);
    };

    if (loading) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement de votre ticket...</p>
        </div>
    );

    if (!ticket || !event) return (
        <div className={styles.loadingContainer}>
            <p>Ticket introuvable.</p>
            <Link href="/" className={styles.homeBtn}>Retour à l'accueil</Link>
        </div>
    );

    return (
        <div className={styles.confirmationWrapper}>
            <div className={styles.successHeader}>
                <div className={styles.checkIcon}>✓</div>
                <h1>Paiement Réussi !</h1>
                <p>Merci pour votre achat. Votre ticket est prêt.</p>
            </div>

            <div className={styles.ticketCard}>
                <div className={styles.ticketHeader}>
                    <div className={styles.eventTitle}>{event.title}</div>
                    <div className={styles.eventDate}>
                        {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <div className={styles.ticketBody}>
                    <div className={styles.qrContainer}>
                        {qrDataUrl && <img src={qrDataUrl} alt="QR Code Ticket" className={styles.qrImage} />}
                    </div>

                    <div className={styles.ticketInfo}>
                        <div>
                            <div className={styles.infoLabel}>Catégorie</div>
                            <div className={styles.infoValue}>{ticket.category}</div>
                        </div>
                        <div>
                            <div className={styles.infoLabel}>Montant</div>
                            <div className={styles.infoValue}>{ticket.amount.toLocaleString()} F CFA</div>
                        </div>
                        <div>
                            <div className={styles.infoLabel}>E-mail</div>
                            <div className={styles.infoValue}>{ticket.user_email}</div>
                        </div>
                        <div>
                            <div className={styles.infoLabel}>Numéro Ticket</div>
                            <div className={styles.ticketNumber}>#{ticket.ticket_number.toString().padStart(5, '0')}</div>
                        </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: '#888' }}>
                        Un exemplaire de ce ticket a été envoyé à votre adresse email.
                    </p>
                </div>

                <div className={styles.ticketFooter}>
                    <img src="/logo.png" alt="ITA ARENA" style={{ height: '30px', opacity: 0.5 }} />
                </div>
            </div>

            <div className={styles.actionButtons}>
                <button className={styles.downloadBtn} onClick={downloadPDF}>
                    📥 Télécharger le Ticket (PDF)
                </button>
                <Link href="/" className={styles.homeBtn}>Accueil</Link>
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
