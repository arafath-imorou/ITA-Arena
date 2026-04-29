"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "../Blog.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import BackButton from "@/components/BackButton";

export default function BlogDetailPage() {
    const { id } = useParams();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchDetail() {
            try {
                const { data, error } = await supabase
                    .from('news')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setItem(data);
            } catch (err) {
                console.error("Error fetching news detail:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetail();
    }, [id]);

    if (loading) return <div className={styles.loading}>Chargement...</div>;
    if (!item) return <div className={styles.empty}>Article non trouvé.</div>;

    return (
        <div className={styles.blogWrapper}>
            <Navbar />
            
            <main className="container" style={{ paddingTop: '120px' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <BackButton variant="dark" />
                </div>

                <article className={styles.detailWrapper}>
                    <header className={styles.detailHeader}>
                        <div className={styles.detailMeta}>
                            <span className={styles.categoryTag}>{item.category || "Showbizz"}</span>
                            <span>📅 {item.date || new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                        <h1 className={styles.detailTitle}>{item.title}</h1>
                    </header>

                    <div className={styles.mainImageWrapper}>
                        <img 
                            src={item.image.startsWith('assets') ? `/${item.image}` : item.image} 
                            alt={item.title} 
                            className={styles.mainImage} 
                        />
                    </div>

                    <div 
                        className={styles.detailContent}
                        dangerouslySetInnerHTML={{ __html: item.content }}
                    />
                </article>
            </main>

            <Footer />
        </div>
    );
}
