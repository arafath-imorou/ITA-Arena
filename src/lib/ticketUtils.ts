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

    const getCategoryColor = (cat: string) => {
        const c = cat.toLowerCase();
        if (c.includes('vvip')) return { bg: [88, 28, 135], text: [255, 255, 255] }; // Purple
        if (c.includes('vip')) return { bg: [180, 83, 9], text: [255, 255, 255] }; // Amber/Gold
        if (c.includes('gratuit')) return { bg: [13, 148, 136], text: [255, 255, 255] }; // Teal
        if (c.includes('standard') || c.includes('regulier') || c.includes('régulier') || c.includes('grand public')) 
            return { bg: [30, 58, 138], text: [255, 255, 255] }; // Blue
        return { bg: [26, 26, 26], text: [255, 255, 255] }; // Default Dark
    };

    const colors = getCategoryColor(ticket.category);

    // Background Header (Left Strip)
    doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.rect(0, 0, 40, 80, "F");

    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(event.title.toUpperCase(), 60);
    doc.text(titleLines, 15, 40, { angle: 90, align: "center" });

    // Main Content
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]); // Main accent color
    doc.setFont("helvetica", "bold");
    
    // Wrap Title to avoid overlap with Ticket No
    const mainTitleLines = doc.splitTextToSize(event.title.toUpperCase(), 60);
    doc.setFontSize(mainTitleLines.length > 2 ? 14 : 16); // Reduce size if too long
    doc.text(mainTitleLines, 45, 12);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80); // Softer grey for date
    
    // Robust date parsing
    let dateStr = "Date à préciser";
    if (event.date) {
        const d = new Date(event.date);
        if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            });
        }
    } else if (event.created_at) {
        // Fallback to created_at if date is missing (common for cotisations)
        const d = new Date(event.created_at);
        dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    const titleOffset = Math.min(mainTitleLines.length * 6, 15);
    doc.text(dateStr, 45, 12 + titleOffset);

    // QR Code Section
    doc.addImage(qrDataUrl, "PNG", 110, 25, 40, 40);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text("SCANNEZ À L'ENTRÉE", 130, 68, { align: "center" });

    // Category and Price
    doc.setTextColor(120, 120, 120); // Labels in grey
    doc.setFontSize(8);
    doc.text("CATÉGORIE", 45, 42);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]); // Values in category color
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(ticket.category, 45, 48);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PRIX", 75, 42);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${Number(ticket.amount).toLocaleString()} F CFA`, 75, 48);

    // Buyer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ACHETEUR", 45, 60);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const buyerName = (ticket.user_name || ticket.user_email || "Client").toUpperCase();
    const buyerLines = doc.splitTextToSize(buyerName, 55);
    doc.text(buyerLines, 45, 65);

    // Dotted Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(105, 0, 105, 80);
    
    // Ticket Number
    doc.setTextColor(255, 90, 31); // Keep Orange for Ticket No as it's the brand color
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("TICKET N°", 130, 12, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`#${String(ticket.ticket_number || 0).padStart(5, '0')}`, 130, 19, { align: "center" });

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
