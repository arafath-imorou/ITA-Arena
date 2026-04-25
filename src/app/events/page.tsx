"use client";

import { useState, useEffect } from "react";
import styles from "./Events.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function EventsPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        async function fetchCategories() {
            const { data, error } = await supabase
                .schema('ita_arena')
                .from('categories')
                .select('*')
                .eq('type', 'event');
            if (error) {
                console.error("Error fetching categories:", error);
            } else if (data) {
                setCategories(data);
            }
        }
        fetchCategories();
    }, []);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("all");

    useEffect(() => {
        async function fetchEvents() {
            setLoading(true);
            let query = supabase
                .schema('ita_arena')
                .from('events')
                .select(`
                    *,
                    organizer:profiles(name:full_name, avatar_url)
                `)
                .eq('type', 'event');

            if (selectedCategory !== "all") {
                query = query.eq('category_id', selectedCategory.toLowerCase());
            }

            const { data, error } = await query;

            if (error) {
                console.error("Error fetching events:", error);
            } else if (data) {
                setEvents(data);
            }
            setLoading(false);
        }

        fetchEvents();
    }, [selectedCategory]);

    return (
        <div className={styles.page}>
            <div className="container">
                <header className={styles.header}>
                    <h1 className={styles.title}>Découvrir les événements</h1>
                    <p className={styles.subtitle}>{events.length} événements à l'affiche</p>
                </header>

                {/* Horizontal Filter Bar */}
                <div className={styles.filterBar}>
                    <div className={styles.filterItem}>
                        <label>Catégorie</label>
                        <select
                            className={styles.select}
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">Toutes les catégories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    {/* Other filters can be implemented similarly */}
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement...</div>
                ) : (
                    <div className={styles.eventGrid}>
                        {events.map((event) => (
                            <div key={event.id} className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    <img src={event.image_url} alt={event.title} className={styles.image} />
                                    <div className={styles.categoryBadge}>{event.category_id}</div>
                                </div>
                                <div className={styles.cardContent}>
                                    <h3 className={styles.eventTitle}>{event.title}</h3>
                                    <div className={styles.meta}>
                                        <div className={styles.metaItem}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                            <span>{event.date}</span>
                                        </div>
                                        <div className={styles.metaItem}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                            <span>{event.location}</span>
                                        </div>
                                    </div>
                                    <div className={styles.footer}>
                                        <span className={styles.price}>{event.price}</span>
                                        <Link href={`/events/${event.id}`} className={styles.buyBtn}>Détails</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
