import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generateCotisationInvoicePDF = async (ticket: any, event: any) => {
    if (!event || !ticket) return null;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a5" // Mini invoice format (A5: 148 x 210 mm)
    });

    const primaryColor: [number, number, number] = [10, 46, 115]; // Navy Blue #0A2E73
    const accentColor: [number, number, number] = [255, 90, 31];  // Orange #FF5A1F
    const lightBg: [number, number, number] = [248, 250, 252];

    // Header Background Strip
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 148, 28, "F");

    // Title / Brand Header
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ITA ARENA", 12, 14);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("REÇU DE COTISATION", 136, 14, { align: "right" });
    doc.setFontSize(8);
    const recNum = ticket.ticket_number ? `REC-${String(ticket.ticket_number).padStart(6, '0')}` : `REC-${(ticket.id || '000000').slice(0, 8).toUpperCase()}`;
    doc.text("FACTURE N° " + recNum, 136, 20, { align: "right" });

    let currentY = 36;

    // Organization / Event Box
    doc.setFillColor(...lightBg);
    doc.roundedRect(12, currentY, 124, 22, 3, 3, "F");
    
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const eventTitle = (event.title || "Cotisation").toUpperCase();
    const titleLines = doc.splitTextToSize(eventTitle, 118);
    doc.text(titleLines, 16, currentY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    const orgName = event.organizer?.name || event.organizer?.full_name || event.organizer_name || "Organisateur";
    doc.text(`Organisateur : ${orgName}`, 16, currentY + 16);

    currentY += 28;

    // Contributor & Payment Info Columns
    doc.setDrawColor(226, 232, 240);
    doc.line(12, currentY, 136, currentY);
    currentY += 6;

    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("INFORMATIONS DU COTISANT", 12, currentY);
    doc.text("DÉTAILS DU PAIEMENT", 80, currentY);

    currentY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);

    // Left column: Cotisant
    const payerName = ticket.user_name || ticket.user_email || "Cotisant anonyme";
    const payerEmail = ticket.user_email || "";
    const payerPhone = ticket.user_phone || ticket.payment_phone || "";
    
    doc.setFont("helvetica", "bold");
    const nameLines = doc.splitTextToSize(payerName, 62);
    doc.text(nameLines, 12, currentY);
    
    let leftOffset = currentY + (nameLines.length * 4.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    if (payerEmail) {
        doc.text(payerEmail, 12, leftOffset);
        leftOffset += 4.5;
    }
    if (payerPhone) {
        doc.text(`Tél : ${payerPhone}`, 12, leftOffset);
    }

    // Right column: Payment details
    const dateObj = ticket.created_at ? new Date(ticket.created_at) : new Date();
    const formattedDate = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const formattedTime = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");
    
    doc.setFontSize(8.5);
    doc.text(`Date : ${formattedDate} à ${formattedTime}`, 80, currentY);
    doc.text("Mode : Mobile Money / Carte", 80, currentY + 4.5);
    doc.setTextColor(16, 185, 129); // Green paid badge
    doc.setFont("helvetica", "bold");
    doc.text("Statut : RÉGLÉ (VALIDE)", 80, currentY + 9);

    currentY = Math.max(leftOffset + 6, currentY + 16);

    // AutoTable for Itemized Breakdown
    const categoryName = ticket.category || "Cotisation";
    const amountNum = Number(ticket.amount) || 0;
    const formattedAmount = `${new Intl.NumberFormat('fr-FR').format(amountNum)} F CFA`;

    autoTable(doc, {
        startY: currentY,
        margin: { left: 12, right: 12 },
        head: [['Désignation / Formule', 'Qté', 'Montant Versé']],
        body: [
            [categoryName, '1', formattedAmount]
        ],
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [15, 23, 42]
        },
        columnStyles: {
            0: { cellWidth: 70 },
            1: { cellWidth: 18, halign: 'center' },
            2: { cellWidth: 36, halign: 'right' }
        }
    });

    // Get table bottom Y
    const finalY = (doc as any).lastAutoTable.previous.finalY || currentY + 25;

    // Total Box
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(70, finalY + 4, 66, 14, 2, 2, "F");
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("TOTAL RÉGLÉ :", 74, finalY + 12);
    
    doc.setFontSize(11);
    doc.setTextColor(...accentColor);
    doc.text(formattedAmount, 132, finalY + 12, { align: "right" });

    // Footer
    const footerY = 195;
    doc.setDrawColor(226, 232, 240);
    doc.line(12, footerY, 136, footerY);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text("Merci pour votre généreuse contribution et votre soutien !", 74, footerY + 4, { align: "center" });
    doc.text("Ce reçu électronique fait foi de preuve de paiement officielle sur ITA Arena (itaarena.com)", 74, footerY + 8, { align: "center" });

    return doc;
};

export const downloadCotisationInvoice = async (ticket: any, event: any) => {
    const doc = await generateCotisationInvoicePDF(ticket, event);
    if (doc) {
        const invNo = ticket.ticket_number ? String(ticket.ticket_number).padStart(5, '0') : (ticket.id || '000000').slice(0, 6);
        doc.save(`Facture_Cotisation_${invNo}.pdf`);
    }
};
