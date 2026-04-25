"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface Country {
  name: string;
  flag: string;
}

interface CountryContextType {
  selectedCountry: Country;
  setSelectedCountry: (country: Country) => void;
  countries: Country[];
}

const countries: Country[] = [
  { name: "Bénin", flag: "https://flagcdn.com/w40/bj.png" },
  { name: "Côte d'Ivoire", flag: "https://flagcdn.com/w40/ci.png" },
  { name: "Sénégal", flag: "https://flagcdn.com/w40/sn.png" },
  { name: "Togo", flag: "https://flagcdn.com/w40/tg.png" },
  { name: "Mali", flag: "https://flagcdn.com/w40/ml.png" },
  { name: "Burkina Faso", flag: "https://flagcdn.com/w40/bf.png" },
  { name: "Niger", flag: "https://flagcdn.com/w40/ne.png" },
  { name: "Guinée", flag: "https://flagcdn.com/w40/gn.png" },
];

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: React.ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<Country>(countries[0]);

  useEffect(() => {
    const saved = localStorage.getItem("selectedCountry");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const exists = countries.find(c => c.name === parsed.name);
        if (exists) setSelectedCountryState(exists);
      } catch (e) {
        console.error("Error parsing saved country", e);
      }
    }
  }, []);

  const setSelectedCountry = (country: Country) => {
    setSelectedCountryState(country);
    localStorage.setItem("selectedCountry", JSON.stringify(country));
  };

  return (
    <CountryContext.Provider value={{ selectedCountry, setSelectedCountry, countries }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (context === undefined) {
    throw new Error("useCountry must be used within a CountryProvider");
  }
  return context;
}
