"use client";

import styles from "./Categories.module.css";
import { useState, useEffect } from "react";
import { useMode } from "@/context/ModeContext";
import { supabase } from "@/lib/supabase";

export default function Categories() {
    const { mode, activeCategory, setActiveCategory } = useMode();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCategories() {
            setLoading(true);
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('type', mode === 'events' ? 'event' : 'cotisation');

            if (!error && data) {
                // Ensure "Toutes" is always first
                const allItem = { id: 'all', label: 'Toutes', icon: '🔍', type: mode };
                setCategories([allItem, ...data]);

                // Reset active category if it doesn't exist in new list
                if (activeCategory !== 'all' && !data.find(c => c.id === activeCategory)) {
                    setActiveCategory('all');
                }
            }
            setLoading(false);
        }

        fetchCategories();
    }, [mode]);

    return (
        <section className={styles.categories}>
            <div className="container">
                <div className={styles.scrollWrapper}>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`${styles.categoryItem} ${activeCategory === cat.id ? styles.active : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className={styles.icon}>{cat.icon}</span>
                            <span className={styles.label}>{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
