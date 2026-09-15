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
        // Bolder version of rise-in for full-page entrances (login/
        // register) where the app wants a moment of arrival, not the
        // barely-there lift chat bubbles use. More travel distance
        // (20px vs 6px), a touch of scale, and a longer duration.
        "rise-in-lg": {
          "0%": { opacity: "0", transform: "translateY(20px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // The wordmark's own entrance: overshoots slightly then settles,
        // so it reads as arriving with a bit of energy rather than just
        // fading up like everything under it.
        "logo-pop": {
          "0%": { opacity: "0", transform: "scale(0.4) rotate(-12deg)" },
          "60%": { opacity: "1", transform: "scale(1.08) rotate(4deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
        },
      },
      animation: {
        "rise-in": "rise-in 220ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2.4s linear infinite",
        "rise-in-lg": "rise-in-lg 480ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "logo-pop": "logo-pop 620ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
