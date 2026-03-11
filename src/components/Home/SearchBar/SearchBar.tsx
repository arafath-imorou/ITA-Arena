import styles from "./SearchBar.module.css";

export default function SearchBar() {
    return (
        <div className={`container`}>
            <div className={styles.searchBarWrapper}>
                <div className={styles.searchContent}>
                    <div className={styles.searchGroup}>
                        <label>Événement</label>
                        <input type="text" placeholder="Rechercher un événement..." />
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.searchGroup}>
                        <label>Ville</label>
                        <select>
                            <option>Toutes les villes</option>
                            <option>Parakou</option>
                            <option>Cotonou</option>
                            <option>Lomé</option>
                            <option>Porto-Novo</option>
                        </select>
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.searchGroup}>
                        <label>Date</label>
                        <input type="date" />
                    </div>

                    <button className={styles.searchBtn}>
                        🔎 Rechercher
                    </button>
                </div>
            </div>
        </div>
    );
}
