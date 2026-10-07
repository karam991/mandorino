import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";

import { TENANT } from "@/lib/tenant.config";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

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
    <html lang="de" style={brandStyle} className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
