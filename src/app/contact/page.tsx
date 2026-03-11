"use client";

import styles from "./Contact.module.css";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "Question sur un événement",
        message: "",
        newsletter: true
    });

    return (
        <div className={styles.contactWrapper}>
            {/* Header */}
            <header className={styles.header}>
                <div className="container">
                    <h1 className={styles.title}>NOUS CONTACTER</h1>
                    <div className={styles.titleUnderline}></div>
                    <p className={styles.subtitle}>
                        <strong>ITA ARENA</strong> vous accompagne à chaque étape. Trouvez la réponse ou contactez-nous directement.
                    </p>
                </div>
            </header>

            {/* Quick FAQ Section */}
            <section className={styles.faqQuick}>
                <div className="container">
                    <div className={styles.faqCard}>
                        <div className={styles.faqContent}>
                            <h2>Besoin d'une réponse rapide ?</h2>
                            <p>Notre centre d'aide regroupe les réponses aux questions les plus fréquentes pour les participants et organisateurs.</p>
                            <Link href="/faq" className={styles.faqBtn}>
                                Accéder à la FAQ <span className={styles.btnIcon}>❓</span>
                            </Link>
                        </div>
                        <div className={styles.faqIllustration}>
                            <img src="/images/faq_illustration.png" alt="FAQ Illustration" />
                        </div>
                    </div>
                </div>
            </section>

            {/* WhatsApp Organizer Section */}
            <section className={styles.whatsappSection}>
                <div className="container">
                    <div className={styles.waContent}>
                        <h2>Organisateur d'événement ?</h2>
                        <p>Parlez directement à un conseiller sur WhatsApp pour un accompagnement personnalisé.</p>
                        <button className={styles.waBtn}>
                            <span className={styles.waIcon}>💬</span> Contacter un conseiller
                        </button>
                    </div>
                </div>
            </section>

            {/* Direct Contact Section */}
            <section className={styles.directContact}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>Nous écrire directement</h2>
                    <div className={styles.titleUnderlineSmall}></div>
                    <p className={styles.sectionSubtitle}>Vous n'avez pas trouvé votre réponse ? Laissez-nous un message, notre équipe vous répondra rapidement.</p>

                    <div className={styles.contactGrid}>
                        {/* Form */}
                        <div className={styles.formContainer}>
                            <h3>Formulaire de contact</h3>
                            <div className={styles.formTitleUnderline}></div>
                            <form className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <input type="text" placeholder="Votre nom *" required />
                                </div>
                                <div className={styles.inputGroup}>
                                    <input type="email" placeholder="Votre e-mail *" required />
                                </div>
                                <div className={styles.phoneInput}>
                                    <div className={styles.flagSelector}>🇧🇯</div>
                                    <input type="tel" placeholder="01 23 45 67 89" />
                                </div>
                                <div className={styles.inputGroup}>
                                    <select defaultValue="Question sur un événement">
                                        <option>Question sur un événement</option>
                                        <option>Problème technique</option>
                                        <option>Paiement et facturation</option>
                                        <option>Partenariat</option>
                                        <option>Autre</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <textarea placeholder="Votre message *" rows={5} required></textarea>
                                </div>
                                <div className={styles.checkboxGroup}>
                                    <input type="checkbox" id="newsletter" defaultChecked />
                                    <label htmlFor="newsletter">S'abonner à la newsletter</label>
                                </div>
                                <p className={styles.privacyNote}>
                                    En envoyant ce message, vous acceptez notre <Link href="/privacy">Politique de confidentialité</Link>.
                                </p>
                                <button type="submit" className={styles.submitBtn}>
                                    Envoyer <span className={styles.sendIcon}>🚀</span>
                                </button>
                            </form>
                        </div>

                        {/* Coordonnées & Map */}
                        <div className={styles.infoContainer}>
                            <div className={styles.coordsCard}>
                                <h3>Nos coordonnées</h3>
                                <div className={styles.formTitleUnderline}></div>
                                <div className={styles.coordsGrid}>
                                    <div className={styles.coordItem}>
                                        <span className={styles.coordIcon}>📍</span>
                                        <div>
                                            <p>Parakou (BENIN)</p>
                                        </div>
                                    </div>
                                    <div className={styles.coordItem}>
                                        <span className={styles.coordIcon}>📞</span>
                                        <p>002290152818100</p>
                                    </div>
                                    <div className={styles.coordItem}>
                                        <span className={styles.coordIcon}>✉️</span>
                                        <p>groupita25@gmail.com</p>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.mapContainer}>
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1462.4!2d2.618667!3d9.376917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zOcKwMjInMzYuOSJOIDLCsDM3JzA3LjIiRQ!5e0!3m2!1sfr!2sbj!4v1710170000000!5m2!1sfr!2sbj"
                                    width="100%"
                                    height="300"
                                    style={{ border: 0, borderRadius: '12px' }}
                                    allowFullScreen={true}
                                    loading="lazy"
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
