import type { Config } from "tailwindcss";

// Lemma design system. Warm paper, quiet, reading-first.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#fdfcfa",
        "paper-raised": "#ffffff",
        ink: "#1a1a17",
        "ink-soft": "#57544c",
        "ink-faint": "#8a867b",
        line: "#e8e4db",
        accent: "#2d5f4c",
        "accent-soft": "#4a7d68",
      },
      fontFamily: {
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      maxWidth: {
        reading: "42rem",
      },
    },
  },
  plugins: [],
};

export default config;
