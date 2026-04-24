"use client";

import { useState, useEffect } from "react";
import styles from "./EventDetail.module.css";
import Link from "next/link";
import { useMode } from "@/context/ModeContext";
import BackButton from "@/components/BackButton";
import { supabase } from "@/lib/supabase";

export default function EventDetailClient({ id }: { id: string }) {
    const { mode } = useMode();
    const isCotisation = mode === 'cotisations';

    const [quantities, setQuantities] = useState<{ [key: string]: number }>({
        regular: 0,
        vip: 0,
        vvip: 0
    });
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvent() {
            setLoading(true);
            
            // Fetch from database
            const { data, error } = await supabase
                .from('events')
                .select('*, organizer:profiles(name:full_name, avatar_url)')
                .eq('id', id)
                .single();

            if (!error && data) {
                setItem({
                    ...data,
                    image: data.image_url,
                    category: data.category_id?.toUpperCase() || (isCotisation ? "Solidarité" : "ÉVÉNEMENT")
                });
            } else {
                if (error) console.error("Error fetching event:", error);
                setItem(null);
            }
            setLoading(false);
        }

        fetchEvent();
    }, [id, isCotisation]);

    const handleQtyChange = (type: string, delta: number) => {
        setQuantities((prev) => ({
            ...prev,
            [type]: Math.max(0, (prev[type] || 0) + delta),
        }));
    };

    if (loading || !item) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Chargement de l'événement...</div>;

    const priceRegular = item.regular_price ?? (isCotisation ? 0 : 10000);
    const priceVip = item.vip_price ?? (isCotisation ? 0 : 25000);
    const priceVvip = item.vvip_price ?? 0;

    const total = (quantities.regular || 0) * priceRegular +
        (quantities.vip || 0) * priceVip +
        (quantities.vvip || 0) * priceVvip;

    const handlePurchase = () => {
        const params = new URLSearchParams();
        params.set("event", item.title);
        if (quantities.regular > 0) {
            params.set("q1", quantities.regular.toString());
            params.set("p1", priceRegular.toString());
        }
        if (quantities.vip > 0) {
            params.set("q2", quantities.vip.toString());
            params.set("p2", priceVip.toString());
        }
        if (quantities.vvip > 0) {
            params.set("q3", (quantities.vvip || 0).toString());
            params.set("p3", priceVvip.toString());
        }
        window.location.href = `/checkout?${params.toString()}`;
    };

    return (
        <div className={styles.page}>
            <div className="container" style={{ position: 'relative', zIndex: 10, paddingTop: '2rem', marginBottom: '-4rem' }}>
                <BackButton variant="dark" />
            </div>

            <div className={styles.heroSection}>
                <img
                    src={item.image}
                    alt={item.title}
                    className={styles.heroImage}
                />
                <div className={styles.heroOverlay}></div>
                <div className={`container ${styles.heroContent}`}>
                    <span className={styles.categoryBadge}>{item.category}</span>
                    <h1 className={styles.title}>{item.title}</h1>
                    <div className={styles.meta}>
                        <div className={styles.metaItem}>📅 {item.date} {item.time ? `| ${item.time}` : ''}</div>
                        <div className={styles.metaItem}>📍 {item.location}</div>
                    </div>
                </div>
            </div>

            <div className={`container ${styles.mainGrid}`}>
                <div className={styles.infoColumn}>
                    <section className={styles.descriptionSection}>
                        <h2 className={styles.heading}>À propos</h2>
                        <p className={styles.descriptionText}>{item.description}</p>
                    </section>

                    {isCotisation && (
                        <section className={styles.progressSection}>
                            <h2 className={styles.heading}>État de la collecte</h2>
                            <div className={styles.largeProgressWrapper}>
                                <div className={styles.progressHeader}>
                                    <span className={styles.collectedValue}>{new Intl.NumberFormat('fr-FR').format(item.collected_amount || 0)} F CFA</span>
                                    <span className={styles.percentText}>{Math.round(((item.collected_amount || 0) / (item.goal_amount || 1)) * 100)}% atteint</span>
                                </div>
                                <div className={styles.progressTrack}>
                                    <div className={styles.progressFill} style={{ width: `${Math.min(100, ((item.collected_amount || 0) / (item.goal_amount || 1)) * 100)}%` }}></div>
                                </div>
                                <p className={styles.goalText}>Objectif total : <strong>{new Intl.NumberFormat('fr-FR').format(item.goal_amount || 0)} F CFA</strong></p>
                            </div>
                        </section>
                    )}

                    <section className={styles.organizerSection}>
                        <h2 className={styles.heading}>Organisateur</h2>
                        <div className={styles.organizerCard}>
                            <img src={item.organizer?.avatar_url || "https://i.pravatar.cc/150?u=org"} alt={item.organizer?.name} className={styles.orgAvatar} />
                            <div className={styles.orgMeta}>
                                <h4>{item.organizer?.name || "Organisateur ITA"}</h4>
                                <p>{item.organizer?.is_verified ? "Organisation vérifiée" : "Organisateur certifié"}</p>
                            </div>
                            <Link href="#" className={styles.followLink}>Voir le profil</Link>
                        </div>
                    </section>
                </div>

                <aside className={styles.stickyColumn}>
                    <div className={styles.actionCard}>
                        {isCotisation ? (
                            <>
                                <h3>Faire un don</h3>
                                <p className={styles.actionSub}>Soutenez cette noble cause</p>
                                <div className={styles.amountInputWrap}>
                                    <span className={styles.currencyLabel}>F CFA</span>
                                    <input type="number" placeholder="Montant libre" className={styles.amountInput} />
                                </div>
                                <button className={styles.ctaBtn}>
                                    🤝 SOUTENIR LE PROJET
                                </button>
                            </>
                        ) : (
                            <>
                                <h3>Billetterie</h3>
                                <p className={styles.actionSub}>Réservez vos places</p>

                                <div className={styles.ticketOption}>
                                    <div className={styles.ticketInfo}>
                                        <span className={styles.ticketName}>Pass Standard</span>
                                        <span className={styles.ticketPrice}>{priceRegular === 0 ? "GRATUIT" : `${priceRegular.toLocaleString()} FCFA`}</span>
                                    </div>
                                    <div className={styles.qtyControl}>
                                        <button onClick={() => handleQtyChange("regular", -1)} className={styles.qtyBtn}>-</button>
                                        <span className={styles.qtyVal}>{quantities.regular}</span>
                                        <button onClick={() => handleQtyChange("regular", 1)} className={styles.qtyBtn}>+</button>
                                    </div>
                                </div>

                                <div className={styles.ticketOption}>
                                    <div className={styles.ticketInfo}>
                                        <span className={styles.ticketName}>Pass VIP</span>
                                        <span className={styles.ticketPrice}>{priceVip === 0 ? "GRATUIT" : `${priceVip.toLocaleString()} FCFA`}</span>
                                    </div>
                                    <div className={styles.qtyControl}>
                                        <button onClick={() => handleQtyChange("vip", -1)} className={styles.qtyBtn}>-</button>
                                        <span className={styles.qtyVal}>{quantities.vip}</span>
                                        <button onClick={() => handleQtyChange("vip", 1)} className={styles.qtyBtn}>+</button>
                                    </div>
                                </div>

                                <div className={styles.totalRow}>
                                    <span>Total à payer</span>
                                    <span className={styles.totalVal}>{total.toLocaleString()} F CFA</span>
                                </div>

                                <button
                                    className={styles.ctaBtn}
                                    disabled={total === 0}
                                    onClick={handlePurchase}
                                >
                                    🎟️ ACHETER TICKETS
                                </button>
                            </>
                        )}

                        <div className={styles.footerActions}>
                            <button className={styles.secondaryBtn}>❤️ Liste de souhaits</button>
                            <button className={styles.secondaryBtn}>🔗 Partager</button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
