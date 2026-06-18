"use client";

import Link from "next/link";
import styles from "./CreateHub.module.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreateHub() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If not logged in, redirect to login with a returnUrl to this page
                router.push(`/login?redirect=/organizer/create-hub`);
            } else {
                setLoading(false);
            }
        };
        checkAuth();
    }, [router]);

    const options = [
        {
            title: "Événement",
            icon: "🎟️",
            description: "Créez une billetterie complète pour votre prochain concert, spectacle ou festival.",
            color: "#e0e7ff",
            textColor: "#3730a3",
            href: "/organizer/create"
        },
        {
            title: "Cotisation",
            icon: "💰",
            description: "Lancez une collecte de fonds ou une cagnotte sécurisée pour votre communauté.",
            color: "#ffedd5",
            textColor: "#9a3412",
            href: "/organizer/cotisation/create"
        },
        {
            title: "Campagne de Soutien",
            icon: "❤️",
            description: "Permettez à votre public d'acheter des badges virtuels pour soutenir votre cause.",
            color: "#ffe4e6",
            textColor: "#be123c",
            href: "/organizer/support-campaign/create"
        },
        {
            title: "Formulaire d'inscription",
            icon: "📝",
            description: "Gérez les inscriptions pour vos ateliers, formations ou concours.",
            color: "#dcfce7",
            textColor: "#166534",
            href: "/organizer/forms/create"
        },
        {
            title: "Vote & Sondage",
            icon: "🗳️",
            description: "Organisez des élections et sondages payants ou gratuits.",
            color: "#fef3c7",
            textColor: "#92400e",
            href: "/organizer/votes/create"
        }
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <p>Chargement...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Que souhaitez-vous créer ?</h1>
                <p className={styles.subtitle}>Choisissez le module qui correspond à votre besoin</p>
            </div>

            <div className={styles.grid}>
                {options.map((opt, idx) => (
                    <Link key={idx} href={opt.href} className={styles.card}>
                        <div className={styles.iconWrapper} style={{ backgroundColor: opt.color, color: opt.textColor }}>
                            {opt.icon}
                        </div>
                        <h2 className={styles.cardTitle}>{opt.title}</h2>
                        <p className={styles.cardDesc}>{opt.description}</p>
                        <div className={styles.arrowBtn}>
                            Commencer <span className={styles.arrow}>➔</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
