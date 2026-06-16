"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./FeaturedEvents.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useMode } from "@/context/ModeContext";
import { useCountry } from "@/context/CountryContext";

export default function FeaturedEvents() {
    const { mode, activeCategory } = useMode();
    const { countries, selectedCountry, setSelectedCountry } = useCountry();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string>("");
    const [likedEvents, setLikedEvents] = useState<string[]>([]);
    const initialLoadDone = useRef(false);

    const checkIsPastEvent = (dateStr: string) => {
        if (!dateStr) return false;
        const match = dateStr.match(/\d{4}-\d{2}-\d{2}/);
        if (match) {
            const d = new Date(match[0]);
            if (!isNaN(d.getTime())) {
                return d < new Date(new Date().setHours(0, 0, 0, 0));
            }
        }
        return false;
    };

    // Restaurer les likes depuis le navigateur au chargement
    useEffect(() => {
        const storedLikes = localStorage.getItem('ita_liked_events');
        if (storedLikes) {
            try {
                setLikedEvents(JSON.parse(storedLikes));
            } catch (e) {
                console.error("Error parsing liked events", e);
            }
        }
        initialLoadDone.current = true;
    }, []);

    // Sauvegarder les likes dans le navigateur à chaque changement
    useEffect(() => {
        if (initialLoadDone.current) {
            localStorage.setItem('ita_liked_events', JSON.stringify(likedEvents));
        }
    }, [likedEvents]);

    // Temps réel pour les campagnes de soutien
    useEffect(() => {
        const channel = supabase
            .channel('realtime_support_campaigns')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'support_campaigns' },
                (payload) => {
                    setData((currentData) => 
                        currentData.map((item) => {
                            if (item.id === payload.new.id) {
                                return {
                                    ...item,
                                    downloads: payload.new.downloads,
                                    likes_count: payload.new.likes_count
                                };
                            }
                            return item;
                        })
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

    const getInitials = (name: string) => {
        if (!name) return "??";
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const handleAvatarError = (avatarUrl: string) => {
        setFailedAvatars(prev => {
            const newSet = new Set(prev);
            newSet.add(avatarUrl);
            return newSet;
        });
    };


    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                let dbData;
                if (mode === 'support') {
                    let query = supabase.from('support_campaigns').select('*').eq('status', 'active');
                    if (activeCategory !== 'all') {
                        query = query.eq('category', activeCategory);
                    }
                    const { data, error } = await query;
                    if (error) throw error;
                    dbData = (data || []).map(item => ({
                        id: item.id,
                        title: item.title,
                        image_url: item.cover_image || item.frame_image || "https://placehold.co/600x400/0A2E73/FFFFFF?text=Soutien",
                        category_id: item.category || 'Campagne',
                        organizer_name: "Campagne de Soutien",
                        date: item.start_date && item.end_date 
                            ? `Du ${new Date(item.start_date).getDate()} au ${new Date(item.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}`
                            : (item.start_date ? new Date(item.start_date).toLocaleDateString('fr-FR') : "Date non définie"),
                        location: "En ligne",
                        slug: item.slug,
                        likes_count: item.likes_count || 0,
                        downloads: item.downloads || 0,
                        total_capacity: 0,
                        sold_count: 0,
                    }));
                } else {
                    let query = supabase
                        .from('events_with_stats')
                        .select('*')
                        .eq('type', mode === 'events' ? 'event' : 'cotisation')
                        .eq('is_published', true);

                    if (selectedCountry && selectedCountry.name !== "Tous") {
                        query = query.eq('country', selectedCountry.name);
                    }

                    if (activeCategory !== 'all') {
                        query = query.eq('category_id', activeCategory);
                    }

                    const { data, error } = await query;
                    if (error) throw error;
                    dbData = data || [];
                }
                if (dbData) {
                    dbData.sort((a: any, b: any) => {
                        const aPast = checkIsPastEvent(a.date);
                        const bPast = checkIsPastEvent(b.date);
                        if (aPast && !bPast) return 1;
                        if (!aPast && bPast) return -1;
                        return 0;
                    });
                }
                setData(dbData);
            } catch (err: any) {
                console.error("Error fetching events:", err);
                setErrorMsg(err?.message || "Erreur inconnue");
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
        
        const currentlyLiked = likedEvents.includes(id);
        const incrementBy = currentlyLiked ? -1 : 1;
        
        // 1. Optimistically update local states
        if (currentlyLiked) {
            setLikedEvents(prev => prev.filter(item => item !== id));
        } else {
            setLikedEvents(prev => [...prev, id]);
        }
        
        setData(prev => prev.map(ev => {
            if (ev.id === id) {
                return { ...ev, likes_count: Math.max(0, (ev.likes_count || 0) + incrementBy) };
            }
            return ev;
        }));

        try {
            // 2. Sync update into remote Supabase instance via Postgres function
            const rpcName = mode === 'support' ? 'toggle_support_like' : 'toggle_event_like';
            const params = mode === 'support' 
                ? { campaign_id_param: id, increment_by: incrementBy }
                : { event_id_param: id, increment_by: incrementBy };

            const { data: updatedCount, error } = await supabase.rpc(rpcName, params);

            if (error) {
                // Fallback for missing RPC function
                const tableName = mode === 'support' ? 'support_campaigns' : 'events';
                const { data: currentData } = await supabase.from(tableName).select('likes_count').eq('id', id).single();
                
                if (currentData) {
                    const newCount = Math.max(0, (currentData.likes_count || 0) + incrementBy);
                    await supabase.from(tableName).update({ likes_count: newCount }).eq('id', id);
                    setData(prev => prev.map(ev => {
                        if (ev.id === id) {
                            return { ...ev, likes_count: newCount };
                        }
                        return ev;
                    }));
                }
                return;
            }
            
            // 3. Hard-bind count directly with truth database response if valid
            if (typeof updatedCount === 'number') {
                setData(prev => prev.map(ev => {
                    if (ev.id === id) {
                        return { ...ev, likes_count: updatedCount };
                    }
                    return ev;
                }));
            }
        } catch (error) {
            console.error("Failed to sync event like status:", error);
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
                            const isPast = checkIsPastEvent(item.date);
                            const isSoldOut = item.total_capacity > 0 && item.sold_count >= item.total_capacity;
                            return (
                                <div key={item.id} className={styles.card}>
                                    <div className={styles.imageWrapper}>
                                        <div className={styles.blurBg} style={{ backgroundImage: `url(${item.image_url})` }}></div>
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
                                            {item.organizer_avatar && !failedAvatars.has(item.organizer_avatar) ? (
                                                <img 
                                                    src={item.organizer_avatar} 
                                                    alt={item.organizer_name} 
                                                    className={styles.miniAvatar} 
                                                    onError={() => handleAvatarError(item.organizer_avatar)}
                                                />
                                            ) : (
                                                <div className={styles.miniInitials}>
                                                    {getInitials(item.organizer_name)}
                                                </div>
                                            )}
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
                                                <div style={{ padding: '0.8rem', background: '#f5f7fa', borderRadius: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#0A2E73', fontWeight: 'bold' }}>Participants actuels</span>
                                                    <span style={{ background: '#F7931E', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                        {item.downloads || 0}
                                                    </span>
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

                                            {isSoldOut && !isPast && (
                                                <div style={{ marginTop: '0.5rem', background: '#fef2f2', color: '#991b1b', fontSize: '0.75rem', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center', fontWeight: 'bold' }}>
                                                    🚫 COMPLET
                                                </div>
                                            )}
                                            {isPast && (
                                                <div style={{ marginTop: '0.5rem', background: '#f8fafc', color: '#334155', fontSize: '0.75rem', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center', fontWeight: 'bold', border: '1px solid #e2e8f0' }}>
                                                    TERMINÉ
                                                </div>
                                            )}
                                        </div>

                                        <Link 
                                            href={isPast ? "#" : (mode === 'support' ? `/support/${item.slug}` : `/events/${item.id}`)} 
                                            className={styles.buyBtn}
                                            style={(isSoldOut || isPast) ? { background: '#ccc', pointerEvents: 'none' } : {}}
                                            onClick={(e) => {
                                                if (isPast) {
                                                    e.preventDefault();
                                                    alert("Cet événement est déjà terminé. Nous espérons vous revoir très bientôt pour de nouvelles aventures ! ✨");
                                                }
                                            }}
                                        >
                                            {isPast ? "Événement terminé" : (isSoldOut ? "COMPLET" : (mode === 'events' ? "Réserver mon ticket" : (mode === 'support' ? "Soutenir la campagne" : "Contribuer")))}
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
                        {errorMsg && <p style={{color: 'red', marginTop: '1rem'}}>Erreur: {errorMsg}</p>}
                        <p style={{marginTop: '1rem', color: '#ccc', fontSize: '0.8rem'}}>Debug: Mode={mode}, Category={activeCategory}, DataLength={data.length}</p>
                    </div>
                )}
            </div>
        </section>
    );
}
