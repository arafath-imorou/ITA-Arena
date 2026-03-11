"use client";

import styles from "./FilterBar.module.css";

export default function FilterBar() {
    return (
        <section className={styles.section}>
            <div className="container">
                <div className={styles.filterBar}>
                    {/* Todas / Search icon */}
                    <div className={styles.filterGroup}>
                        <div className={styles.selectWrapper}>
                            <span className={styles.icon}>🔍</span>
                            <select className={styles.select}>
                                <option>Toutes</option>
                            </select>
                            <span className={styles.chevron}>⌄</span>
                        </div>
                    </div>

                    <div className={styles.divider}></div>

                    {/* Catégorie */}
                    <div className={styles.filterGroup}>
                        <div className={styles.selectWrapper}>
                            <select className={styles.select}>
                                <option>Catégorie</option>
                            </select>
                            <span className={styles.chevron}>⌄</span>
                        </div>
                    </div>

                    <div className={styles.divider}></div>

                    {/* Ville */}
                    <div className={styles.filterGroup}>
                        <div className={styles.selectWrapper}>
                            <select className={styles.select}>
                                <option>Ville</option>
                            </select>
                            <span className={styles.chevron}>⌄</span>
                        </div>
                    </div>

                    <div className={styles.divider}></div>

                    {/* Date */}
                    <div className={styles.filterGroup}>
                        <div className={styles.selectWrapper}>
                            <select className={styles.select}>
                                <option>Date</option>
                            </select>
                            <span className={styles.chevron}>⌄</span>
                        </div>
                    </div>

                    <div className={styles.divider}></div>

                    {/* Prix / Range */}
                    <div className={styles.filterGroup}>
                        <div className={styles.selectWrapper}>
                            <span className={styles.priceLabel}>Prix</span>
                            <span className={styles.grayText}>Mmmeor à</span>
                        </div>
                    </div>

                    <div className={styles.divider}></div>

                    {/* Date Range Picker Style */}
                    <div className={styles.filterGroup}>
                        <div className={styles.datePickerWrap}>
                            <span className={styles.icon}>📅</span>
                            <span className={styles.placeholderLabel}>Aor ete</span>
                            <span className={styles.grayText}>de 3000 F CFA</span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button className={styles.searchBtn}>
                        Rechercher ⌄
                    </button>
                </div>
            </div>
        </section>
    );
}
