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
                answer: "ITA Arena est une plateforme digitale complète qui permet aux organisateurs de créer et gérer des événements (billetterie), d'organiser des concours (votes), de lancer des campagnes de soutien, de créer des formulaires d'inscription et de gérer des cotisations."
            },
            {
                question: "Pourquoi choisir ITA Arena ?",
                answer: "Nous offrons une interface intuitive, des paiements sécurisés (notamment le paiement Mobile Money direct en 1 clic), et des outils de gestion en temps réel (statistiques, génération de PDF) pour simplifier au maximum la vie des organisateurs et des participants."
            }
        ]
    },
    {
        category: "Billetterie & Événements",
        items: [
            {
                question: "Combien de temps faut-il pour créer une billetterie ?",
                answer: "La création d'un événement sur ITA Arena est très rapide. En moins de 15 minutes, vous pouvez configurer vos tarifs (VIP, Standard, etc.), ajouter vos visuels et publier votre billetterie en ligne."
            },
            {
                question: "Puis-je gérer des tickets physiques ?",
                answer: "Oui ! Depuis votre tableau de bord, vous pouvez générer des tickets physiques, les personnaliser selon la catégorie (couleurs, prix), et télécharger un document PDF prêt à être imprimé (format A4 avec 3 tickets par page)."
            },
            {
                question: "Puis-je suivre mes ventes en temps réel ?",
                answer: "Absolument. Chaque organisateur dispose d'un tableau de bord dédié avec des statistiques en temps réel sur les ventes de billets et le chiffre d'affaires généré."
            }
        ]
    },
    {
        category: "Votes & Concours",
        items: [
            {
                question: "Puis-je organiser des votes en ligne (ex: Miss, Awards) ?",
                answer: "Oui, la plateforme dispose d'un système de vote complet. Vous pouvez créer une campagne, ajouter des candidats, et définir le prix d'un vote. Les participants peuvent ensuite voter de manière illimitée via Mobile Money ou carte bancaire."
            },
            {
                question: "Comment les résultats des votes sont-ils affichés ?",
                answer: "Vous disposez d'un tableau de bord organisateur pour suivre chaque vote et le montant collecté. Vous pouvez également activer une page de résultats publique pour que les participants voient le classement en temps réel."
            }
        ]
    },
    {
        category: "Formulaires, Soutiens & Cotisations",
        items: [
            {
                question: "Puis-je créer un formulaire d'inscription personnalisé ?",
                answer: "Oui, vous pouvez créer des formulaires sur-mesure (questions texte, choix multiples, dates, etc.) et partager un lien public pour récolter les réponses de vos utilisateurs."
            },
            {
                question: "Qu'est-ce qu'une campagne de soutien ?",
                answer: "C'est une fonctionnalité qui vous permet de collecter des fonds (cagnotte) pour un projet personnel, caritatif ou d'entreprise, en recevant des dons via Mobile Money ou carte bancaire."
            }
        ]
    },
    {
        category: "Paiements & Reversements",
        items: [
            {
                question: "Quels sont les modes de paiement supportés ?",
                answer: "Nous intégrons FedaPay pour supporter les paiements par Mobile Money (MTN, Moov, Celtiis, etc.) directement via un prompt USSD sur le téléphone du client, ainsi que les paiements par Carte Bancaire."
            },
            {
                question: "Quels sont les frais pour les organisateurs ?",
                answer: "L'utilisation de la plateforme de base est souvent gratuite, seuls les frais de transaction bancaire ou Mobile Money standards sont appliqués sur les paiements."
            },
            {
                question: "Comment sont reversés les fonds collectés ?",
                answer: "Les fonds collectés (billetterie, votes, soutiens) vous sont reversés selon les modalités convenues avec notre équipe, généralement par transfert Mobile Money ou virement bancaire une fois la campagne clôturée."
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
                                        <span className={styles.icon}>{activeIndex === id ? "-" : "+"}</span>
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
