import type { Config } from "tailwindcss";

// Naze design tokens. See src/app/globals.css for the CSS-variable source
// of truth. Colors are also exposed as CSS variables so runtime theming
// (dark/light plus the accent picker in Pengaturan) works without a
// Tailwind rebuild.
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
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
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
        // Small inline entrances (chat bubbles, notices): a barely-there
        // lift plus a quick focus pull so new content arrives crisp.
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(8px)", filter: "blur(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)", filter: "blur(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        // Full-page entrances (login/register) where the app wants a
        // moment of arrival: more travel, a touch of scale, a deeper
        // blur that resolves as it lands.
        "rise-in-lg": {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.985)", filter: "blur(12px)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)", filter: "blur(0)" },
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
        "rise-in": "rise-in 300ms cubic-bezier(0.16, 1, 0.3, 1)",
        shimmer: "shimmer 2.4s linear infinite",
        "rise-in-lg": "rise-in-lg 640ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "logo-pop": "logo-pop 620ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
