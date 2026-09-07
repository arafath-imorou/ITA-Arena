"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

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

    const drawTicket = async (doc: jsPDF, x: number, y: number, width: number, height: number, ticket: any, eventData: any, bgBase64: string | null) => {
        // Draw border
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, y, width, height);

        // Draw background image on the top half (or top 45%)
        const imgHeight = height * 0.45;
        if (bgBase64) {
            try {
                doc.addImage(bgBase64, 'JPEG', x, y, width, imgHeight);
            } catch (e) {
                doc.setFillColor(240, 240, 240);
                doc.rect(x, y, width, imgHeight, 'F');
            }
        } else {
            doc.setFillColor(240, 240, 240);
            doc.rect(x, y, width, imgHeight, 'F');
        }
        
        let currentY = y + imgHeight + 8;
        
        // Title
        doc.setTextColor(30, 30, 30);
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        const titleLines = doc.splitTextToSize(eventData.title.toUpperCase(), width - 10);
        doc.text(titleLines, x + width/2, currentY, { align: "center" });
        
        currentY += (titleLines.length * 5.5) + 4;

        // Details (Date, Location, Organizer)
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(80, 80, 80);
        doc.text(`Date: ${eventData.date}`, x + 10, currentY);
        currentY += 5;
        doc.text(`Lieu: ${eventData.location}`, x + 10, currentY);
        currentY += 5;
        doc.text(`Org: ${eventData.organizer}`, x + 10, currentY);

        // Category & Price
        currentY += 9;
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(247, 147, 30); // Orange ITA Arena
        doc.text(`${ticket.category.toUpperCase()} - ${Number(ticket.price).toLocaleString()} F CFA`, x + width/2, currentY, { align: "center" });

        // QR Code
        const qrDataUrl = await QRCode.toDataURL(ticket.qr_code_key, { margin: 1, width: 150 });
        const qrSize = 32;
        const qrX = x + (width - qrSize) / 2;
        const qrY = currentY + 4;
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);

        // Ticket ID / Serial
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 150, 150);
        doc.text(`ID: ${ticket.qr_code_key}`, x + width/2, qrY + qrSize + 4, { align: "center" });
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
                    time: "00:00",
                    image_url: formData.image_url,
                    type: 'event',
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
                        price: cat.price,
                        amount: cat.price,
                        user_name: "Achat Physique",
                        qr_code_key: `PHY-${newEvent.id.substring(0,6).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                        status: 'valid'
                    });
                }
            }

            const { data: insertedTickets, error: ticketsError } = await supabase
                .from('tickets')
                .insert(ticketsToInsert)
                .select();

            if (ticketsError) throw ticketsError;

            // PDF Generation
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const bgBase64 = formData.image_url ? await getBase64Image(formData.image_url) : null;
            
            const pageWidth = 210;
            const pageHeight = 297;
            const cols = 2;
            const rows = 2;
            const ticketW = pageWidth / cols;
            const ticketH = pageHeight / rows;

            for (let i = 0; i < insertedTickets.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    doc.addPage();
                }
                
                const posOnPage = i % 4;
                const col = posOnPage % 2; // 0 or 1
                const row = Math.floor(posOnPage / 2); // 0 or 1
                
                const x = col * ticketW;
                const y = row * ticketH;

                await drawTicket(doc, x, y, ticketW, ticketH, insertedTickets[i], formData, bgBase64);
            }

            doc.save(`Tickets_Physiques_${formData.title.replace(/\s+/g, '_')}.pdf`);
            
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
                            <input type="text" required placeholder="Ex: 25 Déc. 2026 à 20h" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ccc' }}
                                value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
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
