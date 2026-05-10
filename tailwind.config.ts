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
        sans: [
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
      boxShadow: {
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
