"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCountry } from "@/context/CountryContext";
import styles from "./Navbar.module.css";

export default function Navbar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const { user, signOut } = useAuth();
  const { selectedCountry, setSelectedCountry, countries } = useCountry();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSignOut = async () => {
    await signOut();
    setShowDropdown(false);
  };

  return (
    <header className={styles.header}>
      {/* Top Utility Bar */}
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarContainer}`}>
          <div className={styles.leftTop}>
            <div className={styles.topSelector} onClick={() => setShowCountryDropdown(!showCountryDropdown)}>
              <img src={selectedCountry.flag} alt={selectedCountry.name} className={styles.tinyFlag} />
              <span>{selectedCountry.name}</span>
              <span className={styles.chevron}>▾</span>

              {showCountryDropdown && (
                <div className={styles.countryDropdown} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.countrySearch}>
                    <input
                      type="text"
                      placeholder="Rechercher..."
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className={styles.countryList}>
                    {countries.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(country => (
                      <div key={country.name} className={styles.countryOption} onClick={() => {
                        setSelectedCountry(country);
                        setShowCountryDropdown(false);
                      }}>
                        <img src={country.flag} alt="" className={styles.tinyFlag} />
                        <span>{country.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className={styles.topSelector}>
              <span>🌐</span>
              <span>FR</span>
              <span className={styles.chevron}>▾</span>
            </div>
          </div>
          <div className={styles.rightTop}>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={styles.mainNav}>
        <div className={`container ${styles.navContainer}`}>
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <img
              src="/images/logo/ita_arena_logo.png"
              alt="ITA Arena Logo"
              className={styles.logoImage}
            />
          </Link>

          {/* Search bar */}
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <button className={styles.filterBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="8" x2="14" y2="8"></line><line x1="18" y1="16" x2="22" y2="16"></line></svg>
              </button>
              <input type="text" placeholder="Rechercher..." className={styles.searchInput} />
              <button className={styles.searchBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.navActions}>
            <Link href={user ? "/organizer/create" : "/signin"} className={styles.publishBtn}>
              Publier un événement
            </Link>
            <div className={styles.profileMenu} onClick={() => setShowDropdown(!showDropdown)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                <div className={styles.avatarCircle}>
                  {user ? user.email?.charAt(0).toUpperCase() : "👤"}
                </div>

                {showDropdown && (
                    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      {user ? (
                        <>
                          <div className={styles.userInfo}>
                            <div className={styles.userInfoItem}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                              <p className={styles.userEmail}>{user.email}</p>
                            </div>
                            <div className={styles.userInfoItem}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9-9c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3z"></path></svg>
                              <p className={styles.clientCodeText}>Code client : <span className={styles.codeHighlight}>560337</span></p>
                            </div>
                          </div>
                          <hr className={styles.divider} />
                          <Link href="/organizer" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Tableau de bord</Link>
                          <Link href="/organizer" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Mes évènements</Link>
                          <Link href="/organizer/tickets" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Mes Tickets</Link>
                          <Link href="/organizer/account" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Mon Profil</Link>
                          <hr className={styles.divider} />
                          <Link href="/about" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Qui sommes nous?</Link>
                          <Link href="/faq" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>FAQ</Link>
                          <Link href="/contact" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Nous contacter</Link>
                          <hr className={styles.divider} />
                          <button onClick={handleSignOut} className={styles.signOutBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            Déconnexion
                          </button>
                        </>
                    ) : (
                      <>
                        <Link href="/login" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Se connecter</Link>
                        <Link href="/register" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>S'inscrire</Link>
                        <hr className={styles.divider} />
                        <Link href="/pricing" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Tarif</Link>
                        <hr className={styles.divider} />
                        <Link href="/about" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Qui sommes nous?</Link>
                        <Link href="/faq" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>FAQ</Link>
                        <Link href="/contact" className={styles.dropdownItem} onClick={() => setShowDropdown(false)}>Nous contacter</Link>
                      </>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
