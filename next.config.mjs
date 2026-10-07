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
        // /embed und /chat müssen in fremde Kanzlei-Seiten einbettbar sein.
        // X-Frame-Options bewusst NICHT setzen: "ALLOWALL" ist kein gültiger
        // Wert (Spec kennt nur DENY/SAMEORIGIN) und Safari interpretiert
        // ungültige Werte als DENY. Stattdessen nur CSP frame-ancestors,
        // das alle modernen Browser respektieren — und das X-Frame-Options
        // laut Spec überschreibt.
        source: "/embed",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
        ],
      },
      {
        source: "/chat",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
        ],
      },
    ];
  },
};

export default nextConfig;
