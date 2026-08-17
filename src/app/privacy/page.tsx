import React from "react";
import Link from "next/link";

export default function PrivacyPolicyPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'var(--font-body, sans-serif)', color: '#334155' }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#ff5a1f', fontWeight: 'bold', display: 'inline-block', marginBottom: '1.5rem' }}>
                ← Retour à l&apos;accueil
            </Link>
            <h1 style={{ fontSize: '2.2rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800 }}>
                Politique de Confidentialité
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>1. Collecte des informations</h2>
                <p>
                    Dans le cadre de l&apos;utilisation de la plateforme <strong>ITA Arena</strong>, nous collectons les données strictement nécessaires au bon déroulement de vos réservations de billets, inscriptions et votes en ligne (nom, adresse email, numéro de téléphone).
                </p>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>2. Utilisation des données</h2>
                <p>
                    Vos informations sont utilisées exclusivement pour :
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li>La génération et la validation de vos billets d&apos;événements et badges.</li>
                    <li>La prise en compte sécurisée de vos votes et participations.</li>
                    <li>La transmission des confirmations de paiement et des reçus.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>3. Protection et Sécurité</h2>
                <p>
                    ITA Arena met en œuvre des mesures de sécurité techniques et organisationnelles renforcées pour protéger vos données personnelles contre tout accès non autorisé ou toute modification.
                </p>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>4. Vos Droits</h2>
                <p>
                    Conformément aux réglementations en vigueur, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment en nous contactant via notre page de <Link href="/contact" style={{ color: '#ff5a1f', textDecoration: 'underline' }}>contact</Link>.
                </p>
            </section>
        </div>
    );
}
