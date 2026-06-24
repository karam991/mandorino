/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // /embed (und /chat als Fallback) müssen in fremde Kanzlei-Seiten
        // einbettbar sein. Vercel setzt sonst defensive Defaults, die das
        // Iframe-Laden auf anderen Origins blocken.
        source: "/embed",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          // X-Frame-Options absichtlich NICHT setzen — moderne Browser
          // bevorzugen CSP frame-ancestors. Vercel-Default überschreiben:
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
      {
        source: "/chat",
        headers: [
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "X-Frame-Options", value: "ALLOWALL" },
        ],
      },
    ];
  },
};

export default nextConfig;
