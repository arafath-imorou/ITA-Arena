import jsPDF from "jspdf";
import QRCode from "qrcode";

export const getCategoryColor = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('vvip')) return { bg: [88, 28, 135], text: [255, 255, 255] }; // Purple
    if (c.includes('vip')) return { bg: [180, 83, 9], text: [255, 255, 255] }; // Amber/Gold
    if (c.includes('gratuit')) return { bg: [13, 148, 136], text: [255, 255, 255] }; // Teal
    if (c.includes('standard') || c.includes('regulier') || c.includes('régulier') || c.includes('grand public')) 
        return { bg: [30, 58, 138], text: [255, 255, 255] }; // Blue
    return { bg: [26, 26, 26], text: [255, 255, 255] }; // Default Dark
};

export const getOverlayedImage = async (url: string, width: number, height: number, overlayColor: number[]): Promise<string | null> => {
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
        format: [196, 80]
    });

    // Background Header (Left Strip)
    if (stripVisualBase64) {
        doc.addImage(stripVisualBase64, 'JPEG', 0, 0, 80, 80);
    } else {
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.rect(0, 0, 80, 80, 'F');
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
    const rawTitle = event.title.toUpperCase();
    const isLongTitle = rawTitle.length > 20;
    doc.setFontSize(isLongTitle ? 13 : 15);
    const mainTitleLines = doc.splitTextToSize(rawTitle, 58);
    doc.text(mainTitleLines, 85, 12);
    
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
    doc.text(dateStr, 85, 12 + titleOffset);

    // QR Code Section
    doc.addImage(qrDataUrl, 'PNG', 146, 25, 40, 40);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text("SCANNEZ À L'ENTRÉE", 168.5, 68, { align: "center" });

    // Category and Price
    doc.setTextColor(120, 120, 120); // Labels in grey
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("CATÉGORIE", 45, 42);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]); // Values in category color
    doc.setFont("helvetica", "bold");
    const catName = ticket.category.toUpperCase();
    
    // Set the font size BEFORE splitting so that jsPDF calculates using the correct metrics
    const isLongCat = catName.length > 12;
    doc.setFontSize(isLongCat ? 9 : 11);
    const catLines = doc.splitTextToSize(catName, 32); // Constrained to 32mm to never overlap with Price at 82mm
    doc.text(catLines, 85, 47);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('PRIX', 122, 42);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${Number(ticket.amount).toLocaleString()} F CFA`, 82, 47);

    // Buyer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text('ACHETEUR', 85, 60);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const buyerName = (ticket.user_name || ticket.user_email || "Client").toUpperCase();
    const buyerLines = doc.splitTextToSize(buyerName, 55);
    doc.text(buyerLines, 85, 65);

    // Dotted Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(141, 0, 141, 80);
    
    // Ticket Number
    doc.setTextColor(255, 90, 31); // Keep Orange for Ticket No as it's the brand color
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("TICKET N°", 168.5, 12, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`#${String(ticket.ticket_number || 0).padStart(5, '0')}`, 168.5, 19, { align: "center" });

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text("ITA Arena", 115, 75, { align: "center" });

    return doc;
};

export const downloadTicket = async (ticket: any, event: any) => {
    const doc = await generateTicketPDF(ticket, event);
    if (doc) {
        doc.save(`Ticket_ITA_${ticket.ticket_number}.pdf`);
    }
};


