"use client";

import styles from "./FeaturedEvents.module.css";
import { useMode } from "@/context/ModeContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FeaturedEvents() {
    const { mode, activeCategory } = useMode();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            let query = supabase
                .from('events')
                .select(`
                    *,
                    organizer:organizers(*)
                `)
                .eq('type', mode === 'events' ? 'event' : 'cotisation');

            if (activeCategory !== 'all') {
                query = query.eq('category_id', activeCategory);
            }

            const { data: dbData, error } = await query;

            const testEvents = [
                {
                    id: 'seed-1',
                    title: "ITA ARENA Music Night",
                    image_url: "/events/festival.png",
                    category_id: "festival",
                    date: "25 Mars 2026",
                    time: "20:00",
                    price: "5.000 F CFA",
                    location: "Palais des Congrès",
                    type: "event",
                    likes_count: 124,
                    organizer: { name: "Global Events", avatar_url: "https://i.pravatar.cc/150?u=global", is_verified: true }
                },
                {
                    id: 'seed-2',
                    title: "Coding with Antigravity",
                    image_url: "/events/workshop.png",
                    category_id: "education",
                    date: "12 Avril 2026",
                    time: "09:00",
                    price: "Gratuit",
                    location: "Epitech Bénin",
                    type: "event",
                    likes_count: 85,
                    organizer: { name: "Tech Academy", avatar_url: "https://i.pravatar.cc/150?u=tech", is_verified: true }
                },
                {
                    id: 'seed-3',
                    title: "ITA ARENA Basketball Cup",
                    image_url: "/events/sports.png",
                    category_id: "culture",
                    date: "30 Mai 2026",
                    time: "15:30",
                    price: "2.000 F CFA",
                    location: "Hall des Arts",
                    type: "event",
                    likes_count: 210,
                    organizer: { name: "Sport Benin", avatar_url: "https://i.pravatar.cc/150?u=sport", is_verified: false }
                }
            ];

            if (!error && dbData) {
                // Filter test events based on category if needed
                const filteredTest = activeCategory === 'all'
                    ? testEvents
                    : testEvents.filter(e => e.category_id === activeCategory);

                setData([...filteredTest, ...dbData]);
            } else if (dbData === null && !error) {
                setData(testEvents);
            }
            setLoading(false);
        }

        fetchData();
    }, [mode, activeCategory]);

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.grid}>
                    {data.map((item: any) => {
                        const percent = item.goal_amount ? Math.round((item.collected_amount / item.goal_amount) * 100) : 0;
                        return (
                            <div key={item.id} className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    <img src={item.image_url} alt={item.title} className={styles.image} />
                                    <button className={styles.favBtn}>🤍</button>
                                    <div className={styles.categoryTag}>
                                        <span>📍</span>
                                        <span>{item.category_id}</span>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.titleRow}>
                                        <h3 className={styles.eventTitle}>{item.title}</h3>
                                        <div className={styles.likesArea}>
                                            <span className={styles.heartIcon}>♡</span>
                                            <span className={styles.likesCount}>{item.likes_count}</span>
                                        </div>
                                    </div>

                                    <div className={styles.metaInfo}>
                                        <div className={styles.metaLine}>
                                            <span>📅</span>
                                            <span>{item.date} {item.time ? `| ${item.time}` : ''}</span>
                                        </div>

                                        {mode === 'events' ? (
                                            <div className={styles.priceLine}>
                                                <span>💵</span>
                                                <span className={styles.priceText}>À partir de {item.price}</span>
                                            </div>
                                        ) : (
                                            <div className={styles.progressBarWrapper}>
                                                <div className={styles.progressLabel}>
                                                    <span>Collecté: <strong>{new Intl.NumberFormat('fr-FR').format(item.collected_amount)} F CFA</strong></span>
                                                    <span>{percent}%</span>
                                                </div>
                                                <div className={styles.progressBg}>
                                                    <div className={styles.progressFill} style={{ width: `${percent}%` }}></div>
                                                </div>
                                                <div className={styles.goalLine}>
                                                    <span>Objectif: {new Intl.NumberFormat('fr-FR').format(item.goal_amount)} F CFA</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className={styles.locationLine}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fe/Flag_of_Cote_d%27Ivoire.svg" alt="CI" className={styles.miniFlag} />
                                            <span>📍</span>
                                            <span>{item.location}</span>
                                        </div>
                                    </div>

                                    <Link href={`/events/${item.id}`} className={styles.buyBtn}>
                                        {mode === 'events' ? 'Acheter tickets' : 'Faire un don'}
                                    </Link>

                                    <div className={styles.organizerFooter}>
                                        <div className={styles.orgInfo}>
                                            {item.organizer && (
                                                <>
                                                    <img src={item.organizer.avatar_url} alt={item.organizer.name} className={styles.orgAvatar} />
                                                    <div className={styles.orgNameWrap}>
                                                        <span className={styles.publiePar}>Publié par</span>
                                                        <div className={styles.orgNameLine}>
                                                            <span className={styles.orgName}>{item.organizer.name}</span>
                                                            {item.organizer.is_verified && <span className={styles.verifiedCheck}>✓</span>}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <button className={styles.subscribeBtn}>S'abonner</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
