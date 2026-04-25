"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace("/login");
    }, [router]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
            <p>Redirection vers la page de connexion...</p>
        </div>
    );
}
