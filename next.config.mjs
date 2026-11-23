/**
 * Wer darf /embed und /chat per iframe einbinden?
 * EMBED_ALLOWED_ORIGINS="https://kanzlei.de,https://www.kanzlei.de" → nur diese (plus eigene Origin).
 * Nicht gesetzt → jede Seite (Demo-/Entwicklungsbetrieb). In Produktion setzen,
 * sonst kann jede fremde Seite das Formular einbetten (Clickjacking/Phishing-Risiko).
 */
const embedOrigins = (process.env.EMBED_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter((o) => /^https?:\/\/[^\s;]+$/.test(o));
const frameAncestors = embedOrigins.length
  ? `frame-ancestors 'self' ${embedOrigins.join(" ")};`
  : "frame-ancestors *;";
if (!embedOrigins.length && process.env.NODE_ENV === "production" && !globalThis.__mandorinoEmbedWarned) {
  globalThis.__mandorinoEmbedWarned = true;
  console.warn("[mandorino] EMBED_ALLOWED_ORIGINS ist nicht gesetzt — /embed und /chat sind von jeder Seite einbettbar.");
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Basis-Härtung für alle Routen.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
      {
        // Team-Bereich darf nie in fremden Seiten eingebettet werden (Clickjacking-Schutz).
        source: "/team/:path*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self';" }],
      },
      {
        // /embed (inkl. /embed/danke) und /chat müssen in fremde Kanzlei-Seiten einbettbar sein.
        // X-Frame-Options bewusst NICHT setzen: "ALLOWALL" ist kein gültiger Wert und Safari
        // behandelt ungültige Werte als DENY. CSP frame-ancestors wird von allen modernen
        // Browsern respektiert und überschreibt X-Frame-Options laut Spec.
        // Erlaubte Einbettungs-Domains: EMBED_ALLOWED_ORIGINS (siehe oben).
        source: "/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: frameAncestors }],
      },
      {
        source: "/chat",
        headers: [{ key: "Content-Security-Policy", value: frameAncestors }],
      },
    ];
  },
};

export default nextConfig;
