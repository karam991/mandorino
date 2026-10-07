import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";

import { TENANT } from "@/lib/tenant.config";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const viewport: Viewport = {
  themeColor: TENANT.brand.primary,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.MANDORINO_PUBLIC_URL ?? "https://mandorino.vercel.app"),
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: TENANT.brand.kanzleiName,
    title: `${TENANT.brand.kanzleiName} · Anliegen erfassen`,
    description: "Schildern Sie Ihr Anliegen in einem ruhigen, geführten Gespräch. Die Kanzlei meldet sich persönlich bei Ihnen.",
  },
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
      <body className="min-h-screen flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-dark focus:shadow-lift"
        >
          Zum Inhalt springen
        </a>
        {children}
      </body>
    </html>
  );
}
