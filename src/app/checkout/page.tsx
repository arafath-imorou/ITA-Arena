"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "./Payment.module.css";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1); // 1: Order Summary, 2: Payment
    const [paymentMethod, setPaymentMethod] = useState("wave");
    const [timeLeft, setTimeLeft] = useState(1799); // 29:59 (approx 30 mins)
    const [email, setEmail] = useState("arafathimorou@gmail.com");
    const [phone, setPhone] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const eventId = searchParams.get("id") || "d5d140e6-921a-4c9c-b36d-dcc6c478a846"; // Default or from URL

    // Data from URL or default fallback
    const eventName = searchParams.get("event") || "Événement ITA Arena";
    // Dynamic ticket parsing from URL
    const tickets = [];
    for (let i = 1; i <= 10; i++) {
        const qty = parseInt(searchParams.get(`q${i}`) || "0");
        const price = parseInt(searchParams.get(`p${i}`) || "0");
        const name = searchParams.get(`n${i}`) || (i === 1 ? "Standard" : i === 2 ? "VIP" : "VVIP");
        
        if (qty > 0) {
            tickets.push({ name, price, qty });
        }
    }

    // Fallback for old URL format or default
    if (tickets.length === 0 && !searchParams.get("event")) {
        tickets.push({ name: "Pass Standard", price: 10000, qty: 1 });
    }

    const total = tickets.reduce((acc, t) => acc + t.price * t.qty, 0);

    useEffect(() => {
        if (step === 2 && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [step, timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePayment = async () => {
        if (!email) {
            alert("Veuillez renseigner votre email.");
            return;
        }

        setIsProcessing(true);

        try {
            // In a real app, we would call the payment provider API here.
            // After successful payment, we register the tickets in Supabase.
            
            const checkoutSessionId = typeof crypto !== 'undefined' && crypto.randomUUID 
                ? crypto.randomUUID() 
                : Math.random().toString(36).substring(2, 15);

            const ticketsToCreate = [];
            for (const t of tickets) {
                for (let j = 0; j < t.qty; j++) {
                    const qrKey = typeof crypto !== 'undefined' && crypto.randomUUID 
                        ? crypto.randomUUID() 
                        : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

                    ticketsToCreate.push({
                        event_id: eventId,
                        user_email: email,
                        user_phone: phone,
                        category: t.name,
                        amount: t.price,
                        qr_code_key: qrKey,
                        status: 'valid',
                        checkout_session_id: checkoutSessionId // Added for grouping
                    });
                }
            }

            if (ticketsToCreate.length > 0) {
                const { data, error } = await supabase
                    .from('tickets')
                    .insert(ticketsToCreate)
                    .select();

                if (error) throw error;

                // Redirect to confirmation with session ID instead of just one ticket ID
                router.push(`/checkout/confirmation?session=${checkoutSessionId}&event=${eventId}`);
            } else {
                throw new Error("Erreur lors de l'enregistrement des tickets");
            }
        } catch (err: any) {
            console.error("Erreur de réservation:", err);
            alert("Une erreur est survenue lors de la réservation de vos tickets.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (step === 1) {
        return (
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '600px' }}>
                <BackButton variant="dark" />
                <div className={styles.orderSummaryCard}>
                    <h1 className={styles.mainTitle}>Votre commande</h1>

                    <div className={styles.orderTable}>
                        {tickets.map((t, i) => (
                            <div key={i} className={styles.orderItem}>
                                <span><strong>{t.qty} x {t.name}</strong></span>
                                <span>{(t.price * t.qty).toLocaleString()} F CFA</span>
                            </div>
                        ))}
                        {tickets.length === 0 && (
                            <div className={styles.orderItem}>
                                <span><strong>Aucun billet sélectionné</strong></span>
                                <span>0 F CFA</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.totalRowLarge}>
                        <span>Total</span>
                        <span>{total.toLocaleString()} F CFA</span>
                    </div>

                    <div className={styles.contactForm}>
                        <div className={styles.inputGroup}>
                            <label>Adresse e-mail <span style={{ color: '#FF5A1F' }}>*</span></label>
                            <input 
                                type="email" 
                                placeholder="votre@email.com" 
                                className={styles.customInput} 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label>Numéro de téléphone</label>
                            <div className={styles.phoneInputWrap}>
                                <div className={styles.countryFlag}>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_Cote_d%27Ivoire.svg" alt="CI" />
                                    <span>▾</span>
                                </div>
                                <input 
                                    type="tel" 
                                    placeholder="01 23 45 6789" 
                                    className={styles.customInput} 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className={styles.couponDropdown}>
                        <button className={styles.couponBtn}>
                            🏷️ J'ai un code coupon <span>▾</span>
                        </button>
                    </div>

                    {total === 0 ? (
                        <button className={styles.primaryNextBtn} onClick={handlePayment} disabled={isProcessing}>
                            {isProcessing ? "Traitement..." : "Confirmer la réservation"}
                        </button>
                    ) : (
                        <button className={styles.primaryNextBtn} onClick={() => setStep(2)}>
                            Aller au paiement
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <h1 className={styles.pageTitleHeader}>Paiement</h1>

            <div className={styles.checkoutLayout}>
                <div className={styles.paymentColumn}>
                    <div className={styles.timerBox}>
                        🕒 {formatTime(timeLeft)}
                    </div>

                    <div className={styles.paymentBox}>
                        <h2 className={styles.boxTitle}>Méthode de paiement</h2>

                        <div className={styles.countrySelect}>
                            <label>Pays <span style={{ color: '#FF5A1F' }}>*</span></label>
                            <select className={styles.customSelect}>
                                <option>Côte d'Ivoire</option>
                                <option>Bénin</option>
                                <option>Sénégal</option>
                            </select>
                        </div>

                        <div className={styles.methodGrid}>
                            <div
                                className={`${styles.paymentMethodCard} ${paymentMethod === 'wave' ? styles.active : ''}`}
                                onClick={() => setPaymentMethod('wave')}
                            >
                                <div className={styles.methodLogo}>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/c/c2/Wave-logo.png" alt="Wave" />
                                    {paymentMethod === 'wave' && <div className={styles.checkIcon}>✓</div>}
                                </div>
                                <span>Wave</span>
                            </div>

                            <div
                                className={`${styles.paymentMethodCard} ${paymentMethod === 'momo' ? styles.active : ''}`}
                                onClick={() => setPaymentMethod('momo')}
                            >
                                <div className={styles.methodLogo}>
                                    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_x7J6pP-n59pT_3_6_p_5v_m_J_m_J_m_J_w&s" alt="MOMO" />
                                    {paymentMethod === 'momo' && <div className={styles.checkIcon}>✓</div>}
                                </div>
                                <span>Mobile Money</span>
                            </div>

                            <div
                                className={`${styles.paymentMethodCard} ${paymentMethod === 'djamo' ? styles.active : ''}`}
                                onClick={() => setPaymentMethod('djamo')}
                            >
                                <div className={styles.methodLogo}>
                                    <img src="https://djamo.com/_next/image?url=%2Fassets%2Ficons%2Flogo.svg&w=128&q=75" alt="Djamo" />
                                    {paymentMethod === 'djamo' && <div className={styles.checkIcon}>✓</div>}
                                </div>
                                <span>Djamo</span>
                            </div>

                            <div
                                className={`${styles.paymentMethodCard} ${paymentMethod === 'card' ? styles.active : ''}`}
                                onClick={() => setPaymentMethod('card')}
                            >
                                <div className={styles.methodLogo}>
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Card" />
                                    {paymentMethod === 'card' && <div className={styles.checkIcon}>✓</div>}
                                </div>
                                <span>Carte bancaire</span>
                            </div>
                        </div>

                        <div className={styles.totalDisplay}>
                            Total à payer : <strong>{total.toLocaleString()} F CFA</strong>
                        </div>

                        <div className={styles.termsBox}>
                            <input type="checkbox" id="terms" />
                            <label htmlFor="terms">J'accepte les conditions générales de vente et la politique de confidentialité</label>
                        </div>

                        <button 
                            className={styles.proceedBtn} 
                            onClick={handlePayment}
                            disabled={isProcessing}
                        >
                            {isProcessing ? "Traitement..." : "Procéder au paiement"} <span className={styles.doubleArrow}>»</span>
                        </button>
                    </div>
                </div>

                <div className={styles.summarySidebarFixed}>
                    <div className={styles.sidebarSection}>
                        <h3 className={styles.sidebarTitle}>Votre commande</h3>
                        <div className={styles.miniItems}>
                            {tickets.map((t, i) => (
                                <div key={i} className={styles.miniItem}>
                                    <span>{t.qty} x {t.name}</span>
                                    <span>{(t.price * t.qty).toLocaleString()} F CFA</span>
                                </div>
                            ))}
                        </div>
                        <div className={styles.miniTotal}>
                            <span>Total</span>
                            <span>{total.toLocaleString()} F CFA</span>
                        </div>
                    </div>

                    <div className={styles.sidebarAccordion}>
                        <div className={styles.accordionHeader}>
                            <span>Évènement</span>
                            <span>▾</span>
                        </div>
                        <div className={styles.accordionContent}>
                            <strong>{eventName}</strong>
                        </div>
                    </div>

                    <div className={styles.sidebarAccordion}>
                        <div className={styles.accordionHeader}>
                            <span>Acheteur</span>
                            <span>▴</span>
                        </div>
                        <div className={styles.accordionContentActive}>
                            <div className={styles.buyerEmail}>
                                📧 arafathimorou@gmail.com
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="container" style={{ paddingTop: '100px' }}>Chargement...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}
