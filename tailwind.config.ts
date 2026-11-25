import type { Config } from "tailwindcss";

const config: Config = {
  // status-* / prio-* werden dynamisch zusammengesetzt (`status-${status}`) und würden
  // von Tailwind sonst als „unbenutzt" entfernt → Pills wären unstyled.
  safelist: [{ pattern: /^(status|prio)-/ }],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  // Hover-Stile nur auf Geräten mit echtem Hover — sonst „kleben" sie nach dem Antippen
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        // Mandorino-Brand: tiefes Marineblau, dezentes Gold, warmes Off-White
        // ink/gold kommen aus tenant.config (siehe app/brandTokens.ts)
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          dark: "rgb(var(--ink-dark) / <alpha-value>)",
          light: "rgb(var(--ink-light) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--gold) / <alpha-value>)",
          dark: "rgb(var(--gold-dark) / <alpha-value>)",
        },
        paper: {
          DEFAULT: "#F7F5F1",
          dark: "#EDEAE3",
        },
        line: "#E3E1DD",
        muted: "#5C6470",
        success: "#2E7D5B",
        danger: "#B23A48",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "bubble-in": { "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" }, "100%": { opacity: "1", transform: "translateY(0) scale(1)" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-6px)" }, "40%,80%": { transform: "translateX(6px)" } },
        swing: { "0%,100%": { transform: "rotate(-1.5deg)" }, "50%": { transform: "rotate(1.5deg)" } },
        typing: { "0%,60%,100%": { opacity: "0.3" }, "30%": { opacity: "1" } },
      },
      animation: {
        "fade-up": "fade-up 0.7s var(--ease-out) both",
        "bubble-in": "bubble-in 0.3s var(--ease-out) both",
        typing: "typing 1.2s ease-in-out infinite",
        shake: "shake 0.45s ease-in-out",
        swing: "swing 6s ease-in-out infinite",
      },
      boxShadow: {
        lift: "0 2px 4px rgb(var(--ink-dark) / 0.06), 0 12px 32px rgb(var(--ink-dark) / 0.14)",
        glow: "0 30px 80px rgba(0, 0, 0, 0.35)",
        soft: "0 1px 3px rgb(var(--ink-dark) / 0.06), 0 1px 2px rgb(var(--ink-dark) / 0.04)",
        card: "0 4px 16px rgb(var(--ink-dark) / 0.08)",
      },
      fontSize: {
        // Fließende Überschriften: klein genug für 320px, gedeckelt auf Desktop
        display: ["clamp(2rem, 1.2rem + 3.6vw, 3.75rem)", { lineHeight: "1.08" }],
        title: ["clamp(1.75rem, 1.35rem + 1.7vw, 2.5rem)", { lineHeight: "1.15" }],
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
      },
      maxWidth: {
        page: "1100px",
      },
    },
  },
  plugins: [],
};

export default config;
