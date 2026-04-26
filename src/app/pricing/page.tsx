"use client";

import styles from "./Pricing.module.css";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import HomeButton from "@/components/HomeButton";

export default function PricingPage() {
    return (
        <div className={styles.pricingWrapper}>
            <div className="container" style={{ paddingTop: '2rem', marginBottom: '-4rem', display: 'flex', gap: '10px' }}>
                <BackButton variant="dark" />
                <HomeButton variant="dark" />
            </div>
            {/* Header Section */}
            <header className={styles.header}>
                <div className="container">
                    <h1 className={styles.title}>TARIFS</h1>
                    <div className={styles.titleUnderline}></div>
                    <p className={styles.subtitle}>
                        On est comme vous : on croit en votre succès ! C'est pourquoi publier un événement sur <strong>ITA Arena</strong> est <strong>100% gratuit</strong>.
                    </p>
                </div>
            </header>

            {/* Main Pricing Section */}
            <section className={styles.mainPricing}>
                <div className="container">
                    <div className={styles.pricingGrid}>
                        <div className={styles.pricingInfo}>
                            <h2 className={styles.sectionTitle}>
                                Vendez vos tickets <span className={styles.highlight}>PARTOUT</span>
                            </h2>
                            <div className={styles.priceHighlight}>
                                10% - uniquement sur les tickets vendus.
                            </div>
                            <p className={styles.priceDesc}>
                                Pas de frais fixes, pas de surprises. Vous payez seulement si vous vendez.
                            </p>
                            <p className={styles.distribText}>
                                Diffusez vos tickets 24h/24 : <strong>marketplace, appli, WhatsApp</strong> et <strong>points de vente partenaires</strong>.
                            </p>
                            <div className={styles.customTarif}>
                                Besoin d'un tarif sur-mesure ? <em>Parlons-en !</em>
                            </div>
                            <button className={styles.waBtn}>
                                <span className={styles.waIcon}>💬</span> Parler à un conseiller
                            </button>
                        </div>
                        <div className={styles.pricingBox}>
                            <div className={styles.bigPercent}>10%</div>
                            <p>Et puis c'est tout !</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Grid 1 */}
            <section className={styles.servicesGrid}>
                <div className="container">
                    <div className={styles.grid}>
                        <ServiceCard emoji="🛒" title="Ventes en ligne" />
                        <ServiceCard emoji="🏪" title="Vente en point de vente" />
                        <ServiceCard emoji="📞" title="Vente par appel / WhatsApp" />
                        <ServiceCard emoji="🖨️" title="Impression de tickets" />
                    </div>
                </div>
            </section>

            {/* Super Powers Section */}
            <section className={styles.superPowers}>
                <div className="container">
                    <div className={styles.powersLayout}>
                        <div className={styles.powersGrid}>
                            <PowerCard emoji="🎁" title="Tickets invitation" />
                            <PowerCard emoji="🔢" title="Validateur" />
                            <PowerCard emoji="✉️" title="Campagne emailing" />
                            <PowerCard emoji="💬" title="Campagne SMS" />
                            <PowerCard emoji="📢" title="Sponsorisation réseaux sociaux" />
                            <PowerCard emoji="📣" title="Communication" />
                            <PowerCard emoji="🏷️" title="Promotions" />
                            <PowerCard emoji="✂️" title="Codes de réduction" />
                        </div>
                        <div className={styles.powersText}>
                            <h2 className={styles.powersTitle}>NOS SUPER-POUVOIRS</h2>
                            <div className={styles.titleUnderlineSmall}></div>
                            <p>Un concentré de fonctionnalités puissantes pour propulser vos événements.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className={styles.trustSection}>
                <div className="container">
                    <h2 className={styles.centerTitle}>ILS NOUS ONT FAIT CONFIANCE</h2>
                    <div className={styles.logoGrid}>
                        <div className={styles.eventPoster}><img src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=300" alt="Event" /></div>
                        <div className={styles.eventPoster}><img src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=300" alt="Event" /></div>
                        <div className={styles.eventPoster}><img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=300" alt="Event" /></div>
                        <div className={styles.eventPoster}><img src="https://images.unsplash.com/photo-1514525253361-bee871871771?auto=format&fit=crop&q=80&w=300" alt="Event" /></div>
                    </div>
                </div>
            </section>

            {/* Steps Section */}
            <section className={styles.stepsSection}>
                <div className="container">
                    <h2 className={styles.centerTitle}>Créez et vendez vos tickets en 4 étapes</h2>
                    <div className={styles.titleUnderlineCenter}></div>
                    <p className={styles.centerSub}>Publiez <strong>gratuitement</strong> votre événement sur <strong>ITA Arena</strong> et générez vos premières ventes en quelques clics.</p>

                    <div className={styles.stepsGrid}>
                        <div className={styles.step}>
                            <h4>1. Renseignez les informations</h4>
                            <p>Titre, date, lieu, images, types de tickets, sponsors, infoline... Tout ce qu'il faut pour bien présenter votre événement.</p>
                        </div>
                        <div className={styles.step}>
                            <h4>2. Publiez votre événement</h4>
                            <p>En un clic, mettez votre événement en ligne. Vos tickets deviennent disponibles à l'achat immédiatement.</p>
                        </div>
                        <div className={styles.step}>
                            <h4>3. Gérez et validez</h4>
                            <p>Le jour J, scannez les tickets avec notre appli. Gagnez du temps à l'entrée et évitez les fraudes.</p>
                        </div>
                        <div className={styles.step}>
                            <h4>4. Recevez vos paiements</h4>
                            <p>Chaque lundi à partir de 30 jours avant l'événement, nous vous versons vos recettes directement.</p>
                        </div>
                    </div>

                    <div className={styles.ctaWrapper}>
                        <Link href="/organizer/create" className={styles.mainCta}>
                            ORGANISER UN ÉVÉNEMENT »
                        </Link>
                    </div>
                </div>
            </section>

            {/* Why Us Section */}
            <section className={styles.whyUs}>
                <div className="container">
                    <h2 className={styles.centerTitle}>Pourquoi choisir <span className={styles.highlight}>ITA Arena</span> ?</h2>
                    <div className={styles.titleUnderlineCenter}></div>
                    <p className={styles.centerSub}>Plus qu'une billetterie : une solution de vente puissante, simple et taillée pour les organisateurs exigeants.</p>

                    <div className={styles.whyGrid}>
                        <WhyBox emoji="🌐" title="Vendez partout" desc="Notre place de marché est active 24h/24 avec une présence en ligne, mobile, WhatsApp, et en points de vente physiques." />
                        <WhyBox emoji="📄" title="Zéro paperasse" desc="Fini les impressions inutiles. Créez vos tickets, vos stats, votre communication... tout est digital, tout est fluide." />
                        <WhyBox emoji="🚀" title="Simple et rapide" desc="Créez un événement en quelques minutes. Interface intuitive, support réactif, outils puissants." />
                        <WhyBox emoji="🤝" title="Accompagnement humain" desc="Notre équipe vous guide à chaque étape. Vous n'êtes jamais seul face à votre événement." />
                    </div>
                </div>
            </section>
        </div>
    );
}

function ServiceCard({ emoji, title }: { emoji: string, title: string }) {
    return (
        <div className={styles.card}>
            <span className={styles.cardEmoji}>{emoji}</span>
            <h3>{title}</h3>
            <span className={styles.learnMore}>En savoir +</span>
        </div>
    );
}

function PowerCard({ emoji, title }: { emoji: string, title: string }) {
    return (
        <div className={styles.powerCard}>
            <span className={styles.powerEmoji}>{emoji}</span>
            <div className={styles.powerMeta}>
                <h3>{title}</h3>
                <span className={styles.learnMore}>En savoir +</span>
            </div>
        </div>
    );
}

function WhyBox({ emoji, title, desc }: { emoji: string, title: string, desc: string }) {
    return (
        <div className={styles.whyBox}>
            <div className={styles.whyHeader}>
                <span className={styles.whyEmoji}>{emoji}</span>
                <h3>{title}</h3>
            </div>
            <p>{desc}</p>
        </div>
    );
}
