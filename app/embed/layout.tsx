import type { Metadata } from "next";

import { TENANT } from "@/lib/tenant.config";

export const metadata: Metadata = {
  title: `${TENANT.brand.kanzleiName} · Anfrage`,
  description: `Anfrage-Widget der Kanzlei ${TENANT.brand.kanzleiName}. Keine Rechtsberatung.`,
  robots: { index: false, follow: false }, // Embed soll nicht eigenständig in Suche auftauchen
};

/**
 * Eigenes Layout für den Embed-Modus:
 * - kein Header, kein Footer, kein DisclaimerBanner (Disclaimer ist im Chat selbst)
 * - transparenter Body, damit das Iframe sich in beliebige Hintergründe einfügt
 * - Brand-CSS-Variablen werden bereits vom RootLayout gesetzt; wir machen den
 *   Hauptbereich nur „flat" (kein full-screen flex)
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-transparent min-h-0 w-full">
      {children}
    </div>
  );
}
