"use client";

import { useState, useEffect } from "react";
import styles from "./Blog.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";


export default function BlogPage() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNews() {
            try {
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setNews(data || []);
            } catch (err) {
                console.error("Error fetching news:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
    }, []);

    return (
        <div className={styles.blogWrapper}>
            
            <header className={styles.header}>
                <div className="container">
                    <h1 className={styles.title}>L'ARÈNE SHOWBIZ</h1>
                    <div className={styles.titleUnderline}></div>
                    <p className={styles.subtitle}>
                        Toutes les actualités croustillantes, les coulisses et les exclusivités du monde du showbiz béninois et international.
                    </p>
                </div>
            </header>

            <main className="container">
                {loading ? (
                    <div className={styles.loading}>
                        <div className="spinner"></div>
                        <p>Chargement des actualités...</p>
                    </div>
                ) : news.length > 0 ? (
                    <div className={styles.blogGrid}>
                        {news.map((item) => (
                            <Link key={item.id} href={`/blog/${item.id}`} className={styles.blogCard}>
                                <div className={styles.imageWrapper}>
                                    <img 
                                        src={item.image.startsWith('assets') ? `/${item.image}` : item.image} 
                                        alt={item.title} 
                                        className={styles.blogImage} 
                                    />
                                    <span className={styles.categoryTag}>{item.category || "Showbizz"}</span>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardDate}>
                                        <span>📅</span>
                                        <span>{item.date || new Date(item.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h2 className={styles.blogTitle}>{item.title}</h2>
                                    <p className={styles.blogSummary}>{item.summary}</p>
                                    <div className={styles.readMore}>
                                        Lire la suite <span>→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>🎭</div>
                        <h2>L'arène est calme pour le moment</h2>
                        <p>Revenez bientôt pour de nouvelles actualités showbiz !</p>
                    </div>
                )}
            </main>
        </div>
    );
}
