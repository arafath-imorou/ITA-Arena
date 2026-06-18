"use client";

import { useMode } from "@/context/ModeContext";
import styles from "./SubNav.module.css";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

const CATEGORY_ICONS: any = {
    "Toutes": "🔲",
    "Concert": "🎵",
    "Culture": "🎨",
    "Education": "🎓",
    "Formation": "🎓",
    "Soirée": "🍸",
    "Tourisme": "📍",
    "Sport": "🏋️",
    "Festival": "⛺",
    "Spectacle": "🎭",
    "Conférence": "🎤",
    "Cinéma": "🎬",
    "Atelier": "🎨",
    "Humour": "🎭",
    "Mariage": "💍",
    "Anniversaire": "🎂",
    "Scolarité": "📚",
    "Action Sociale": "🤝",
    "Solidarité": "🤝",
    "Projet": "🏗️",
    "Santé": "🏥",
    "Communauté": "👥",
    "Urgence": "🚨",
    "Voyage": "✈️",
    "Entreprise": "💼",
    "Célébrations": "🎉"
};

export default function SubNav() {
    const { mode, setMode, activeCategory, setActiveCategory } = useMode();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 0);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        // Also check after a small delay to ensure DOM is updated
        const timer = setTimeout(checkScroll, 500);
        return () => {
            window.removeEventListener('resize', checkScroll);
            clearTimeout(timer);
        };
    }, [categories]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth < 768 ? 200 : 400;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
            // Re-check after animation
            setTimeout(checkScroll, 400);
        }
    };

    useEffect(() => {
        async function fetchCategories() {
            setLoading(true);
            const typeQuery = mode === 'events' ? 'event' : (mode === 'cotisations' ? 'cotisation' : 'support');
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('type', typeQuery);

            if (error) {
                console.error("Error fetching categories:", error);
            } else if (data) {
                console.log("Categories found:", data.length);
                const filteredData = data.filter((c: any) => c.id !== 'toutes');
                const allItem = { id: 'all', label: 'Toutes', icon: '🔲' };
                setCategories([allItem, ...filteredData]);

                if (activeCategory !== 'all' && !data.find(c => c.id === activeCategory)) {
                    setActiveCategory('all');
                }
            }
            setLoading(false);
        }

        fetchCategories();
    }, [mode, activeCategory, setActiveCategory]);

    return (
        <section id="explore" className={styles.section}>
            <div className="container">
                <div className={styles.headerRow}>
                    <h2 className={styles.sectionTitle}>Nos évènements en cours</h2>
                </div>
                {/* Mode Toggle as Cards */}
                <div className={styles.typeCardsContainer}>
                    <button
                        className={`${styles.typeCard} ${mode === 'events' ? styles.typeCardActive : ''}`}
                        onClick={() => setMode('events')}
                    >
                        <div className={styles.typeCardIcon}>🎟️</div>
                        <h3 className={styles.typeCardTitle}>Événements</h3>
                        <div className={styles.typeCardArrow}>Voir ➔</div>
                    </button>
                    <button
                        className={`${styles.typeCard} ${mode === 'cotisations' ? styles.typeCardActive : ''}`}
                        onClick={() => setMode('cotisations')}
                    >
                        <div className={styles.typeCardIcon}>💰</div>
                        <h3 className={styles.typeCardTitle}>Cotisations</h3>
                        <div className={styles.typeCardArrow}>Voir ➔</div>
                    </button>
                    <button
                        className={`${styles.typeCard} ${mode === 'support' ? styles.typeCardActive : ''}`}
                        onClick={() => setMode('support')}
                    >
                        <div className={styles.typeCardIcon}>❤️</div>
                        <h3 className={styles.typeCardTitle}>Soutien</h3>
                        <div className={styles.typeCardArrow}>Voir ➔</div>
                    </button>
                    <button
                        className={`${styles.typeCard} ${mode === 'forms' ? styles.typeCardActive : ''}`}
                        onClick={() => setMode('forms')}
                    >
                        <div className={styles.typeCardIcon}>📝</div>
                        <h3 className={styles.typeCardTitle}>ITA Forms</h3>
                        <div className={styles.typeCardArrow}>Voir ➔</div>
                    </button>
                    <button
                        className={`${styles.typeCard} ${mode === 'votes' ? styles.typeCardActive : ''}`}
                        onClick={() => setMode('votes')}
                        style={{ position: 'relative' }}
                    >
                        <span className={styles.newBadge}>Nouveau</span>
                        <div className={styles.typeCardIcon}>🗳️</div>
                        <h3 className={styles.typeCardTitle}>Votes & Sondages</h3>
                        <div className={styles.typeCardArrow}>Voir ➔</div>
                    </button>
                </div>

                {/* Categories List */}
                <div className={styles.categoriesWrapper}>
                    {showLeftArrow && (
                        <button className={styles.scrollBtnLeft} onClick={() => scroll('left')}>
                            ‹
                        </button>
                    )}

                    <div
                        className={styles.scrollArea}
                        ref={scrollRef}
                        onScroll={checkScroll}
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                className={`${styles.categoryCard} ${activeCategory === cat.id ? styles.cardActive : ""}`}
                                onClick={() => setActiveCategory(cat.id)}
                            >
                                <div className={styles.iconBox}>
                                    <span className={styles.iconText}>
                                        {CATEGORY_ICONS[cat.label] || cat.icon || "📄"}
                                    </span>
                                </div>
                                <span className={styles.label}>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {showRightArrow && (
                        <button className={styles.scrollBtnRight} onClick={() => scroll('right')}>
                            ›
                        </button>
                    )}
                </div>
            </div>
        </section>
    );
}
