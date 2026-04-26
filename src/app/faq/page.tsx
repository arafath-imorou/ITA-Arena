"use client";

import { useState } from "react";
import styles from "./FAQ.module.css";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";

const FAQ_DATA = [
    {
        category: "Général",
        items: [
            {
                question: "Qu'est-ce qu'ITA Arena ?",
                answer: "ITA Arena est une plateforme de billetterie et d'organisation d'événements en ligne qui permet aux organisateurs de créer des événements et de vendre des tickets, et aux participants de découvrir et d'acheter des places pour des événements variés."
            },
            {
                question: "Pourquoi utiliser ITA Arena ?",
                answer: "Nous offrons une interface intuitive, des paiements sécurisés et des outils de gestion en temps réel pour les organisateurs, tout en simplifiant l'accès aux événements pour les utilisateurs."
            }
        ]
    },
    {
        category: "Organisateurs",
        items: [
            {
                question: "Combien de temps faut-il pour créer une billetterie ?",
                answer: "La création d'un événement sur ITA Arena est rapide. En moins de 15 minutes, vous pouvez configurer vos tarifs, ajouter vos visuels et publier votre billetterie."
            },
            {
                question: "Quels types d'événements puis-je organiser ?",
                answer: "Vous pouvez organiser tout type d'événement : concerts, conférences, événements sportifs, formations, festivals, et même des cotisations pour des voyages ou des projets d'entreprise."
            },
            {
                question: "Puis-je suivre mes ventes en temps réel ?",
                answer: "Oui, chaque organisateur dispose d'un tableau de bord dédié permettant de suivre les ventes de billets, le chiffre d'affaires et la portée de ses événements en temps réel."
            }
        ]
    },
    {
        category: "Billets et Paiements",
        items: [
            {
                question: "Quels sont les frais pour les organisateurs ?",
                answer: "ITA Arena propose des options flexibles. Pour de nombreux événements, l'utilisation de la plateforme est gratuite et les seuls frais applicables sont les frais de transaction bancaire standards."
            },
            {
                question: "Comment s'effectuent les paiements ?",
                answer: "Les paiements sont effectués via des passerelles sécurisées (comme Mobile Money ou cartes bancaires). Les fonds sont ensuite reversés aux organisateurs selon les modalités convenues."
            },
            {
                question: "Puis-je personnaliser mes billets ?",
                answer: "Tout à fait ! Vous pouvez ajouter votre logo et personnaliser les informations présentes sur les e-tickets envoyés aux participants."
            }
        ]
    }
];

export default function FAQPage() {
    const [activeIndex, setActiveIndex] = useState<string | null>(null);

    const toggleAccordion = (id: string) => {
        setActiveIndex(activeIndex === id ? null : id);
    };

    return (
        <div className={styles.faqWrapper}>
            <div className="container" style={{ paddingTop: '2rem', marginBottom: '-2rem', display: 'flex', gap: '10px' }}>
                <BackButton variant="dark" />
                <HomeButton variant="dark" />
            </div>
            <div className={styles.faqContainer}>
            <h1 className={styles.title}>FAQ</h1>
            <p className={styles.subtitle}>Retrouvez ici les réponses aux questions les plus fréquentes.</p>

            {FAQ_DATA.map((section, sectionIdx) => (
                <div key={sectionIdx} className={styles.faqSection}>
                    <h2 className={styles.sectionTitle}>{section.category}</h2>
                    <div className={styles.faqList}>
                        {section.items.map((item, itemIdx) => {
                            const id = `${sectionIdx}-${itemIdx}`;
                            return (
                                <div
                                    key={itemIdx}
                                    className={`${styles.faqItem} ${activeIndex === id ? styles.active : ""}`}
                                >
                                    <button
                                        className={styles.question}
                                        onClick={() => toggleAccordion(id)}
                                    >
                                        {item.question}
                                        <span className={styles.icon}>▼</span>
                                    </button>
                                    <div className={styles.answer}>
                                        <p>{item.answer}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
        </div>
    );
}
