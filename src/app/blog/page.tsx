"use client";

import { useState, useEffect } from "react";
import styles from "./Blog.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const SUPER_ADMIN_EMAILS = ['groupita25@gmail.com', 'admin@itaarena.com'];

export default function BlogPage() {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form states
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("");
    const [summary, setSummary] = useState("");
    const [content, setContent] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchNews();
        checkAdmin();
    }, []);

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

    async function checkAdmin() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const email = (user.email || "").toLowerCase();
            if (SUPER_ADMIN_EMAILS.includes(email)) {
                setIsAdmin(true);
                return;
            }
            // Check role in profiles
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            if (profile?.role === 'super_admin') {
                setIsAdmin(true);
            }
        } catch(e) {
            console.error(e);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content || !imageFile) {
            alert("Veuillez remplir les champs obligatoires (Titre, Image, Contenu).");
            return;
        }

        setIsSaving(true);
        try {
            // Upload Image
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `blog_${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `news/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('event-images')
                .upload(filePath, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('event-images')
                .getPublicUrl(filePath);

            // Insert News
            const newArticle = {
                title,
                category: category || 'Actualité',
                summary,
                content,
                image: publicUrl,
                date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            };

            const res = await fetch('/api/admin/news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newArticle)
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Erreur API');

            alert("Actualité publiée avec succès !");
            setShowModal(false);
            // Reset form
            setTitle("");
            setCategory("");
            setSummary("");
            setContent("");
            setImageFile(null);
            
            // Refresh
            fetchNews();

        } catch (err: any) {
            console.error(err);
            alert("Erreur lors de la publication : " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: any) => {
        e.preventDefault();
        if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
        
        try {
            const res = await fetch(`/api/admin/news?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.error || 'Erreur API');
            
            fetchNews();
        } catch(err: any) {
            alert("Erreur : " + err.message);
        }
    };

    return (
        <div className={styles.blogWrapper}>
            
            <header className={styles.header}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 className={styles.title}>LE BLOG ITA ARENA</h1>
                            <div className={styles.titleUnderline}></div>
                        </div>
                        {isAdmin && (
                            <button 
                                onClick={() => setShowModal(true)}
                                style={{
                                    background: '#ff5a1f',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.8rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                + Créer une actualité
                            </button>
                        )}
                    </div>
                    <p className={styles.subtitle} style={{ marginTop: '1rem' }}>
                        Découvrez les dernières actualités, les événements marquants de nos organisateurs et les nouveautés de la plateforme ITA Arena.
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
                                        src={item.image?.startsWith('assets') ? `/${item.image}` : item.image} 
                                        alt={item.title} 
                                        className={styles.blogImage} 
                                    />
                                    <span className={styles.categoryTag}>{item.category || "Actualité"}</span>
                                    {isAdmin && (
                                        <button 
                                            onClick={(e) => handleDelete(e, item.id)}
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                left: '10px',
                                                background: 'rgba(220, 38, 38, 0.9)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '5px 10px',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                zIndex: 10
                                            }}
                                        >
                                            Supprimer
                                        </button>
                                    )}
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
                        <div className={styles.emptyIcon}>📰</div>
                        <h2>Le blog est calme pour le moment</h2>
                        <p>Revenez bientôt pour de nouvelles actualités !</p>
                    </div>
                )}
            </main>

            {/* Admin Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '2rem',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h2 style={{ marginBottom: '1.5rem', color: '#0a2e73' }}>Publier une actualité</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Titre *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Catégorie</label>
                                <input type="text" placeholder="Ex: Événement, Nouveauté..." value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Résumé</label>
                                <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Image d'illustration *</label>
                                <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)} required style={{ width: '100%', padding: '0.8rem' }} />
                            </div>
                            <div>
                                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Contenu de l'article (HTML autorisé) *</label>
                                <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} required style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', fontFamily: 'monospace' }} placeholder="<p>Votre texte ici...</p>" />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '0.8rem 1.5rem', background: '#e2e8f0', color: '#475569', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Annuler
                                </button>
                                <button type="submit" disabled={isSaving} style={{ padding: '0.8rem 1.5rem', background: '#ff5a1f', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold', opacity: isSaving ? 0.7 : 1 }}>
                                    {isSaving ? "Publication..." : "Publier"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
