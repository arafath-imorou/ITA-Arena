"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Mode = 'events' | 'cotisations';

interface ModeContextType {
    mode: Mode;
    setMode: (mode: Mode) => void;
    activeCategory: string;
    setActiveCategory: (cat: string) => void;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
    const [mode, setMode] = useState<Mode>('events');
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        // Reset category when mode changes
        setActiveCategory('all');
    }, [mode]);

    useEffect(() => {
        // Manually parse search params to avoid de-optimization
        const updateModeFromURL = () => {
            const params = new URLSearchParams(window.location.search);
            const m = params.get('mode') as Mode;
            if (m === 'events' || m === 'cotisations') {
                setMode(m);
            }
        };

        updateModeFromURL();

        // Listen for changes (navigation)
        window.addEventListener('popstate', updateModeFromURL);
        return () => window.removeEventListener('popstate', updateModeFromURL);
    }, []);

    return (
        <ModeContext.Provider value={{ mode, setMode, activeCategory, setActiveCategory }}>
            {children}
        </ModeContext.Provider>
    );
}

export function useMode() {
    const context = useContext(ModeContext);
    if (context === undefined) {
        throw new Error("useMode must be used within a ModeProvider");
    }
    return context;
}
