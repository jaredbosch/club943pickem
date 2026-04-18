import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0F1923",
        card: "#1A2633",
        card2: "#223344",
        green: {
          DEFAULT: "#00C853",
          bright: "#00E676",
        },
        orange: "#FF6D00",
        red: "#E24B4A",
        text: "#E8EDF2",
        muted: "#8899AA",
        border: "#2A3A4A",
        "lock-bg": "#2A1A1A",
      },
      fontFamily: {
        sans: [
          "var(--font-dm-sans)",
          "DM Sans",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
