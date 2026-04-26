"use client";

import Link from "next/link";
import styles from "./BackButton.module.css"; // Reuse BackButton styles for consistency

interface HomeButtonProps {
    variant?: "light" | "dark";
    className?: string;
    label?: string;
}

export default function HomeButton({ variant = "light", className = "", label = "Accueil" }: HomeButtonProps) {
    return (
        <Link 
            href="/"
            className={`${styles.backButton} ${variant === "dark" ? styles.backButtonDark : ""} ${className}`}
            aria-label="Retour à l'accueil"
        >
            <span className={styles.arrow}>🏠</span>
            <span>{label}</span>
        </Link>
    );
}
