"use client";

import { useState, useMemo } from "react";
import styles from "./EventDetail.module.css";
import Link from "next/link";
import { useMode } from "@/context/ModeContext";

export default function EventDetailClient({ id }: { id: string }) {
    const { mode } = useMode();
    const isCotisation = mode === 'cotisations';

    const [quantities, setQuantities] = useState<{ [key: string]: number }>({
        regular: 0,
        vip: 0,
    });

    // Mockup data selection
    const item = useMemo(() => {
        const seedEvents: { [key: string]: any } = {
            'seed-1': {
                title: "ITA ARENA Music Night",
                category: "CONCERT",
                image: "/events/festival.png",
                organizer: "Global Events Africa",
                date: "25 Mars 2026 • 20:00",
                location: "Palais des Congrès, Cotonou",
                description: "Une nuit inoubliable avec des artistes locaux et internationaux. Plongez dans l'ambiance électrique d'ITA ARENA !"
            },
            'seed-2': {
                title: "Coding with Antigravity",
                category: "FORMATION",
                image: "/events/workshop.png",
                organizer: "Tech Academy Benin",
                date: "12 Avril 2026 • 09:00",
                location: "Epitech Bénin, Cotonou",
                description: "Apprenez à construire des agents IA puissants avec Antigravity. Un atelier intensif pour les développeurs passionnés."
            },
            'seed-3': {
                title: "ITA ARENA Basketball Cup",
                category: "SPORTS",
                image: "/events/sports.png",
                organizer: "Sport Benin Federation",
                date: "30 Mai 2026 • 15:30",
                location: "Hall des Arts, Cotonou",
                description: "Le tournoi de basketball le plus attendu de l'année. Venez supporter vos équipes préférées dans une ambiance survoltée."
            }
        };

        if (seedEvents[id]) return seedEvents[id];

        if (isCotisation) {
            return {
                title: "SOLIDARITÉ INONDATIONS BÉNIN",
                category: "Solidarité",
                goal: "50 000 000 F CFA",
                collected: "32 500 000 F CFA",
                percent: 65,
                image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop",
                organizer: "Croix Rouge Bénin",
                date: "30 Avril 2026",
                location: "Parakou, Bénin",
                description: "Face aux inondations records touchant le nord du pays, ITA Arena s'engage aux côtés de la Croix Rouge. Vos dons serviront à fournir des kits de première nécessité, de l'eau potable et un relogement temporaire aux familles sinistrées."
            };
        }
        return {
            title: "CONCERT LIVE : ARTISTE BÉNIN",
            category: "CONCERT",
            image: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1974&auto=format&fit=crop",
            organizer: "ITA ARENA EVENTS",
            date: "03 Avril 2026 • 20:00",
            location: "Stade Municipal, Parakou",
            description: "Le grand concert live débarque à Parakou pour une date historique ! Revivez les plus grands classiques dans une performance électrique au Stade Municipal."
        };
    }, [isCotisation]);

    const handleQtyChange = (type: string, delta: number) => {
        setQuantities((prev) => ({
            ...prev,
            [type]: Math.max(0, (prev[type] || 0) + delta),
        }));
    };

    const total = quantities.regular * (isCotisation ? 0 : (item.title === "CONCERT LIVE : LA FOUINE" ? 30000 : 10000)) +
        quantities.vip * (isCotisation ? 0 : (item.title === "CONCERT LIVE : LA FOUINE" ? 50000 : 25000)) +
        (quantities.vvip || 0) * (item.title === "CONCERT LIVE : LA FOUINE" ? 100000 : 0);

    const handlePurchase = () => {
        const params = new URLSearchParams();
        params.set("event", item.title);
        if (quantities.regular > 0) params.set("q1", quantities.regular.toString());
        if (quantities.vip > 0) params.set("q2", quantities.vip.toString());
        if (quantities.vvip > 0) params.set("q3", quantities.vvip.toString());
        window.location.href = `/checkout?${params.toString()}`;
    };

    return (
        <div className={styles.page}>
            {/* ... hero section ... */}
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
                        <div className={styles.metaItem}>📅 {item.date}</div>
                        <div className={styles.metaItem}>📍 {item.location}</div>
                    </div>
                </div>
            </div>

            <div className={`container ${styles.mainGrid}`}>
                <div className={styles.infoColumn}>
                    {/* ... info sections ... */}
                    <section className={styles.descriptionSection}>
                        <h2 className={styles.heading}>À propos</h2>
                        <p className={styles.descriptionText}>{item.description}</p>
                    </section>

                    {isCotisation && (
                        <section className={styles.progressSection}>
                            <h2 className={styles.heading}>État de la collecte</h2>
                            <div className={styles.largeProgressWrapper}>
                                <div className={styles.progressHeader}>
                                    <span className={styles.collectedValue}>{item.collected}</span>
                                    <span className={styles.percentText}>{item.percent}% atteint</span>
                                </div>
                                <div className={styles.progressTrack}>
                                    <div className={styles.progressFill} style={{ width: `${item.percent}%` }}></div>
                                </div>
                                <p className={styles.goalText}>Objectif total : <strong>{item.goal}</strong></p>
                            </div>
                        </section>
                    )}

                    <section className={styles.organizerSection}>
                        <h2 className={styles.heading}>Organisateur</h2>
                        <div className={styles.organizerCard}>
                            <div className={styles.orgAvatar}></div>
                            <div className={styles.orgMeta}>
                                <h4>{item.organizer}</h4>
                                <p>Organisation vérifiée</p>
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
                                        <span className={styles.ticketName}>{item.title === "CONCERT LIVE : LA FOUINE" ? "GRAND PUBLIC" : "Pass Standard"}</span>
                                        <span className={styles.ticketPrice}>{item.title === "CONCERT LIVE : LA FOUINE" ? "30 000" : "10 000"} FCFA</span>
                                    </div>
                                    <div className={styles.qtyControl}>
                                        <button onClick={() => handleQtyChange("regular", -1)} className={styles.qtyBtn}>-</button>
                                        <span className={styles.qtyVal}>{quantities.regular}</span>
                                        <button onClick={() => handleQtyChange("regular", 1)} className={styles.qtyBtn}>+</button>
                                    </div>
                                </div>

                                <div className={styles.ticketOption}>
                                    <div className={styles.ticketInfo}>
                                        <span className={styles.ticketName}>{item.title === "CONCERT LIVE : LA FOUINE" ? "VIP" : "Pass VIP"}</span>
                                        <span className={styles.ticketPrice}>{item.title === "CONCERT LIVE : LA FOUINE" ? "50 000" : "25 000"} FCFA</span>
                                    </div>
                                    <div className={styles.qtyControl}>
                                        <button onClick={() => handleQtyChange("vip", -1)} className={styles.qtyBtn}>-</button>
                                        <span className={styles.qtyVal}>{quantities.vip}</span>
                                        <button onClick={() => handleQtyChange("vip", 1)} className={styles.qtyBtn}>+</button>
                                    </div>
                                </div>

                                {item.title === "CONCERT LIVE : LA FOUINE" && (
                                    <div className={styles.ticketOption}>
                                        <div className={styles.ticketInfo}>
                                            <span className={styles.ticketName}>VVIP</span>
                                            <span className={styles.ticketPrice}>100 000 FCFA</span>
                                        </div>
                                        <div className={styles.qtyControl}>
                                            <button onClick={() => handleQtyChange("vvip", -1)} className={styles.qtyBtn}>-</button>
                                            <span className={styles.qtyVal}>{quantities.vvip || 0}</span>
                                            <button onClick={() => handleQtyChange("vvip", 1)} className={styles.qtyBtn}>+</button>
                                        </div>
                                    </div>
                                )}

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
