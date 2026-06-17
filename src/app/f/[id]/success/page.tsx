"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import QRCode from "qrcode";

export default function FormSuccessPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const subId = searchParams?.get("sub");
    
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!subId) return;

        const fetchSubmission = async () => {
            try {
                const { data, error } = await supabase
                    .from("form_submissions")
                    .select("qr_code")
                    .eq("id", subId)
                    .single();

                if (error) throw error;

                if (data?.qr_code) {
                    const url = await QRCode.toDataURL(data.qr_code, {
                        width: 300,
                        margin: 2,
                        color: {
                            dark: '#0A2E73',
                            light: '#ffffff'
                        }
                    });
                    setQrDataUrl(url);
                }
            } catch (err) {
                console.error("Error fetching submission:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSubmission();
    }, [subId]);

    if (loading) {
        return <div style={{ textAlign: "center", padding: "4rem" }}>Génération de votre confirmation...</div>;
    }

    return (
        <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "4rem 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ maxWidth: "500px", width: "100%", backgroundColor: "#fff", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", textAlign: "center", padding: "3rem" }}>
                <div style={{ width: "80px", height: "80px", backgroundColor: "#d1fae5", color: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.5rem", margin: "0 auto 1.5rem" }}>
                    ✓
                </div>
                
                <h1 style={{ color: "#0A2E73", fontSize: "1.8rem", marginBottom: "1rem" }}>Inscription Confirmée !</h1>
                <p style={{ color: "#666", marginBottom: "2rem", lineHeight: "1.6" }}>
                    Merci pour votre inscription. Veuillez conserver le QR Code ci-dessous, il pourra vous être demandé lors de l'accès à l'événement.
                </p>

                {qrDataUrl && (
                    <div style={{ padding: "1.5rem", border: "2px dashed #e5e7eb", borderRadius: "12px", display: "inline-block", marginBottom: "2rem" }}>
                        <img src={qrDataUrl} alt="QR Code" style={{ width: "100%", maxWidth: "250px", display: "block" }} />
                    </div>
                )}

                <div>
                    <Link 
                        href="/"
                        style={{ display: "inline-block", padding: "1rem 2rem", backgroundColor: "#0A2E73", color: "#fff", textDecoration: "none", borderRadius: "8px", fontWeight: "bold" }}
                    >
                        Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
}
