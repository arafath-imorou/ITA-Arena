"use client";

import styles from "./Tickets.module.css";
import { useState } from "react";

const TICKET_CATEGORIES = [
    { id: 'upcoming', label: 'Mes tickets en cours', icon: '🎟️', count: 0 },
    { id: 'unfinished', label: 'Mes commandes non terminées', icon: '🛒', count: 0 },
    { id: 'transferred', label: 'Mes tickets transférés', icon: '🔄', count: 0 },
    { id: 'cancelled', label: 'Mes tickets annulés', icon: '❌', count: 0 },
    { id: 'past', label: 'Mes tickets passés', icon: '⌛', count: 0 },
];

export default function TicketsPage() {
    const [activeTab, setActiveTab] = useState('upcoming');

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>Mes Tickets</h1>
                <p>Gérez vos réservations et vos accès aux événements.</p>
            </div>

            <div className={styles.tabsGrid}>
                {TICKET_CATEGORIES.map((cat) => (
                    <button 
                        key={cat.id} 
                        className={`${styles.tabCard} ${activeTab === cat.id ? styles.activeTabCard : ''}`}
                        onClick={() => setActiveTab(cat.id)}
                    >
                        <span className={styles.tabIcon}>{cat.icon}</span>
                        <div className={styles.tabInfo}>
                            <span className={styles.tabLabel}>{cat.label}</span>
                            <span className={styles.tabCount}>{cat.count} ticket(s)</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className={styles.contentArea}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🎫</div>
                    <h3>Aucun ticket trouvé</h3>
                    <p>Vous n'avez pas encore de tickets dans la catégorie "{TICKET_CATEGORIES.find(c => c.id === activeTab)?.label}".</p>
                    <button className={styles.browseBtn} onClick={() => window.location.href = '/'}>
                        Découvrir des événements
                    </button>
                </div>
            </div>
        </div>
    );
}
