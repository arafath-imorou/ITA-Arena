"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignUpRedirect() {
    const router = useRouter();
    
    useEffect(() => {
        router.replace("/register");
    }, [router]);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
            <p>Redirection vers la page d'inscription...</p>
        </div>
    );
}
