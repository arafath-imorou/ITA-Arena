"use client";

import styles from './Solutions.module.css';

export default function Solutions() {
    const solutions = [
        {
            title: "Billetterie",
            icon: "🎟️",
            description: "Vendez vos billets en ligne pour vos événements et spectacles en toute simplicité.",
            color: "#e0e7ff",
            textColor: "#3730a3"
        },
        {
            title: "Inscriptions",
            icon: "📝",
            description: "Gérez les formulaires d'inscriptions pour vos formations, ateliers et concours.",
            color: "#dcfce7",
            textColor: "#166534"
        },
        {
            title: "Badges de soutien",
            icon: "❤️",
            description: "Créez des campagnes de soutien interactives pour financer vos projets.",
            color: "#ffe4e6",
            textColor: "#be123c"
        },
        {
            title: "Votes & Sondages",
            icon: "🗳️",
            description: "Organisez des élections, des concours et des sondages avec des paiements en ligne.",
            color: "#fef3c7",
            textColor: "#92400e"
        },
        {
            title: "Collectes",
            icon: "💰",
            description: "Lancez des cagnottes sécurisées pour réunir des fonds pour vos initiatives.",
            color: "#ffedd5",
            textColor: "#9a3412"
        }
    ];

    return (
        <section className={styles.solutionsSection}>
            <div className="container">
                <div className={styles.header}>
                    <h2 className={styles.title}>Nos Solutions</h2>
                    <p className={styles.subtitle}>Tout ce dont vous avez besoin pour vos événements et vos communautés.</p>
                </div>
                
                <div className={styles.grid}>
                    {solutions.map((s, idx) => (
                        <div key={idx} className={styles.card}>
                            <div className={styles.iconWrapper} style={{ backgroundColor: s.color, color: s.textColor }}>
                                {s.icon}
                            </div>
                            <h3 className={styles.cardTitle}>{s.title}</h3>
                            <p className={styles.cardDescription}>{s.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
