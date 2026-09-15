import type { Config } from "tailwindcss";

// Naze design tokens — see src/app/globals.css for the CSS-variable source of truth.
// Colors are also exposed as CSS variables so runtime theming (light/dark) works
// without a Tailwind rebuild.
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--naze-canvas)",
        surface: "var(--naze-surface)",
        "surface-raised": "var(--naze-surface-raised)",
        border: "var(--naze-border)",
        "border-strong": "var(--naze-border-strong)",
        ink: "var(--naze-ink)",
        "ink-muted": "var(--naze-ink-muted)",
        "ink-faint": "var(--naze-ink-faint)",
        accent: {
          DEFAULT: "var(--naze-accent)",
          hover: "var(--naze-accent-hover)",
          soft: "var(--naze-accent-soft)",
          text: "var(--naze-accent-text)",
        },
        accent2: "var(--naze-accent-2)",
        success: "var(--naze-success)",
        warning: "var(--naze-warning)",
        danger: "var(--naze-danger)",
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
      },
      boxShadow: {
        none: "none",
        ring: "0 0 0 1px var(--naze-border-strong)",
      },
      maxWidth: {
        thread: "42rem",
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      animation: {
        "rise-in": "rise-in 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
