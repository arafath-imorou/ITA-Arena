// Version 3.0 - No icons, bigger fonts, justified text
import styles from "./About.module.css";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className={styles.aboutWrapper}>
            {/* Navigation Buttons */}
            <div className={styles.navBar}>
                <BackButton variant="dark" />
                <HomeButton variant="dark" />
            </div>

            {/* ═══ HERO ═══ */}
            <section className={styles.hero}>
                <div className={styles.heroOverlay} />
                <div className={styles.heroContent}>
                    <div className={styles.heroBadge}>
                        <span className={styles.heroBadgeDot} />
                        PLATEFORME ÉVÉNEMENTIELLE — AFRIQUE
                    </div>
                    <h1 className={styles.heroTitle}>
                        Nous donnons vie<br />
                        à <span className={styles.heroAccent}>vos événements</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        ITA Arena est la révolution digitale de l'événementiel.
                        Billetterie, votes, collectes, inscriptions — tout en un seul endroit.
                    </p>
                    <div className={styles.heroActions}>
                        <Link href="/organizer/create-hub" className={styles.heroCta}>
                            Commencer maintenant
                        </Link>
                        <a href="#mission" className={styles.heroCtaOutline}>
                            Découvrir notre mission
                        </a>
                    </div>
                </div>
                <div className={styles.heroScrollIndicator}>
                    <span />
                </div>
            </section>

            {/* ═══ STATS ═══ */}
            <section className={styles.statsSection}>
                <div className={styles.container}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>500<span>+</span></div>
                            <div className={styles.statLabel}>Événements organisés</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>10k<span>+</span></div>
                            <div className={styles.statLabel}>Participants enregistrés</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>50<span>+</span></div>
                            <div className={styles.statLabel}>Organisateurs actifs</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>100%</div>
                            <div className={styles.statLabel}>Paiements sécurisés</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ QUI SOMMES-NOUS ═══ */}
            <section className={styles.missionSection} id="mission">
                <div className={styles.container}>
                    <div className={styles.missionLayout}>
                        <div className={styles.missionLeft}>
                            <div className={styles.sectionLabel}>QUI SOMMES-NOUS ?</div>
                            <h2 className={styles.missionHeading}>
                                Une plateforme pensée <span className={styles.textAccent}>pour l'Afrique</span>
                            </h2>
                            <p className={styles.missionText}>
                                <strong>ITA ARENA</strong> est une plateforme digitale tout-en-un dédiée à la gestion d'événements,
                                de communautés et de campagnes d'engagement.
                            </p>
                            <p className={styles.missionText}>
                                Nous aidons les organisateurs, associations, entreprises, écoles et institutions
                                à créer, gérer et développer leurs initiatives grâce à des outils modernes.
                            </p>
                            <div className={styles.missionHighlight}>
                                <div className={styles.missionHighlightBar} />
                                <p>
                                    Notre mission est de simplifier l'organisation, renforcer l'engagement
                                    des communautés et offrir une expérience digitale fluide à chaque utilisateur.
                                </p>
                            </div>
                        </div>
                        <div className={styles.missionRight}>
                            <div className={styles.missionVisual}>
                                <div className={styles.missionVisualInner}>
                                    <div className={styles.missionVisualLogo}>ITA</div>
                                    <div className={styles.missionVisualSub}>ARENA</div>
                                    <p className={styles.missionVisualText}>Billetterie · Votes · Collectes · Inscriptions</p>
                                    <div className={styles.missionVisualTag}>Plateforme tout-en-un</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ NOTRE VISION ═══ */}
            <section className={styles.visionSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionLabel}>NOTRE VISION</div>
                        <h2 className={styles.sectionHeading}>Là où l'Afrique se connecte</h2>
                        <p className={styles.sectionSubtext}>
                            Nous aspirons à être la référence incontournable de l'événementiel numérique sur le continent africain.
                        </p>
                    </div>
                    <div className={styles.visionGrid}>
                        <div className={styles.visionCard}>
                            <div className={styles.visionCardContent}>
                                <h3>Plateforme de référence</h3>
                                <p>La solution incontournable pour la gestion d'événements et de communautés en Afrique.</p>
                            </div>
                        </div>
                        <div className={styles.visionCard}>
                            <div className={styles.visionCardContent}>
                                <h3>Écosystème complet</h3>
                                <p>Billetterie, inscriptions, votes, collectes et engagement communautaire dans un seul outil.</p>
                            </div>
                        </div>
                        <div className={styles.visionCard}>
                            <div className={styles.visionCardContent}>
                                <h3>Solution africaine</h3>
                                <p>Une solution innovante conçue et adaptée aux réalités et aux besoins du continent africain.</p>
                            </div>
                        </div>
                        <div className={styles.visionCard}>
                            <div className={styles.visionCardContent}>
                                <h3>Moteur de transformation</h3>
                                <p>Un catalyseur digital pour les organisateurs, associations, institutions et entreprises.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ CE QUE NOUS APPORTONS ═══ */}
            <section className={styles.featuresSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionLabelLight}>NOS FONCTIONNALITÉS</div>
                        <h2 className={styles.sectionHeadingLight}>Ce que nous apportons</h2>
                        <p className={styles.sectionSubtextLight}>
                            Des outils puissants pour chaque étape de votre événement.
                        </p>
                    </div>
                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureCardNum}>01</div>
                            <h3>Gestion d'événements</h3>
                            <p>Créez, publiez et gérez vos événements en toute simplicité grâce à une plateforme intuitive et professionnelle.</p>
                            <div className={styles.featureCardTag}>Billetterie en ligne</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureCardNum}>02</div>
                            <h3>Inscriptions intelligentes</h3>
                            <p>Formulaires personnalisés, collecte de données participants et export en quelques clics.</p>
                            <div className={styles.featureCardTag}>Export CSV / PDF</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureCardNum}>03</div>
                            <h3>Votes & Sondages</h3>
                            <p>Consultations, concours, élections et sondages avec résultats fiables en temps réel.</p>
                            <div className={styles.featureCardTag}>Temps réel</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureCardNum}>04</div>
                            <h3>Collectes & Campagnes</h3>
                            <p>Mobilisez votre communauté grâce aux collectes de fonds et aux badges de soutien personnalisés.</p>
                            <div className={styles.featureCardTag}>Paiement sécurisé</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureCardNum}>05</div>
                            <h3>Pilotage avancé</h3>
                            <p>Statistiques, gestion des participants, analyses et tableaux de bord complets pour décider mieux.</p>
                            <div className={styles.featureCardTag}>Dashboard analytics</div>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureCardNum}>06</div>
                            <h3>Sécurité & Fiabilité</h3>
                            <p>Paiements sécurisés, protection des données et contrôle des accès conçus pour inspirer confiance.</p>
                            <div className={styles.featureCardTag}>Chiffrement SSL</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ NOS VALEURS ═══ */}
            <section className={styles.valuesSection}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionLabel}>NOS VALEURS</div>
                        <h2 className={styles.sectionHeading}>Ce qui nous guide</h2>
                    </div>
                    <div className={styles.valuesGrid}>
                        <div className={styles.valueCard}>
                            <div className={styles.valueNumber}>01</div>
                            <h3>Innovation</h3>
                            <p>Nous développons constamment de nouvelles fonctionnalités pour anticiper et répondre à vos besoins.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueNumber}>02</div>
                            <h3>Passion</h3>
                            <p>Nous partageons votre passion pour les événements et les rencontres inoubliables qui rassemblent.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueNumber}>03</div>
                            <h3>Confiance</h3>
                            <p>La satisfaction et la sécurité de vos données sont nos priorités absolues à chaque instant.</p>
                        </div>
                        <div className={styles.valueCard}>
                            <div className={styles.valueNumber}>04</div>
                            <h3>Excellence</h3>
                            <p>Nous visons un service premium et une expérience utilisateur optimale à chaque utilisation.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ ITA INNOVATE ═══ */}
            <section className={styles.innovateSection}>
                <div className={styles.container}>
                    <div className={styles.innovateLayout}>
                        <div className={styles.innovateLeft}>
                            <div className={styles.innovateBadge}>CONÇU PAR ITA INNOVATE</div>
                            <h2 className={styles.innovateTitle}>
                                Une innovation africaine,<br />pour l'Afrique
                            </h2>
                            <p className={styles.innovateText}>
                                ITA Arena est imaginée, conçue et développée par <strong>ITA INNOVATE</strong>,
                                entreprise spécialisée dans la création de solutions digitales innovantes adaptées aux marchés africains.
                            </p>
                            <p className={styles.innovateText}>
                                ITA ARENA est bien plus qu'une plateforme : c'est un partenaire technologique au service de vos ambitions.
                            </p>
                        </div>
                        <div className={styles.innovateRight}>
                            <div className={styles.innovateFeature}>
                                <div className={styles.innovateCheck}>✓</div>
                                <div>
                                    <strong>Technologie robuste</strong>
                                    <p>Infrastructure cloud scalable et performante</p>
                                </div>
                            </div>
                            <div className={styles.innovateFeature}>
                                <div className={styles.innovateCheck}>✓</div>
                                <div>
                                    <strong>Expérience moderne</strong>
                                    <p>Interface intuitive et design premium</p>
                                </div>
                            </div>
                            <div className={styles.innovateFeature}>
                                <div className={styles.innovateCheck}>✓</div>
                                <div>
                                    <strong>Plateforme évolutive</strong>
                                    <p>Fonctionnalités enrichies en continu</p>
                                </div>
                            </div>
                            <div className={styles.innovateFeature}>
                                <div className={styles.innovateCheck}>✓</div>
                                <div>
                                    <strong>Amélioration continue</strong>
                                    <p>Basé sur les retours de nos utilisateurs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ CTA FINAL ═══ */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaGlow} />
                <div className={styles.container}>
                    <div className={styles.ctaContent}>
                        <div className={styles.ctaBadge}>REJOIGNEZ L'ARÈNE</div>
                        <h2 className={styles.ctaTitle}>
                            Entrez dans l'arène.<br />
                            <span>Vivez l'expérience.</span>
                        </h2>
                        <p className={styles.ctaText}>
                            Que vous soyez organisateur ou participant, ITA Arena vous ouvre les portes
                            des plus grands événements. Commencez gratuitement dès aujourd'hui.
                        </p>
                        <div className={styles.ctaButtons}>
                            <Link href="/organizer/create-hub" className={styles.ctaBtn}>
                                Créer un événement
                            </Link>
                            <Link href="/events" className={styles.ctaBtnOutline}>
                                Explorer les événements
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
