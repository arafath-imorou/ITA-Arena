import React from 'react';
import styles from './PromoCarousel.module.css';

export default function PromoCarousel() {
    // Les 6 images promos générées
    const promos = [
        '/images-promo/promo0.png',
        '/images-promo/promo1.png',
        '/images-promo/promo2.png',
        '/images-promo/promo3.png',
        '/images-promo/promo4.png',
        '/images-promo/promo5.png',
    ];

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.carouselTrack}>
                {/* Premier groupe d'images */}
                {promos.map((src, index) => (
                    <div key={`promo-1-${index}`} className={styles.carouselItem}>
                        <img src={src} alt={`Promo ${index}`} className={styles.promoImage} />
                    </div>
                ))}
                {/* Deuxième groupe d'images (pour la boucle infinie fluide) */}
                {promos.map((src, index) => (
                    <div key={`promo-2-${index}`} className={styles.carouselItem}>
                        <img src={src} alt={`Promo ${index}`} className={styles.promoImage} />
                    </div>
                ))}
            </div>
        </div>
    );
}
