import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import styles from './Profile.module.css';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }: { params: { id: string } }) {
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();
    
    if (!profile) return { title: 'Profil introuvable' };
    
    return {
        title: `${profile.company_name || profile.full_name || 'Organisateur'} | ITA Arena`,
        description: `Découvrez les événements de ${profile.company_name || profile.full_name || 'cet organisateur'}.`
    };
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
    // Fetch profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

    if (!profile) {
        notFound();
    }

    // Fetch active events for this organizer
    const { data: events } = await supabase
        .from('events_with_stats')
        .select('*')
        .eq('organizer_id', params.id)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className="container" style={{ paddingTop: '2rem' }}>
                    <BackButton variant="light" fallbackUrl="/" />
                    <div className={styles.profileHeader}>
                        <div className={styles.avatar}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {(profile.company_name || profile.full_name || 'O').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className={styles.profileInfo}>
                            <h1>{profile.company_name || profile.full_name || 'Organisateur'}</h1>
                            <p className={styles.role}>Organisateur certifié</p>
                            {profile.city && profile.country && (
                                <p className={styles.location}>📍 {profile.city}, {profile.country}</p>
                            )}
                            {profile.business_sector && (
                                <p className={styles.sector}>Secteur: {profile.business_sector}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '3rem 0', minHeight: '40vh' }}>
                <h2 className={styles.sectionTitle}>Événements de cet organisateur ({events?.length || 0})</h2>
                
                {events && events.length > 0 ? (
                    <div className={styles.eventsGrid}>
                        {events.map((evt: any) => (
                            <Link href={`/events/${evt.slug || evt.id}`} key={evt.id} className={styles.eventCard}>
                                <div className={styles.eventImage} style={{ backgroundImage: `url(${evt.image_url || 'https://placehold.co/600x400/F7931E/FFFFFF?text=Evenement'})` }}>
                                    <span className={styles.badge}>{evt.category_id}</span>
                                </div>
                                <div className={styles.eventContent}>
                                    <h3>{evt.title}</h3>
                                    <p className={styles.date}>📅 {evt.date}</p>
                                    <p className={styles.location}>📍 {evt.location || 'En ligne'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <p>Cet organisateur n'a pas d'événement actif pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
