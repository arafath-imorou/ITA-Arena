import React from "react";
import Link from "next/link";

export default function TermsPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'var(--font-body, sans-serif)', color: '#334155' }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#ff5a1f', fontWeight: 'bold', display: 'inline-block', marginBottom: '1.5rem' }}>
                ← Retour à l&apos;accueil
            </Link>
            <h1 style={{ fontSize: '2.2rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800 }}>
                Conditions Générales d&apos;Utilisation
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>1. Objet</h2>
                <p>
                    Les présentes Conditions Générales d&apos;Utilisation régissent l&apos;accès et l&apos;utilisation de la plateforme <strong>ITA Arena</strong>. En accédant au service, vous acceptez sans réserve ces conditions.
                </p>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>2. Services proposés</h2>
                <p>
                    ITA Arena est une plateforme technologique dédiée à la billetterie d&apos;événements, à la gestion de campagnes de vote en ligne, aux formulaires d&apos;inscription et aux campagnes de soutien.
                </p>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>3. Achats et Paiements</h2>
                <p>
                    Les paiements effectués sur la plateforme (achats de billets, votes payants, participations) sont traités de manière sécurisée via nos partenaires de paiement agréés (FedaPay). Toute transaction validée est définitive.
                </p>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>4. Responsabilité des Organisateurs</h2>
                <p>
                    Les organisateurs d&apos;événements et créateurs de campagnes sont seuls responsables du contenu, de l&apos;organisation et de la tenue effective de leurs événements.
                </p>
            </section>
        </div>
    );
}
