import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Mandorino-Brand: tiefes Marineblau, dezentes Gold, warmes Off-White
        ink: {
          DEFAULT: "#13315C",
          dark: "#0B1F3A",
          light: "#1F4A7E",
        },
        gold: {
          DEFAULT: "#C9A86A",
          dark: "#A88A4F",
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
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        float: "float 7s ease-in-out infinite",
      },
      boxShadow: {
        lift: "0 12px 32px rgba(11, 31, 58, 0.14)",
        glow: "0 30px 80px rgba(0, 0, 0, 0.35)",
        soft: "0 1px 3px rgba(11, 31, 58, 0.06), 0 1px 2px rgba(11, 31, 58, 0.04)",
        card: "0 4px 16px rgba(11, 31, 58, 0.08)",
      },
      maxWidth: {
        page: "1100px",
      },
    },
  },
  plugins: [],
};

export default config;
