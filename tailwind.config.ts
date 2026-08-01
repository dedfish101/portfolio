import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Semantic tokens driven by CSS variables (see globals.css) so a single
        // `.dark` class on <html> swaps the whole palette. RGB-triplet vars keep
        // Tailwind opacity modifiers (e.g. text-ink/70) working.
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)", // primary foreground (flips)
        terminal: "rgb(var(--terminal) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)", // dark button bg (stays dark)
        neon: "#89dceb",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        frame: "0 1px 2px rgba(17,17,17,0.04), 0 12px 40px rgba(17,17,17,0.06)",
        modal: "0 20px 80px rgba(17,17,17,0.28)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "sheet-in": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        blink: {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "sheet-in": "sheet-in 0.24s cubic-bezier(0.16, 1, 0.3, 1)",
        blink: "blink 1.1s steps(1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
