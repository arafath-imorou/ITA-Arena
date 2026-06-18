// Version 1.1 - Background Hero Update
import styles from "./About.module.css";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";

export default function AboutPage() {
    return (
        <div className={styles.aboutWrapper}>
            <div className="container" style={{ paddingTop: '2rem', marginBottom: '-4rem', display: 'flex', gap: '10px' }}>
                <BackButton variant="dark" />
                <HomeButton variant="dark" />
            </div>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.title}>À propos de ITA Arena</h1>
                    <p className={styles.subtitle}>La révolution digitale de l'événementiel en Afrique.</p>
                </div>
            </section>

            <div className="container">
                <div className={styles.content}>
                    {/* Qui sommes-nous */}
                    <section className={styles.section}>
                        <div className={styles.headerRow}>
                            <h2 className={styles.sectionTitle}>Qui sommes-nous ?</h2>
                        </div>
                        <div className={styles.textBlock}>
                            <p>
                                <strong>ITA ARENA</strong> est une plateforme digitale tout-en-un dédiée à la gestion d'événements, de communautés et de campagnes d'engagement.
                            </p>
                            <p>
                                Nous aidons les organisateurs, associations, entreprises, écoles et institutions à créer, gérer et développer leurs initiatives grâce à des outils modernes : billetterie, inscriptions, votes, collectes, campagnes de soutien et gestion des participants.
                            </p>
                            <div className={styles.missionBox}>
                                <p>Notre mission est de simplifier l'organisation, renforcer l'engagement des communautés et offrir une expérience digitale fluide à chaque utilisateur.</p>
                            </div>
                            <h3>Notre engagement</h3>
                            <p>
                                Créer un écosystème numérique complet permettant de mobiliser, connecter et gérer efficacement des communautés autour d'événements, projets et causes.
                            </p>
                            <p>
                                ITA ARENA est bien plus qu'une plateforme : c'est un partenaire technologique au service de vos ambitions.
                            </p>
                        </div>
                    </section>

                    {/* Vision */}
                    <section className={styles.section}>
                        <div className={styles.headerRow}>
                            <h2 className={styles.sectionTitle}>Notre vision</h2>
                        </div>
                        <div className={styles.textBlock}>
                            <p>
                                Chez ITA ARENA, nous croyons que chaque événement, chaque communauté et chaque projet mérite des outils simples, performants et accessibles.
                            </p>
                            <p>Nous aspirons à devenir :</p>
                            <ul className={styles.visionList}>
                                <li><span>—</span> La plateforme de référence pour la gestion d'événements et de communautés en Afrique</li>
                                <li><span>—</span> Un écosystème numérique réunissant billetterie, inscriptions, votes, collectes et engagement communautaire</li>
                                <li><span>—</span> Une solution innovante adaptée aux réalités africaines</li>
                                <li><span>—</span> Un moteur de transformation digitale pour les organisateurs, associations, institutions et entreprises</li>
                            </ul>
                            <p>
                                Notre vision est de contribuer activement à la modernisation de l'événementiel et de l'engagement citoyen à travers l'Afrique.
                            </p>
                        </div>
                    </section>

                    {/* Ce que nous apportons */}
                    <section className={styles.section}>
                        <div className={styles.headerRow}>
                            <h2 className={styles.sectionTitle}>Ce que nous apportons</h2>
                        </div>
                        <div className={styles.featureGrid}>
                            <div className={styles.featureCard}>
                                <h3>🎟️ Gestion d'événements simplifiée</h3>
                                <p>Créez, publiez et gérez vos événements en toute simplicité grâce à une plateforme intuitive et professionnelle.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <h3>📝 Inscriptions intelligentes</h3>
                                <p>Créez des formulaires personnalisés, collectez les informations des participants et exportez vos données en quelques clics.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <h3>🗳️ Votes & Sondages</h3>
                                <p>Organisez des consultations, concours, élections et sondages avec des résultats fiables et accessibles en temps réel.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <h3>❤️ Collectes & Campagnes de soutien</h3>
                                <p>Mobilisez votre communauté grâce aux collectes de fonds et aux badges de soutien personnalisés.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <h3>📊 Outils de pilotage avancés</h3>
                                <p>Suivez vos performances, gérez vos participants, analysez vos statistiques et prenez de meilleures décisions.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <h3>🔒 Sécurité & Fiabilité</h3>
                                <p>Paiements sécurisés, protection des données, contrôle des accès et outils conçus pour inspirer confiance.</p>
                            </div>
                        </div>
                    </section>

                    {/* Nos Valeurs - New format based on mockup */}
                    <section className={styles.section}>
                        <h2 className={styles.valuesTitle}>NOS VALEURS</h2>
                        <div className={styles.titleDivider}></div>

                        <div className={styles.valuesCardGrid}>
                            <div className={styles.valueCardItem}>
                                <div className={styles.valueIconCircle}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.valueIconSvg}>
                                        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                                        <path d="M9 18h6"></path>
                                        <path d="M10 22h4"></path>
                                    </svg>
                                </div>
                                <h3>Innovation</h3>
                                <p>Nous développons constamment de nouvelles fonctionnalités pour répondre à vos besoins.</p>
                            </div>

                            <div className={styles.valueCardItem}>
                                <div className={styles.valueIconCircle}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.valueIconSvg}>
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                    </svg>
                                </div>
                                <h3>Passion</h3>
                                <p>Nous partageons votre passion pour les événements et les rencontres inoubliables.</p>
                            </div>

                            <div className={styles.valueCardItem}>
                                <div className={styles.valueIconCircle}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.valueIconSvg}>
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                                    </svg>
                                </div>
                                <h3>Confiance</h3>
                                <p>Votre satisfaction et la sécurité de vos données sont nos priorités absolues.</p>
                            </div>

                            <div className={styles.valueCardItem}>
                                <div className={styles.valueIconCircle}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.valueIconSvg}>
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="m9 12 2 2 4-4"></path>
                                    </svg>
                                </div>
                                <h3>Excellence</h3>
                                <p>Nous visons une qualité de service premium et une expérience utilisateur optimale.</p>
                            </div>
                        </div>
                    </section>

                    {/* ITA INNOVATE Section */}
                    <section className={styles.innovateSection}>
                        <div className={styles.innovateBadge}>CONÇU PAR ITA INNOVATE</div>
                        <h2 className={styles.innovateTitle}>Une innovation conçue par ITA INNOVATE</h2>
                        <p>
                            ITA Arena est une plateforme imaginée, conçue et développée par <strong>ITA INNOVATE</strong>, entreprise spécialisée dans la création de solutions digitales innovantes.
                        </p>
                        <div className={styles.innovateGrid}>
                            <div className={styles.innovateItem}>✔️ Technologie robuste</div>
                            <div className={styles.innovateItem}>✔️ Expérience moderne</div>
                            <div className={styles.innovateItem}>✔️ Plateforme évolutive</div>
                            <div className={styles.innovateItem}>✔️ Amélioration continue</div>
                        </div>
                    </section>

                    {/* Final Call */}
                    <div className={styles.finalCta}>
                        <h3>Rejoignez l'arène</h3>
                        <p>Que vous soyez organisateur ou participant, ITA Arena vous ouvre les portes des plus grands événements.</p>
                        <div className={styles.finalSlogan}>Entrez dans l’arène. Vivez l’expérience.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
