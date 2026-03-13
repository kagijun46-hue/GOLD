import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // トレード専用カラーパレット
        gold: {
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        bull: {
          light: "#4ade80",
          DEFAULT: "#22c55e",
          dark: "#16a34a",
          bg: "#052e16",
          border: "#166534",
        },
        bear: {
          light: "#f87171",
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          bg: "#2d0a0a",
          border: "#991b1b",
        },
        wait: {
          light: "#fbbf24",
          DEFAULT: "#f59e0b",
          dark: "#d97706",
          bg: "#1c1407",
          border: "#78350f",
        },
        chart: {
          bg: "#0a0a0f",
          card: "#111118",
          border: "#1e1e2e",
          border2: "#2a2a3e",
          text: "#e2e8f0",
          muted: "#64748b",
          accent: "#6366f1",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
