import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{mdx,md}"
  ],
  theme: {
    screens: {
      'xs': '360px',    // Small phones
      'sm': '480px',    // Large phones
      'md': '768px',    // Tablets
      'lg': '1024px',   // Laptops
      'xl': '1280px',   // Desktops
      '2xl': '1440px',  // Large screens
    },
    extend: {
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px"
      },
      colors: {
        primary: "var(--color-gold-accent)",
        "primary-hover": "var(--color-gold-deep)",
        slateInk: "var(--color-slate-secondary)",
        amberGlow: "var(--color-gold-light)",
        emerald: "#10B981",
        gold: "var(--color-gold-accent)",
        "bathala-bg": "var(--color-background)",
        "bathala-surface": "var(--color-surface)",
        "bathala-border": "var(--color-border)",
        "bathala-ink": "var(--color-text-primary)",
        "bathala-muted": "var(--color-text-muted)",
        "bathala-slate": "var(--color-slate-primary)",
        "bathala-slate-soft": "var(--color-slate-secondary)",
        "background-light": "var(--color-background)"
      },
      boxShadow: {
        glass: "var(--shadow-soft)",
        "glow-primary": "0 0 20px rgba(184, 154, 94, 0.35)",
        "brand-soft": "var(--shadow-soft)",
        "brand-medium": "var(--shadow-medium)",
        "brand-strong": "var(--shadow-strong)",
        "brand-gold": "var(--shadow-gold)"
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-base)",
        lg: "var(--radius-md)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-lg)",
        "3xl": "calc(var(--radius-lg) + 8px)"
      },
      fontSize: {
        xs: ["12px", { lineHeight: "1.4" }],
        sm: ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.6" }],
        lg: ["18px", { lineHeight: "1.5" }],
        xl: ["20px", { lineHeight: "1.35" }],
        "2xl": ["24px", { lineHeight: "1.3" }],
        "3xl": ["30px", { lineHeight: "1.2" }],
        "4xl": ["36px", { lineHeight: "1.15" }]
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out",
        "fade-in": "fade-in 0.5s ease-out"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        }
      },
      fontFamily: {
        sans: ["var(--font-body)", ...fontFamily.sans],
        display: ["var(--font-display)", "var(--font-body)", ...fontFamily.sans]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;