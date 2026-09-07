"use client";

import { useRouter } from "next/navigation";
import styles from "./BackButton.module.css";
import { useEffect, useState } from "react";

interface BackButtonProps {
    variant?: "light" | "dark";
    className?: string;
    label?: string;
    fallbackUrl?: string;
}

export default function BackButton({ variant = "light", className = "", label = "Retour", fallbackUrl = "/" }: BackButtonProps) {
    const router = useRouter();
    const [canGoBack, setCanGoBack] = useState(false);

    useEffect(() => {
        setCanGoBack(window.history.length > 2);
    }, []);

    const handleBack = () => {
        if (canGoBack) {
            router.back();
        } else {
            router.push(fallbackUrl);
        }
    };

    return (
        <button 
            onClick={handleBack} 
            className={`${styles.backButton} ${variant === "dark" ? styles.backButtonDark : ""} ${className}`}
            aria-label="Retour"
        >
            <span className={styles.arrow}>←</span>
            <span>{label}</span>
        </button>
    );
}
