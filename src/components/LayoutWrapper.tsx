"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import HomeButton from "@/components/HomeButton";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/organizer');
    const isHome = pathname === '/';

    return (
        <>
            {!isDashboard && <Navbar />}
            <main>
                {!isDashboard && !isHome && (
                    <div className="container" style={{ paddingTop: '100px', marginBottom: '-60px', position: 'relative', zIndex: 10 }}>
                        <HomeButton variant="dark" label="Retour à l'arène" />
                    </div>
                )}
                {children}
            </main>
            {!isDashboard && <Footer />}
        </>
    );
}
