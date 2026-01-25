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
    extend: {
      colors: {
        royal: "#7C3AED",
        purple: "#8B5CF6",
        purpleLight: "#A78BFA",
        slateInk: "#475569",
        amberGlow: "#EC4899",
        emerald: "#10B981",
        gold: "#F59E0B"
      },
      backgroundImage: {
        "glass-blur": "radial-gradient(circle at 10% 20%, rgba(124,58,237,0.08), transparent 25%), radial-gradient(circle at 80% 0%, rgba(236,72,153,0.05), transparent 30%)"
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(124, 58, 237, 0.15)",
        glow: "0 0 20px rgba(124, 58, 237, 0.3)",
        "glow-pink": "0 0 20px rgba(236, 72, 153, 0.3)"
      },
      borderRadius: {
        xl: "1rem"
      },
      animation: {
        "float": "float 3s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "slide-up": "slide-up 0.6s ease-out",
        "fade-in": "fade-in 0.5s ease-out"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(124, 58, 237, 0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(124, 58, 237, 0.6)" }
        },
        "slide-up": {
          "from": { opacity: "0", transform: "translateY(20px)" },
          "to": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "from": { opacity: "0" },
          "to": { opacity: "1" }
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["var(--font-patua)", ...fontFamily.sans],
        script: ["var(--font-greatvibes)", ...fontFamily.sans]
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;