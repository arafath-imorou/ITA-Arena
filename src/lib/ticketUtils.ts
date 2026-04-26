import jsPDF from "jspdf";
import QRCode from "qrcode";

export const generateTicketPDF = async (ticket: any, event: any) => {
    if (!event || !ticket) return;

    const qrDataUrl = await QRCode.toDataURL(ticket.qr_code_key);

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [160, 80]
    });

    // Background Header (Left Strip)
    doc.setFillColor(26, 26, 26);
    doc.rect(0, 0, 40, 80, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(event.title.toUpperCase(), 60);
    doc.text(titleLines, 15, 40, { angle: 90, align: "center" });

    doc.setTextColor(51, 51, 51);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(event.title.toUpperCase(), 45, 15);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    doc.text(dateStr, 45, 22);

    doc.addImage(qrDataUrl, "PNG", 110, 25, 40, 40);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text("SCANNEZ À L'ENTRÉE", 130, 68, { align: "center" });

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
    doc.text(ticket.user_name || ticket.user_email, 45, 63);

    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(105, 0, 105, 80);
    
    doc.setTextColor(255, 90, 31);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("TICKET N°", 130, 15, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`#${ticket.ticket_number.toString().padStart(5, '0')}`, 130, 22, { align: "center" });

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text("ITA Arena", 75, 75, { align: "center" });

    return doc;
};

export const downloadTicket = async (ticket: any, event: any) => {
    const doc = await generateTicketPDF(ticket, event);
    if (doc) {
        doc.save(`Ticket_ITA_${ticket.ticket_number}.pdf`);
    }
};
