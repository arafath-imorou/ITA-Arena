"use client";

import { useState, useEffect } from "react";
import styles from "./FeaturedEvents.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMode } from "@/context/ModeContext";



const countries = [
    { name: "Bénin", flag: "https://flagcdn.com/w40/bj.png" },
    { name: "Côte d'Ivoire", flag: "https://flagcdn.com/w40/ci.png" },
    { name: "Sénégal", flag: "https://flagcdn.com/w40/sn.png" },
    { name: "Togo", flag: "https://flagcdn.com/w40/tg.png" },
];

export default function FeaturedEvents() {
    const { mode, activeCategory } = useMode();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [likedEvents, setLikedEvents] = useState<string[]>([]);


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                let query = supabase
                    .from('events_with_stats')
                    .select('*')
                    .eq('type', mode === 'events' ? 'event' : 'cotisation')
                    .eq('is_published', true);

                if (selectedCountry) {
                    query = query.eq('country', selectedCountry.name);
                }

                if (activeCategory !== 'all') {
                    query = query.eq('category_id', activeCategory);
                }

                const { data: dbData, error } = await query;

                if (error) throw error;
                setData(dbData || []);
            } catch (err) {
                console.error("Error fetching events:", err);
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [mode, activeCategory, selectedCountry]);

    const handleLike = async (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (likedEvents.includes(id)) {
            setLikedEvents(prev => prev.filter(item => item !== id));
        } else {
            setLikedEvents(prev => [...prev, id]);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Chargement...</div>;

    return (
        <section id="events-grid" className={styles.section}>
            <div className="container">
                <div className={styles.filters}>
                    <div className={styles.countryTabs}>
                        {countries.map(c => (
                            <button 
                                key={c.name}
                                className={`${styles.countryTab} ${selectedCountry.name === c.name ? styles.activeCountry : ""}`}
                                onClick={() => setSelectedCountry(c)}
                            >
                                <img src={c.flag} alt={c.name} className={styles.flag} />
                                <span>{c.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {data.length > 0 ? (
                    <div className={styles.grid}>
                        {data.map((item: any) => {
                            const percent = item.total_capacity > 0 ? Math.round((item.collected_amount / item.total_capacity) * 100) : 0;
                            const isLiked = likedEvents.includes(item.id);
                            return (
                                <div key={item.id} className={styles.card}>
                                    <div className={styles.imageWrapper}>
                                        <img src={item.image_url} alt={item.title} className={styles.image} />
                                        <button 
                                            className={`${styles.favBtn} ${isLiked ? styles.activeFav : ""}`}
                                            onClick={(e) => handleLike(e, item.id)}
                                        >
                                            {isLiked ? "❤️" : "🤍"}
                                        </button>
                                        <div className={styles.categoryTag}>
                                            <span>📍</span>
                                            <span>{item.category_id}</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardBody}>
                                        <div className={styles.titleRow}>
                                            <h3 className={styles.eventTitle}>{item.title}</h3>
                                            <div 
                                                className={`${styles.likesArea} ${isLiked ? styles.liked : ""}`}
                                                onClick={(e) => handleLike(e, item.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span className={styles.heartIcon}>{isLiked ? "❤️" : "♡"}</span>
                                                <span className={styles.likesCount}>{item.likes_count || 0}</span>
                                            </div>
                                        </div>

                                        <div className={styles.organizerRow}>
                                            <img 
                                                src={item.organizer_avatar || "/placeholder-avatar.png"} 
                                                alt={item.organizer_name} 
                                                className={styles.miniAvatar} 
                                            />
                                            <span className={styles.orgName}>{item.organizer_name || "Organisateur"}</span>
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
                                                        <span>Objectif: {new Intl.NumberFormat('fr-FR').format(item.target_amount)} F CFA</span>
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
                                                <span className={styles.locationText}>{item.location}</span>
                                            </div>

                                            {item.total_capacity > 0 && item.sold_count >= item.total_capacity && (
                                                <div style={{ marginTop: '0.5rem', background: '#fef2f2', color: '#991b1b', fontSize: '0.75rem', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                    🚫 COMPLET
                                                </div>
                                            )}
                                        </div>

                                        <Link 
                                            href={`/events/${item.id}`} 
                                            className={styles.buyBtn}
                                            style={item.total_capacity > 0 && item.sold_count >= item.total_capacity ? { background: '#ccc', pointerEvents: 'none' } : {}}
                                        >
                                            {item.total_capacity > 0 && item.sold_count >= item.total_capacity ? "COMPLET" : (mode === 'events' ? "Réserver mon ticket" : "Contribuer")}
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🎭</div>
                        <h3>Aucun événement trouvé</h3>
                        <p>Essayez de changer de catégorie ou de pays.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
