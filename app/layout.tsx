import type { Metadata } from "next";

import { TENANT } from "@/lib/tenant.config";
import "./globals.css";

export const metadata: Metadata = {
  title: `${TENANT.brand.kanzleiName} · Anliegen erfassen`,
  description: `${TENANT.brand.kanzleiName} — strukturierte Vorab-Erfassung Ihres rechtlichen Anliegens. Keine Rechtsberatung; die Bewertung übernimmt anschließend die Kanzlei.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const brandStyle = {
    "--brand-primary": TENANT.brand.primary,
    "--brand-accent": TENANT.brand.accent,
  } as React.CSSProperties;

  return (
    <html lang="de" style={brandStyle}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