export const drawTicketOnDoc = async (doc: jsPDF, offsetX: number, offsetY: number, ticket: any, eventData: any, stripVisualBase64: string | null) => {
    const colors = getCategoryColor(ticket.category);
    
    // Background Header (Left Strip)
    if (stripVisualBase64) {
        doc.addImage(stripVisualBase64, 'JPEG', offsetX, offsetY, 80, 80);
    } else {
        doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.rect(offsetX, offsetY, 80, 80, 'F');
    }

    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize((eventData.title || "").toUpperCase(), 60);
    doc.text(titleLines, offsetX + 15, offsetY + 40, { angle: 90, align: "center" });

    // Main Content
    doc.setTextColor(255, 0, 0); // Event name in RED
    doc.setFont("helvetica", "bold");
    const rawTitle = (eventData.title || "").toUpperCase();
    const isLongTitle = rawTitle.length > 20;
    doc.setFontSize(isLongTitle ? 13 : 15);
    const mainTitleLines = doc.splitTextToSize(rawTitle, 58);
    doc.text(mainTitleLines, offsetX + 85, offsetY + 12);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80); // Softer grey for date
    
    let dateStr = "Date à préciser";
    if (eventData.date) {
        dateStr = eventData.date;
        if (eventData.time) {
            dateStr += ` à ${eventData.time}`;
        }
    } else if (eventData.created_at) {
        const d = new Date(eventData.created_at);
        dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    
    const titleOffset = Math.min(mainTitleLines.length * 6, 15);
    doc.text(dateStr, offsetX + 85, offsetY + 12 + titleOffset);

    // QR Code Section
    const qrDataUrl = await QRCode.toDataURL(ticket.qr_code_key || "invalid", {
        margin: 1,
        width: 400,
        color: { dark: '#1a1a1a', light: '#ffffff' }
    });
    doc.addImage(qrDataUrl, "PNG", offsetX + 146, offsetY + 25, 40, 40);
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.text("SCANNEZ A L'ENTREE", offsetX + 168.5, offsetY + 68, { align: "center" });

    // Category and Price
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("CATEGORIE", offsetX + 85, offsetY + 42);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFont("helvetica", "bold");
    const catName = (ticket.category || "Standard").toUpperCase();
    
    const isLongCat = catName.length > 12;
    doc.setFontSize(isLongCat ? 9 : 11);
    const catLines = doc.splitTextToSize(catName, 32); 
    doc.text(catLines, offsetX + 85, offsetY + 47);

    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PRIX", offsetX + 122, offsetY + 42);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${Number(ticket.amount || 0).toLocaleString()} F CFA`, offsetX + 122, offsetY + 47);

    // Buyer
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("ACHETEUR", offsetX + 85, offsetY + 60);
    
    doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const buyerName = (ticket.user_name || ticket.user_email || "Client").toUpperCase();
    const buyerLines = doc.splitTextToSize(buyerName, 55);
    doc.text(buyerLines, offsetX + 85, offsetY + 65);

    // Dotted Separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(offsetX + 141, offsetY + 0, offsetX + 141, offsetY + 80);
    
    // Ticket Number
    doc.setTextColor(255, 90, 31);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("TICKET N", offsetX + 168.5, offsetY + 12, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`#${String(ticket.ticket_number || 0).padStart(5, '0')}`, offsetX + 168.5, offsetY + 19, { align: "center" });

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(8);
    doc.text("ITA Arena", offsetX + 115, offsetY + 75, { align: "center" });
    
    // Draw standard border to cut out
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([0, 0], 0);
    doc.rect(offsetX, offsetY, 196, 80);
};

export const generateBulkTicketsPDF = async (tickets: any[], event: any) => {
    if (!tickets || tickets.length === 0 || !event) return null;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    let currentStripBase64: string | null = null;
    let currentCategoryStr: string | null = null;
    
    tickets.sort((a, b) => (a.ticket_number || 0) - (b.ticket_number || 0));
    const pageWidth = 210;
    const ticketW = 196;
    const ticketH = 80;
    const offsetX = (pageWidth - ticketW) / 2; // Center horizontally (25mm)
    const marginY = 15;
    const gapY = 10;
    
    for (let i = 0; i < tickets.length; i++) {
        if (i > 0 && i % 3 === 0) {
            doc.addPage();
        }
        
        const posOnPage = i % 3;
        const offsetY = marginY + (posOnPage * (ticketH + gapY));

        const currentTicket = tickets[i];
        
        if (currentCategoryStr !== currentTicket.category) {
            currentCategoryStr = currentTicket.category;
            const c = getCategoryColor(currentCategoryStr || '');
            currentStripBase64 = event.image_url ? await getOverlayedImage(event.image_url, 800, 800, c.bg) : null;
        }

        await drawTicketOnDoc(doc, offsetX, offsetY, currentTicket, event, currentStripBase64);
    }

    return doc;
};

export const downloadBulkTicketsPDF = async (tickets: any[], event: any) => {
    const doc = await generateBulkTicketsPDF(tickets, event);
    if (doc) {
        doc.save(`Tickets_Tous_${event.title.replace(/\s+/g, '_')}.pdf`);
    }
};
