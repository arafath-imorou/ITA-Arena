"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { getCategoryColor, getOverlayedImage, generateBulkTicketsPDF } from '@/lib/ticketUtils';

interface PhysicalTicketGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PhysicalTicketGenerator({ isOpen, onClose }: PhysicalTicketGeneratorProps) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        organizer: '',
        date: '',
        time: '',
        location: '',
        image_url: ''
    });

    const [categories, setCategories] = useState<{ name: string, price: string, quantity: number }[]>([
        { name: 'Standard', price: '5000', quantity: 10 }
    ]);

    if (!isOpen) return null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `physical_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `events/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);

            setFormData({ ...formData, image_url: publicUrl });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert("Erreur lors de l'envoi de l'image : " + (error.message || "Erreur inconnue"));
        } finally {
            setUploading(false);
        }
    };

    const addCategory = () => {
        setCategories([...categories, { name: '', price: '', quantity: 1 }]);
    };

    const updateCategory = (index: number, field: string, value: any) => {
        const newCats = [...categories];
        newCats[index] = { ...newCats[index] as any, [field]: value };
        setCategories(newCats);
    };

    const removeCategory = (index: number) => {
        setCategories(categories.filter((_, i) => i !== index));
    };

    const drawTicket = async (doc: jsPDF, offsetX: number, offsetY: number, ticket: any, eventData: any, stripVisualBase64: string | null) => {
        const colors = getCategoryColor(ticket.category);
        
        // Background Header (Left Strip)
        if (stripVisualBase64) {
            doc.addImage(stripVisualBase64, "JPEG", offsetX, offsetY, 40, 80);
        } else {
            doc.setFillColor(colors.bg[0], colors.bg[1], colors.bg[2]);
            doc.rect(offsetX, offsetY, 40, 80, "F");
        }

        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(eventData.title.toUpperCase(), 60);
        doc.text(titleLines, offsetX + 15, offsetY + 40, { angle: 90, align: "center" });

        // Main Content
        doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]); // Main accent color
        doc.setFont("helvetica", "bold");
        
        // Wrap Title to avoid overlap with Ticket No
        const rawTitle = eventData.title.toUpperCase();
        const isLongTitle = rawTitle.length > 20;
        doc.setFontSize(isLongTitle ? 13 : 15);
        const mainTitleLines = doc.splitTextToSize(rawTitle, 58);
        doc.text(mainTitleLines, offsetX + 45, offsetY + 12);
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80); // Softer grey for date
        
        let dateStr = "Date à préciser";
        if (eventData.date) {
            dateStr = eventData.date;
            if (eventData.time) {
                dateStr += ` à ${eventData.time}`;
            }
        }
        
        const titleOffset = Math.min(mainTitleLines.length * 6, 15);
        doc.text(dateStr, offsetX + 45, offsetY + 12 + titleOffset);

        // QR Code Section
        const qrDataUrl = await QRCode.toDataURL(ticket.qr_code_key, {
            margin: 1,
            width: 400,
            color: { dark: '#1a1a1a', light: '#ffffff' }
        });
        doc.addImage(qrDataUrl, "PNG", offsetX + 110, offsetY + 25, 40, 40);
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text("SCANNEZ A L'ENTREE", offsetX + 130, offsetY + 68, { align: "center" });

        // Category and Price
        doc.setTextColor(120, 120, 120); // Labels in grey
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("CATEGORIE", offsetX + 45, offsetY + 42);
        
        doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]); // Values in category color
        doc.setFont("helvetica", "bold");
        const catName = ticket.category.toUpperCase();
        
        const isLongCat = catName.length > 12;
        doc.setFontSize(isLongCat ? 9 : 11);
        const catLines = doc.splitTextToSize(catName, 32); 
        doc.text(catLines, offsetX + 45, offsetY + 47);

        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("PRIX", offsetX + 82, offsetY + 42);
        
        doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`${Number(ticket.amount).toLocaleString()} F CFA`, offsetX + 82, offsetY + 47);

        // Buyer
        doc.setTextColor(120, 120, 120);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("ACHETEUR", offsetX + 45, offsetY + 60);
        
        doc.setTextColor(colors.bg[0], colors.bg[1], colors.bg[2]);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const buyerName = (ticket.user_name || ticket.user_email || "Client").toUpperCase();
        const buyerLines = doc.splitTextToSize(buyerName, 55);
        doc.text(buyerLines, offsetX + 45, offsetY + 65);

        // Dotted Separator
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(offsetX + 105, offsetY + 0, offsetX + 105, offsetY + 80);
        
        // Ticket Number
        doc.setTextColor(255, 90, 31); // Keep Orange for Ticket No as it's the brand color
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("TICKET N", offsetX + 130, offsetY + 12, { align: "center" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`#${String(ticket.ticket_number || 0).padStart(5, '0')}`, offsetX + 130, offsetY + 19, { align: "center" });

        doc.setTextColor(200, 200, 200);
        doc.setFontSize(8);
        doc.text("ITA Arena", offsetX + 75, offsetY + 75, { align: "center" });
        
        // Draw standard border to cut out
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([0, 0], 0); // solid border
        doc.rect(offsetX, offsetY, 160, 80);
    };

    const getBase64Image = async (url: string): Promise<string | null> => {
        if (!url) return null;
        try {
            return await new Promise((resolve) => {
                const img = new Image();
                img.setAttribute("crossOrigin", "anonymous");
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext("2d");
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL("image/jpeg", 0.7));
                    } else {
                        resolve(null);
                    }
                };
                img.onerror = () => resolve(null);
                img.src = url;
            });
        } catch { return null; }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Get current user ID to satisfy RLS
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            if (!userId) {
                throw new Error("Vous devez être connecté pour générer des tickets.");
            }

            const { data: newEvent, error: eventError } = await supabase
                .from('events')
                .insert({
                    title: formData.title,
                    description: `Event physique généré par ${formData.organizer}`,
                    location: formData.location,
                    date: formData.date,
                    time: formData.time,
                    image_url: formData.image_url,
                    type: 'event',
                    category_id: 'physical_event',
                    organizer_id: userId, // Required for Row-Level Security
                    is_published: false,
                    status: 'active'
                })
                .select()
                .single();

            if (eventError) throw eventError;

            const ticketsToInsert = [];
            for (const cat of categories) {
                for (let i = 0; i < cat.quantity; i++) {
                    ticketsToInsert.push({
                        event_id: newEvent.id,
                        category: cat.name,
                        amount: cat.price,
                        user_name: "Achat Physique",
                        user_email: "physique@itaarena.com",
                        user_phone: "N/A",
                        payment_phone: "N/A",
                        checkout_session_id: uuidv4(),
                        qr_code_key: `PHY-${newEvent.id.substring(0,6).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        status: 'valid'
                    });
                }
            }

            // Chunk inserts because PostgREST limits bulk insert to 1000 rows
            const CHUNK_SIZE = 500;
            let insertedTickets: any[] = [];
            
            for (let i = 0; i < ticketsToInsert.length; i += CHUNK_SIZE) {
                const chunk = ticketsToInsert.slice(i, i + CHUNK_SIZE);
                const { data: chunkInserted, error: chunkError } = await supabase
                    .from('tickets')
                    .insert(chunk)
                    .select();
                    
                if (chunkError) throw chunkError;
                if (chunkInserted) {
                    insertedTickets = insertedTickets.concat(chunkInserted);
                }
            }

            // PDF Generation using the unified utility (which already handles Red title, ordering, and width)
            
            const doc = await generateBulkTicketsPDF(insertedTickets, formData);
            if (doc) {
                doc.save(`Tickets_Physiques_${formData.title.replace(/\s+/g, '_')}.pdf`);
            }
            
            alert(`${insertedTickets.length} tickets générés avec succès !`);
            onClose();

        } catch (error: any) {
            console.error(error);
            alert("Erreur lors de la génération: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
            backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, 
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
        }}>
            <div style={{
                background: 'white', borderRadius: '12px', padding: '2rem',
                width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#1a1a1a' }}>🎟️ Générer des tickets physiques</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
                </div>

                <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Nom de l'événement</label>
                            <input type="text" required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Organisateur</label>
                            <input type="text" required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                value={formData.organizer} onChange={e => setFormData({ ...formData, organizer: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Date et Heure</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input type="date" required style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                <input type="time" required style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Lieu</label>
                            <input type="text" required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Affiche de l'événement</label>
                        <input type="file" accept="image/*" onChange={handleFileSelect} disabled={uploading} 
                            style={{ width: '100%', padding: '0.5rem' }} />
                        {uploading && <p style={{ fontSize: '0.85rem', color: '#ff5a1f' }}>Téléchargement en cours...</p>}
                        {formData.image_url && <img src={formData.image_url} alt="Affiche" style={{ height: '80px', marginTop: '0.5rem', borderRadius: '8px' }} />}
                    </div>

                    <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Catégories de tickets</h3>
                        {categories.map((cat, index) => (
                            <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
                                <input type="text" placeholder="Catégorie (ex: VIP)" required
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                    value={cat.name} onChange={e => updateCategory(index, 'name', e.target.value)} />
                                <input type="number" placeholder="Prix (FCFA)" required
                                    style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                    value={cat.price} onChange={e => updateCategory(index, 'price', e.target.value)} />
                                <input type="number" placeholder="Quantité" required min="1"
                                    style={{ width: '100px', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                    value={cat.quantity} onChange={e => updateCategory(index, 'quantity', parseInt(e.target.value) || 1)} />
                                {categories.length > 1 && (
                                    <button type="button" onClick={() => removeCategory(index)} style={{ padding: '0.8rem', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addCategory} style={{ background: '#f1f5f9', color: '#334155', border: 'none', padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            + Ajouter une catégorie
                        </button>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <button type="button" onClick={onClose} style={{ padding: '1rem 2rem', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Annuler
                        </button>
                        <button type="submit" disabled={loading || uploading} style={{ padding: '1rem 2rem', background: '#ff5a1f', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {loading ? 'Génération en cours...' : 'Enregistrer & Générer le PDF'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
