"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Script from "next/script";
import styles from "./Payment.module.css";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";
import { supabase } from "@/lib/supabase";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const [step, setStep] = useState(1); // 1: Order Summary, 2: Payment
    const [paymentMethod, setPaymentMethod] = useState("wave");
    const [timeLeft, setTimeLeft] = useState(1799); // 29:59 (approx 30 mins)
    const [email, setEmail] = useState("arafathimorou@gmail.com");
    const [phone, setPhone] = useState("");
    const [fullName, setFullName] = useState("");
    const [paymentPhone, setPaymentPhone] = useState("");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();

    const eventId = searchParams.get("id"); // No more hardcoded ID fallback
    
    useEffect(() => {
        if (!eventId && step === 1) {
            console.error("Missing event ID in checkout");
            // alert("Une erreur est survenue : l'identifiant de l'événement est manquant.");
            // router.push("/");
        }
    }, [eventId, router, step]);

    // Data from URL or default fallback
    const eventName = searchParams.get("event") || "Événement ITA Arena";
    // Dynamic ticket parsing from URL
    const tickets: { name: string; price: number; qty: number }[] = [];
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

        if (paymentMethod !== "card" && (!fullName || !paymentPhone)) {
            alert("Veuillez renseigner votre nom et votre numéro de paiement.");
            return;
        }

        if (!termsAccepted) {
            alert("Veuillez accepter les conditions générales de vente.");
            return;
        }

        setIsProcessing(true);

        try {
            const fedapayKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
            if (!fedapayKey) {
                alert("Erreur de configuration : La clé de paiement FedaPay est manquante. Veuillez contacter le support (+229 0152818100).");
                return;
            }

            // 1. Prepare ticket data
            const checkoutSessionId = typeof crypto !== 'undefined' && crypto.randomUUID 
                ? crypto.randomUUID() 
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });

            const ticketsToCreate: any[] = [];
            for (const t of tickets) {
                for (let j = 0; j < t.qty; j++) {
                    // Ensure a truly unique QR key
                    const timestamp = Date.now().toString(36);
                    const randomStr = Math.random().toString(36).substring(2, 10);
                    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
                        ? crypto.randomUUID() 
                        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
                        });
                    
                    const qrKey = `${timestamp}-${randomStr}-${uniqueId}`;

                    ticketsToCreate.push({
                        event_id: eventId,
                        user_email: email.trim(),
                        user_phone: phone, 
                        user_name: fullName.trim(), 
                        payment_phone: paymentPhone, 
                        category: t.name,
                        amount: t.price,
                        qr_code_key: qrKey,
                        status: 'valid',
                        checkout_session_id: checkoutSessionId
                    });
                }
            }

            if (ticketsToCreate.length > 0) {
                // 2. TRIGGER FEDAPAY (Programmatically)
                // In a production app, we would use the transaction token from the server
                // For now, we use the public key and simple checkout
                // Helper to map country codes
                const countryMapping: { [key: string]: string } = {
                    "+229": "BJ",
                    "+225": "CI",
                    "+221": "SN",
                    "+228": "TG",
                    "+223": "ML",
                    "+226": "BF",
                    "+227": "NE",
                    "+224": "GN"
                };

                // Clean phone number (remove spaces and current prefix if present to avoid duplication)
                let cleanPhone = paymentPhone.replace(/\s+/g, '');
                const prefix = selectedCountryObj.code;
                if (cleanPhone.startsWith(prefix)) {
                    cleanPhone = cleanPhone.substring(prefix.length);
                } else if (cleanPhone.startsWith('+')) {
                    // Remove any other prefix
                    cleanPhone = cleanPhone.replace(/^\+\d+/, '');
                }

                // Handle name parsing more safely
                const nameParts = fullName.trim().split(/\s+/);
                const lastname = nameParts.length > 1 ? nameParts.pop() : nameParts[0];
                const firstname = nameParts.length > 0 ? nameParts.join(' ') : 'Client';

                // Map our payment methods to FedaPay methods
                const fedaMethodMapping: { [key: string]: string } = {
                    "mtn": "mtn",
                    "moov": "moov",
                    "orange": "orange",
                    "wave": "wave",
                    "celtiis": "celtiis",
                    "free": "free",
                    "tmoney": "tmoney",
                    "airtel": "airtel",
                    "card": "card"
                };

                let insertionStarted = false;
                const fedaConfig = {
                    public_key: process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY,
                    transaction: {
                        amount: total,
                        description: `Achat de tickets - ${eventName}`,
                    },
                    customer: {
                        email: email.trim(),
                        lastname: lastname || 'Client',
                        firstname: firstname || 'Client',
                        phone_number: {
                            number: cleanPhone,
                            country: countryMapping[selectedCountryObj.code] || 'BJ'
                        }
                    },
                    // Direct payment method selection
                    method: fedaMethodMapping[paymentMethod] || 'mtn',
                    onComplete: async (response: any) => {
                        console.log("FedaPay Response:", response);
                        const status = (response.status || "").toLowerCase();
                        
                        if (status === 'approved' || status === 'successful' || status === 'success' || response.transaction?.status === 'approved') {
                            if (insertionStarted) return;
                            insertionStarted = true;

                            // 3. Save to database only after approval
                            const { data, error } = await supabase
                                .from('tickets')
                                .insert(ticketsToCreate);

                            if (error) {
                                console.error("Supabase insert error:", error);
                                // More detailed error for debugging
                                const errorDetail = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error));
                                alert(`Paiement réussi, mais une erreur est survenue lors de la création de vos billets : ${errorDetail}. Notez votre numéro de transaction et contactez le support (+229 0152818100).`);
                            } else {
                                router.push(`/checkout/confirmation?session=${checkoutSessionId}&event=${eventId}`);
                            }
                        } else {
                            const reason = response.reason || response.message || "Statut : " + status;
                            alert("Le paiement n'a pas pu être validé automatiquement. " + reason + ". Si vous avez été débité, contactez le support avec votre preuve de paiement.");
                            setIsProcessing(false);
                        }
                    }
                };

                // @ts-ignore
                if (window.FedaPay) {
                    try {
                        // @ts-ignore
                        const checkout = window.FedaPay.init(fedaConfig);
                        checkout.open();
                    } catch (fedaErr: any) {
                        console.error("FedaPay Error:", fedaErr);
                        alert("Erreur technique lors du lancement du paiement : " + (fedaErr.message || "Erreur inconnue"));
                    }
                } else {
                    alert("Le module de paiement n'est pas encore prêt. Veuillez patienter un instant.");
                    setIsProcessing(false);
                }
            }
        } catch (err: any) {
            console.error("Erreur de réservation:", err);
            alert(`Une erreur est survenue: ${err.message || "Erreur inconnue"}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const countryData = [
        { name: "Bénin", code: "+229", flag: "https://flagcdn.com/w40/bj.png" },
        { name: "Côte d'Ivoire", code: "+225", flag: "https://flagcdn.com/w40/ci.png" },
        { name: "Sénégal", code: "+221", flag: "https://flagcdn.com/w40/sn.png" },
        { name: "Togo", code: "+228", flag: "https://flagcdn.com/w40/tg.png" },
        { name: "Mali", code: "+223", flag: "https://flagcdn.com/w40/ml.png" },
        { name: "Burkina Faso", code: "+226", flag: "https://flagcdn.com/w40/bf.png" },
        { name: "Niger", code: "+227", flag: "https://flagcdn.com/w40/ne.png" },
        { name: "Guinée", code: "+224", flag: "https://flagcdn.com/w40/gn.png" },
    ];

    const [selectedCountryObj, setSelectedCountryObj] = useState(countryData[0]);

    const handleCountryChange = (countryName: string) => {
        const country = countryData.find(c => c.name === countryName);
        if (country) {
            setSelectedCountryObj(country);
            // If phone is empty or only contains a prefix, update it
            if (!phone || phone.startsWith('+')) {
                setPhone(country.code + " ");
            }
        }
    };

    // Initialize phone with prefix on mount
    useEffect(() => {
        if (!phone) {
            setPhone(selectedCountryObj.code + " ");
        }
    }, []);

    if (step === 1) {
        return (
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px', maxWidth: '600px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <BackButton variant="dark" />
                    <HomeButton variant="dark" label="Accueil" />
                </div>
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
                                    <img src={selectedCountryObj.flag} alt={selectedCountryObj.name} />
                                    <span>▾</span>
                                    <select 
                                        className={styles.hiddenSelect}
                                        value={selectedCountryObj.name}
                                        onChange={(e) => handleCountryChange(e.target.value)}
                                    >
                                        {countryData.map(c => (
                                            <option key={c.name} value={c.name}>{c.name} ({c.code})</option>
                                        ))}
                                    </select>
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

    const operatorData: { [key: string]: { name: string; logo: string }[] } = {
        "Bénin": [
            { name: "MTN", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg" },
            { name: "Moov", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Moov_Africa_logo.png" },
            { name: "Celtiis", logo: "https://www.celtiis.bj/wp-content/uploads/2022/10/Logo-Celtiis-B%C3%A9nin.png" }
        ],
        "Côte d'Ivoire": [
            { name: "Orange", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1024px-Orange_logo.svg.png" },
            { name: "MTN", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg" },
            { name: "Moov", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Moov_Africa_logo.png" },
            { name: "Wave", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Wave-logo.png" }
        ],
        "Sénégal": [
            { name: "Orange", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1024px-Orange_logo.svg.png" },
            { name: "Free", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Logo_Free_S%C3%A9n%C3%A9gal.svg/2560px-Logo_Free_S%C3%A9n%C3%A9gal.svg.png" },
            { name: "Wave", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Wave-logo.png" }
        ],
        "Guinée": [
            { name: "Orange", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1024px-Orange_logo.svg.png" },
            { name: "MTN", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/New-mtn-logo.jpg" }
        ],
        "Mali": [
            { name: "Orange", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1024px-Orange_logo.svg.png" },
            { name: "Moov", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Moov_Africa_logo.png" }
        ],
        "Togo": [
            { name: "TMoney", logo: "https://www.togocom.tg/wp-content/uploads/2020/09/Logo-Tmoney.png" },
            { name: "Moov", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Moov_Africa_logo.png" }
        ],
        "Burkina Faso": [
            { name: "Orange", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Orange_logo.svg/1024px-Orange_logo.svg.png" },
            { name: "Moov", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Moov_Africa_logo.png" }
        ],
        "Niger": [
            { name: "Moov", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Moov_Africa_logo.png" },
            { name: "Airtel", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Airtel_logo.svg/2560px-Airtel_logo.svg.png" }
        ]
    };

    const currentOperators = operatorData[selectedCountryObj.name] || [];

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
            <div style={{ marginBottom: '20px' }}>
                <HomeButton variant="dark" label="Retour à l'accueil" />
            </div>
            <Script 
                src="https://cdn.fedapay.com/checkout.js?v=1.1.7" 
                strategy="afterInteractive"
                onLoad={() => console.log("FedaPay SDK Loaded")}
            />
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
                            <select 
                                className={styles.customSelect}
                                value={selectedCountryObj.name}
                                onChange={(e) => handleCountryChange(e.target.value)}
                            >
                                {countryData.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.methodGrid}>
                            {currentOperators.map((op) => (
                                <div
                                    key={op.name}
                                    className={`${styles.paymentMethodCard} ${paymentMethod === op.name.toLowerCase() ? styles.active : ''}`}
                                    onClick={() => {
                                        setPaymentMethod(op.name.toLowerCase());
                                        if (!paymentPhone) setPaymentPhone(phone);
                                    }}
                                >
                                    <div className={styles.methodLogo}>
                                        <img src={op.logo} alt={op.name} />
                                        {paymentMethod === op.name.toLowerCase() && <div className={styles.checkIcon}>✓</div>}
                                    </div>
                                    <span>{op.name}</span>
                                </div>
                            ))}

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

                        {paymentMethod !== "card" && (
                            <div className={styles.paymentDetailsForm}>
                                <div className={styles.inputGroup}>
                                    <label>Nom & Prénom <span style={{ color: '#FF5A1F' }}>*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Sadath IMOROU" 
                                        className={styles.customInput} 
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Numéro de paiement ({paymentMethod.toUpperCase()}) <span style={{ color: '#FF5A1F' }}>*</span></label>
                                    <input 
                                        type="tel" 
                                        placeholder="Ex: +229 90 00 00 00" 
                                        className={styles.customInput} 
                                        value={paymentPhone}
                                        onChange={(e) => setPaymentPhone(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className={styles.totalDisplay}>
                            Total à payer : <strong>{total.toLocaleString()} F CFA</strong>
                        </div>

                        <div className={styles.termsBox}>
                            <input 
                                type="checkbox" 
                                id="terms" 
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                            />
                            <label htmlFor="terms">J'accepte les conditions générales de vente et la politique de confidentialité</label>
                        </div>

                        <button 
                            className={styles.proceedBtn} 
                            onClick={handlePayment}
                            disabled={isProcessing || !termsAccepted}
                            style={{ opacity: termsAccepted ? 1 : 0.5, cursor: termsAccepted ? 'pointer' : 'not-allowed' }}
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
                <div id="feda-payment-container"></div>
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
