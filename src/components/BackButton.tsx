"use client";

import { useRouter } from "next/navigation";
import styles from "./BackButton.module.css";

interface BackButtonProps {
    variant?: "light" | "dark";
    className?: string;
    label?: string;
}

export default function BackButton({ variant = "light", className = "", label = "Retour" }: BackButtonProps) {
    const router = useRouter();

    return (
        <button 
            onClick={() => router.back()} 
            className={`${styles.backButton} ${variant === "dark" ? styles.backButtonDark : ""} ${className}`}
            aria-label="Retour"
        >
            <span className={styles.arrow}>←</span>
            <span>{label}</span>
        </button>
    );
}
