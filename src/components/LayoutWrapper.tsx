"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboard = pathname?.startsWith('/organizer');

    return (
        <>
            {!isDashboard && <Navbar />}
            <main>{children}</main>
            {!isDashboard && <Footer />}
        </>
    );
}
