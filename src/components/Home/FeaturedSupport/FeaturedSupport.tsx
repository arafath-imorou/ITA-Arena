"use client";

import { useState, useEffect } from "react";
import styles from "./FeaturedSupport.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function FeaturedSupport() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('support_campaigns')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                
                const dbData = (data || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    image_url: item.cover_image || item.frame_image || "https://placehold.co/600x400/0A2E73/FFFFFF?text=Soutien",
                    category_id: item.category || 'Campagne',
                    organizer_name: "Campagne de Soutien",
                    slug: item.slug,
                }));
                
                setData(dbData);
            } catch (err) {
                console.error("Error fetching support campaigns:", err);
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) return null;
    if (data.length === 0) return null;

    return (
        <section className={styles.section}>
            <div className="container">
                <h2 className={styles.sectionTitle}>
                    Nos campagnes de <span>Soutien</span>
                </h2>
                
                <div className={styles.grid}>
                    {data.map((item: any) => (
                        <div key={item.id} className={styles.card}>
                            <div className={styles.imageWrapper}>
                                <div className={styles.blurBg} style={{ backgroundImage: `url(${item.image_url})` }}></div>
                                <img src={item.image_url} alt={item.title} className={styles.image} />
                                <div className={styles.categoryTag}>
                                    <span>📍</span>
                                    <span>{item.category_id}</span>
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.eventTitle}>{item.title}</h3>

                                <div className={styles.organizerRow}>
                                    <div className={styles.miniInitials}>
                                        {item.organizer_name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className={styles.orgName}>{item.organizer_name}</span>
                                </div>

                                <Link 
                                    href={`/support/${item.slug}`} 
                                    className={styles.buyBtn}
                                >
                                    Soutenir la campagne
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
