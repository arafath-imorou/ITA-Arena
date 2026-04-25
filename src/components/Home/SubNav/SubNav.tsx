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
            const { data, error } = await supabase
                .schema('ita_arena')
                .from('categories')
                .select('*')
                .eq('type', mode === 'events' ? 'event' : 'cotisation');

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
        <section className={styles.section}>
            <div className="container">
                {/* Mode Toggle */}
                <div className={styles.toggleContainer}>
                    <div className={styles.toggleWrapper}>
                        <button
                            className={`${styles.toggleBtn} ${mode === 'events' ? styles.activeToggle : ''}`}
                            onClick={() => setMode('events')}
                        >
                            Événements
                        </button>
                        <div className={styles.cotisationWrapper}>
                            <button
                                className={`${styles.toggleBtn} ${mode === 'cotisations' ? styles.activeToggle : ''}`}
                                onClick={() => setMode('cotisations')}
                            >
                                Cotisations
                            </button>
                            <span className={styles.newBadge}>Nouveau</span>
                        </div>
                    </div>
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
