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

        const doc = jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: [150, 90] // Horizontal format
        });

        // Background Header
        doc.setFillColor(26, 26, 26);
        doc.rect(0, 0, 150, 25, "F");

        // Event Title (Centered in Header)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(event.title.toUpperCase(), 75, 12, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const eventDateStr = new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        doc.text(eventDateStr, 75, 18, { align: "center" });

        // Left Side: QR Code
        doc.addImage(qrDataUrl, "PNG", 10, 35, 45, 45);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text("SCANNEZ À L'ENTRÉE", 32.5, 83, { align: "center" });

        // Right Side: Ticket Details
        doc.setTextColor(51, 51, 51);
        
        // Category
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("CATÉGORIE", 65, 40);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(ticket.category, 65, 46);

        // Price
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("PRIX", 65, 58);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`${ticket.amount.toLocaleString()} F CFA`, 65, 64);

        // Buyer
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("ACHETEUR", 65, 76);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(ticket.user_email, 65, 82);

        // Vertical Divider (Stub)
        doc.setDrawColor(220, 220, 220);
        doc.setLineDashPattern([2, 1], 0);
        doc.line(115, 25, 115, 90);

        // Ticket Number (On the stub)
        doc.setTextColor(255, 90, 31); // Brand Orange
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("N° TICKET", 132.5, 45, { align: "center" });
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`#${ticket.ticket_number.toString().padStart(5, '0')}`, 132.5, 55, { align: "center" });

        // Branding
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(8);
        doc.text("ITA ARENA", 132.5, 80, { align: "center" });

        doc.save(`Ticket_ITA_${ticket.ticket_number}.pdf`);
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
