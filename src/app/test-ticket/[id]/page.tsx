"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { use } from "react";
import styles from "./TestTicket.module.css";
import QRCode from "qrcode";

export default function TestTicketPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [ticket, setTicket] = useState<any>(null);
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [qrDataUrl, setQrDataUrl] = useState<string>("");

    useEffect(() => {
        async function fetchData() {
            const { data: ticketData } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', id)
                .single();

            if (ticketData) {
                setTicket(ticketData);
                const { data: eventData } = await supabase
                    .from('events')
                    .select('*')
                    .eq('id', ticketData.event_id)
                    .single();
                setEvent(eventData);

                // Generate real QR
                if (ticketData.qr_code_key) {
                    const qr = await QRCode.toDataURL(`🎫 ITA ARENA - TICKET VALIDE\n--------------------------\nÉVÉNEMENT : ${eventData?.title.toUpperCase()}\nCATÉGORIE : ${ticketData.category.toUpperCase()}\nN° TICKET : ${String(ticketData.ticket_number).padStart(5, '0')}\nACHETEUR  : ${ticketData.user_name?.toUpperCase()}\n--------------------------\nCLÉ RÉF : ${ticketData.qr_code_key}`);
                    setQrDataUrl(qr);
                }
            }
            setLoading(false);
        }
        fetchData();
    }, [id]);

    if (loading) return <div className={styles.loading}>Génération du ticket...</div>;
    if (!ticket) return <div className={styles.error}>Ticket introuvable.</div>;

    const getColors = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('vvip')) return { bg: '#581C87', text: '#fff' };
        if (c.includes('vip')) return { bg: '#B45309', text: '#fff' };
        if (c.includes('gratuit')) return { bg: '#0D9488', text: '#fff' };
        if (c.includes('standard') || c.includes('regulier') || c.includes('régulier') || c.includes('grand public')) 
            return { bg: '#1E3A8A', text: '#fff' };
        return { bg: '#1A1A1A', text: '#fff' };
    };

    const colors = getColors(ticket.category);

    // Robust date parsing for the test page
    let dateStr = "Date à préciser";
    const dateToParse = event?.date || event?.created_at;
    if (dateToParse) {
        const d = new Date(dateToParse);
        if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.ticket}>
                <div className={styles.leftStrip} style={{ backgroundColor: colors.bg }}>
                    <div className={styles.verticalTitle}>{event.title}</div>
                </div>
                <div className={styles.mainContent}>
                    <div className={styles.header}>
                        <div className={styles.titleArea}>
                            <h1 style={{ color: colors.bg }}>{event.title}</h1>
                            <p className={styles.date}>{dateStr}</p>
                        </div>
                        <div className={styles.ticketNo}>
                            <span className={styles.noLabel}>TICKET N°</span>
                            <span className={styles.noVal}>#{String(ticket.ticket_number).padStart(5, '0')}</span>
                        </div>
                    </div>

                    <div className={styles.detailsGrid}>
                        <div className={styles.detailItem}>
                            <label>CATÉGORIE</label>
                            <span style={{ color: colors.bg }}>{ticket.category}</span>
                        </div>
                        <div className={styles.detailItem}>
                            <label>PRIX</label>
                            <span style={{ color: colors.bg }}>{Number(ticket.amount).toLocaleString()} F CFA</span>
                        </div>
                        <div className={styles.detailItem} style={{ gridColumn: 'span 2' }}>
                            <label>ACHETEUR</label>
                            <span style={{ color: colors.bg }}>{ticket.user_name?.toUpperCase()}</span>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <span className={styles.brand}>ITA Arena</span>
                    </div>
                </div>
                <div className={styles.qrSection}>
                    <div className={styles.qrPlaceholder}>
                        {qrDataUrl ? (
                            <img src={qrDataUrl} alt="QR Code" className={styles.qrImg} />
                        ) : (
                            <div className={styles.qrBox}></div>
                        )}
                        <span>SCANNEZ À L'ENTRÉE</span>
                    </div>
                </div>
            </div>
            
            <div className={styles.instructions}>
                <p>Ceci est une prévisualisation fidèle du ticket PDF généré.</p>
                <div className={styles.btnGroup}>
                    <button onClick={() => window.location.href = '/'} className={styles.homeBtn}>Retour à l'accueil</button>
                    <button onClick={() => window.print()} className={styles.printBtn}>Imprimer le ticket</button>
                </div>
            </div>
        </div>
    );
}
