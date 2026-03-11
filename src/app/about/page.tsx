import styles from "./About.module.css";

export default function AboutPage() {
    return (
        <div className={styles.aboutWrapper}>
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
                            <span className={styles.label}>🌍 MISSION</span>
                            <h2 className={styles.sectionTitle}>Qui sommes-nous ?</h2>
                        </div>
                        <div className={styles.textBlock}>
                            <p>
                                <strong>ITA Arena</strong> est une plateforme digitale de billetterie nouvelle génération conçue pour moderniser l’organisation et l’accès aux événements en Afrique.
                            </p>
                            <p>
                                Nous permettons aux organisateurs de vendre leurs billets en ligne simplement et au public de réserver leurs places en quelques clics, de manière rapide, sécurisée et intuitive.
                            </p>
                            <div className={styles.missionBox}>
                                <span className={styles.targetIcon}>🎯</span>
                                <p>Faciliter l’accès aux événements grâce à une expérience digitale moderne, fiable et professionnelle.</p>
                            </div>
                            <p>
                                ITA Arena ne se limite pas à la vente de billets — nous créons une véritable passerelle numérique entre les organisateurs et leur public.
                            </p>
                        </div>
                    </section>

                    {/* Vision */}
                    <section className={styles.section}>
                        <div className={styles.headerRow}>
                            <span className={styles.label}>🚀 AMBITION</span>
                            <h2 className={styles.sectionTitle}>Notre vision</h2>
                        </div>
                        <div className={styles.textBlock}>
                            <p>
                                Chez ITA Arena, nous croyons que chaque événement mérite une organisation à la hauteur de son ambition.
                            </p>
                            <p>Nous aspirons à devenir :</p>
                            <ul className={styles.visionList}>
                                <li><span>✨</span> La plateforme de référence de la billetterie digitale en Afrique</li>
                                <li><span>🌍</span> Un pont technologique entre créateurs d’événements et participants</li>
                                <li><span>📱</span> Une solution innovante adaptée aux réalités locales</li>
                                <li><span>🎫</span> Un standard moderne pour l’événementiel culturel, professionnel et grand public</li>
                            </ul>
                            <p>
                                Notre vision est de contribuer activement à la transformation digitale du secteur événementiel africain.
                            </p>
                        </div>
                    </section>

                    {/* Ce que nous apportons */}
                    <section className={styles.section}>
                        <div className={styles.headerRow}>
                            <span className={styles.label}>💡 SOLUTIONS</span>
                            <h2 className={styles.sectionTitle}>Ce que nous apportons</h2>
                        </div>
                        <div className={styles.featureGrid}>
                            <div className={styles.featureCard}>
                                <span className={styles.featureEmoji}>🎟️</span>
                                <h3>Billetterie simplifiée</h3>
                                <p>Réservez vos billets en ligne sans files d’attente ni déplacements inutiles.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <span className={styles.featureEmoji}>🔐</span>
                                <h3>Paiements sécurisés</h3>
                                <p>Profitez de transactions fiables grâce à l’intégration des solutions Mobile Money et des paiements par carte bancaire.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <span className={styles.featureEmoji}>📲</span>
                                <h3>Billets intelligents</h3>
                                <p>Chaque billet inclut un QR Code unique permettant un accès rapide et sécurisé aux événements.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <span className={styles.featureEmoji}>🏢</span>
                                <h3>Outils professionnels</h3>
                                <p>Suivi des ventes en temps réel, statistiques détaillées, gestion des participants et contrôle d'accès.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <span className={styles.featureEmoji}>🌍</span>
                                <h3>Adapté au marché</h3>
                                <p>Interface optimisée pour mobile et paiements locaux intégrés aux réalités du continent.</p>
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
                        <h3>Rejoignez l'arène 📞</h3>
                        <p>Que vous soyez organisateur ou participant, ITA Arena vous ouvre les portes des plus grands événements.</p>
                        <div className={styles.finalSlogan}>🎟️ Entrez dans l’arène. 🎉 Vivez l’expérience.</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
