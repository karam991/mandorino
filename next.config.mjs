/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
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
