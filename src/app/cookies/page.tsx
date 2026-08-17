import React from "react";
import Link from "next/link";

export default function CookiesPage() {
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 1.5rem', fontFamily: 'var(--font-body, sans-serif)', color: '#334155' }}>
            <Link href="/" style={{ textDecoration: 'none', color: '#ff5a1f', fontWeight: 'bold', display: 'inline-block', marginBottom: '1.5rem' }}>
                ← Retour à l&apos;accueil
            </Link>
            <h1 style={{ fontSize: '2.2rem', color: '#0f172a', marginBottom: '1rem', fontWeight: 800 }}>
                Politique relatives aux Cookies
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '2rem' }}>
                Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
                <p>
                    Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite de notre site. Il permet d&apos;assurer le bon fonctionnement de vos sessions de connexion et de mémoriser vos préférences.
                </p>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>2. Cookies utilisés sur ITA Arena</h2>
                <p>
                    Nous utilisons uniquement des cookies strictement nécessaires :
                </p>
                <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
                    <li><strong>Cookies de session Supabase :</strong> Pour maintenir la connexion sécurisée des utilisateurs et organisateurs.</li>
                    <li><strong>Cookies de préférence :</strong> Pour conserver vos choix d&apos;affichage (pays, filtres).</li>
                </ul>
            </section>

            <section style={{ marginBottom: '2rem', lineHeight: 1.7 }}>
                <h2 style={{ fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.8rem' }}>3. Gestion des cookies</h2>
                <p>
                    Vous pouvez désactiver ou supprimer les cookies via les paramètres de votre navigateur. Veuillez noter que la désactivation des cookies essentiels peut perturber l&apos;accès à votre compte organisateur.
                </p>
            </section>
        </div>
    );
}
