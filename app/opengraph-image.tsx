import { ImageResponse } from "next/og";

import { TENANT } from "@/lib/tenant.config";

export const alt = `${TENANT.brand.kanzleiName} · Anliegen erfassen`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Link-Vorschau (WhatsApp, LinkedIn, Slack …) — wird aus der Tenant-Config gebaut. */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `linear-gradient(135deg, ${TENANT.brand.primary} 0%, #0B1F3A 100%)`,
          color: "white",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke={TENANT.brand.accent} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 52h20M32 52V16" />
            <circle cx="32" cy="13" r="2.6" />
            <path d="M12 21h40" />
            <path d="M15 21 8 38M15 21l7 17M49 21l-7 17M49 21l7 17" />
            <path d="M6 38q9 11 18 0ZM40 38q9 11 18 0Z" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 600 }}>{TENANT.brand.kanzleiName}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Ihr Anliegen. In Ruhe geschildert.
          </div>
          <div style={{ fontSize: 32, color: TENANT.brand.accent }}>
            Geführtes Erstgespräch · Persönliche Rückmeldung der Kanzlei
          </div>
        </div>
        <div style={{ fontSize: 24, opacity: 0.6 }}>Keine Rechtsberatung · Vorab-Erfassung mit Mandorino</div>
      </div>
    ),
    size,
  );
}
