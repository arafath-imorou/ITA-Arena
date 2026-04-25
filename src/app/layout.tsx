import type { Metadata } from "next";
import "./globals.css";
import { ModeProvider } from "@/context/ModeContext";
import { AuthProvider } from "@/context/AuthContext";
import { CountryProvider } from "@/context/CountryContext";
import LayoutWrapper from "@/components/LayoutWrapper";

export const metadata: Metadata = {
  title: "ITA Arena | La scène digitale des grands événements",
  description: "Plateforme premium de billetterie événementielle en Afrique. Réservez vos billets en ligne en toute sécurité sur ITA Arena.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <ModeProvider>
            <CountryProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </CountryProvider>
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
