"use client";

import styles from "./FeaturedEvents.module.css";
import { useMode } from "@/context/ModeContext";
import { useCountry } from "@/context/CountryContext";
import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function FeaturedEvents() {
    const { mode, activeCategory } = useMode();
    const { selectedCountry, countries } = useCountry();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            let query = supabase
                .from('events')
                .select(`
                    *,
                    organizer:profiles(name:full_name, avatar_url)
                `)
                .eq('type', mode === 'events' ? 'event' : 'cotisation')
                .eq('country', selectedCountry.name);

            if (activeCategory !== 'all') {
                query = query.eq('category_id', activeCategory);
            }

            const { data: dbData, error } = await query;

            if (error) {
                console.error("Error fetching events:", error);
                setData([]);
            } else if (dbData) {
                setData(dbData);
            }
            setLoading(false);
        }

        fetchData();
    }, [mode, activeCategory, selectedCountry]);

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

    return (
        <section id="events-grid" className={styles.section}>
            <div className="container">
                {data.length > 0 ? (
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
                                                    <span className={styles.priceText}>
                                                        {item.price.includes("À partir de") ? item.price : `À partir de ${item.price}`}
                                                        {item.price !== "Gratuit" && !item.price.includes("F CFA") ? " F CFA" : ""}
                                                    </span>
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
                                                <img 
                                                    src={countries.find(c => c.name === item.country)?.flag || "https://flagcdn.com/w40/bj.png"} 
                                                    alt={item.country} 
                                                    className={styles.miniFlag} 
                                                />
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
                                                        {item.organizer.avatar_url ? (
                                                            <img src={item.organizer.avatar_url} alt={item.organizer.name} className={styles.orgAvatar} />
                                                        ) : (
                                                            <div className={styles.orgInitials}>
                                                                {item.organizer.name ? item.organizer.name.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 2) : '??'}
                                                            </div>
                                                        )}
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
                ) : (
                    <div className={styles.noEvents}>
                        <div className={styles.noEventsIcon}>🎭</div>
                        <h3>Aucun évènement disponible</h3>
                        <p>Il n'y a pas encore d'évènements dans cette catégorie. Revenez plus tard ou publiez le vôtre !</p>
                        <Link href="/organizer/create" className={styles.publishPromptBtn}>
                            Publier un évènement
                        </Link>
                    </div>
                )}
            </div>
        </section>
    );
}
