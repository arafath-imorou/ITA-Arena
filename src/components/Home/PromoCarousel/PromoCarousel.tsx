import React from 'react';
import styles from './PromoCarousel.module.css';

export default function PromoCarousel() {
    // Les 6 images promos générées
    const promos = [
        '/images-promo/promo0.webp',
        '/images-promo/promo1.webp',
        '/images-promo/promo2.webp',
        '/images-promo/promo3.webp',
        '/images-promo/promo4.webp',
        '/images-promo/promo5.webp',
    ];

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.carouselTrack}>
                {/* Premier groupe d'images */}
                {promos.map((src, index) => (
                    <div key={`promo-1-${index}`} className={styles.carouselItem}>
                        <img src={src} alt={`Promo ${index}`} className={styles.promoImage} loading="lazy" decoding="async" />
                    </div>
                ))}
                {/* Deuxième groupe d'images (pour la boucle infinie fluide) */}
                {promos.map((src, index) => (
                    <div key={`promo-2-${index}`} className={styles.carouselItem}>
                        <img src={src} alt={`Promo ${index}`} className={styles.promoImage} loading="lazy" decoding="async" />
                    </div>
                ))}
            </div>
        </div>
    );
}
