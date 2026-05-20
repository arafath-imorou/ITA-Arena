import jsPDF from "jspdf";
import QRCode from "qrcode";

const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('vvip')) return { bg: [88, 28, 135], text: [255, 255, 255] }; // Purple
    if (c.includes('vip')) return { bg: [180, 83, 9], text: [255, 255, 255] }; // Amber/Gold
    if (c.includes('gratuit')) return { bg: [13, 148, 136], text: [255, 255, 255] }; // Teal
    if (c.includes('standard') || c.includes('regulier') || c.includes('régulier') || c.includes('grand public')) 
        return { bg: [30, 58, 138], text: [255, 255, 255] }; // Blue
    return { bg: [26, 26, 26], text: [255, 255, 255] }; // Default Dark
};

const getOverlayedImage = async (url: string, width: number, height: number, overlayColor: number[]): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    try {
        return await new Promise((resolve, reject) => {
            const img = new Image();
            img.setAttribute("crossOrigin", "anonymous");
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (!ctx) return reject();
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, width, height);
                const imgRatio = img.width / img.height;
                const targetRatio = width / height;
                let drawW, drawH, x, y;
                if (imgRatio > targetRatio) {
                    drawH = height; drawW = height * imgRatio;
                    x = (width - drawW) / 2; y = 0;
                } else {
                    drawW = width; drawH = width / imgRatio;
                    x = 0; y = (height - drawH) / 2;
                }
                ctx.drawImage(img, x, y, drawW, drawH);
                ctx.fillStyle = `rgba(${overlayColor[0]}, ${overlayColor[1]}, ${overlayColor[2]}, 0.85)`;
                ctx.fillRect(0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.8));
            };
            img.onerror = () => reject();
            img.src = url;
        });
    } catch { return null; }
};

export const generateTicketPDF = async (ticket: any, event: any) => {
    if (!event || !ticket) return;

    const colors = getCategoryColor(ticket.category);

    // Prepare async parallel rendering tasks
    const [qrDataUrl, stripVisualBase64] = await Promise.all([
        QRCode.toDataURL(ticket.qr_code_key, {
            margin: 1,
            width: 400,
            color: {
                dark: '#1a1a1a',
                light: '#ffffff'
            }
        }),
        event.image_url ? getOverlayedImage(event.image_url, 400, 800, colors.bg) : Promise.resolve(null)
    ]);

    const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [160, 80]
    });

    // Background Header (Left Strip)
    if (stripVisualBase64) {
        doc.addImage(stripVisualBase64, "JPEG", 0, 0, 40, 80);
    } else {
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.rect(0, 0, 40, 80, "F");
    }

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
        } else {
            // Use the raw date string mentioned by the advertiser
            dateStr = event.date;
        }
        if (event.time) {
            dateStr += ` à ${event.time}`;
        }
    } else if (event.created_at) {
        // Fallback to created_at if date is missing (common for cotisations)
        const d = new Date(event.created_at);
        dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        if (event.time) {
            dateStr += ` à ${event.time}`;
        }
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
    doc.setFont("helvetica", "bold");
    const catName = ticket.category.toUpperCase();
    const catLines = doc.splitTextToSize(catName, 34);
    if (catLines.length > 1) {
        doc.setFontSize(9);
    } else {
        doc.setFontSize(11);
    }
    doc.text(catLines, 45, 47);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PRIX", 82, 42);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${Number(ticket.amount).toLocaleString()} F CFA`, 82, 47);

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
