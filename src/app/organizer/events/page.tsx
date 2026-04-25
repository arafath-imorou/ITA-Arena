"use client";

import { useState, useEffect, Suspense } from "react";
import styles from "../Organizer.module.css";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import BackButton from "@/components/BackButton";

function EventsListContent() {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEvents() {
            if (!user) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('organizer_id', user.id)
                .eq('type', 'event')
                .order('created_at', { ascending: false });

            if (data) setEvents(data);
            setLoading(false);
        }
        fetchEvents();
    }, [user]);

    return (
        <div>
            <BackButton variant="dark" />
            <div className={styles.header} style={{ marginTop: '1rem' }}>
                <div>
                    <h1 className={styles.title}>Tous mes Événements</h1>
                    <p className={styles.subtitle}>Liste complète de vos événements créés</p>
                </div>
                <Link href="/organizer/create" className={styles.createBtn}>
                    <span>+</span> Nouvel événement
                </Link>
            </div>

            <div className={styles.eventsList} style={{ background: 'white', padding: '2rem', borderRadius: '12px', marginTop: '2rem', border: '1px solid #eee' }}>
                {loading ? (
                    <p>Chargement...</p>
                ) : events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className={styles.eventRow} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                            <img src={event.image_url || "/placeholder-event.jpg"} alt={event.title} className={styles.eventImage} />
                            <div className={styles.eventData}>
                                <h4 className={styles.eventTitle}>{event.title}</h4>
                                <div className={styles.eventMeta}>
                                    <span>📅 {event.date}</span>
                                    <span>📍 {event.location}</span>
                                </div>
                            </div>
                            <div className={styles.eventActions}>
                                <button className={styles.editBtn}>Modifier</button>
                                <button className={styles.editBtn} style={{ color: '#e53e3e', borderColor: '#fed7d7' }}>Supprimer</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <p>Aucun événement trouvé.</p>
                        <Link href="/organizer/create" className={styles.smallBtn}>Créer mon premier événement</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function OrganizerEventsPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <EventsListContent />
        </Suspense>
    );
}
