import forms from "@tailwindcss/forms";
import aspectRatio from "@tailwindcss/aspect-ratio";
import typography from "@tailwindcss/typography";
import scrollbar from "tailwind-scrollbar";

module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "650px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
    extend: {
      colors: {
        // Dynamic White-Label & STEM Theme Tokens
        primary: {
          DEFAULT: "rgb(var(--primary-rgb, 79 70 229) / <alpha-value>)",
          foreground: "var(--primary-foreground, #ffffff)",
          hover: "var(--primary-hover, #4338ca)",
          50: "rgb(var(--primary-rgb, 79 70 229) / 0.08)",
          100: "rgb(var(--primary-rgb, 79 70 229) / 0.15)",
          200: "rgb(var(--primary-rgb, 79 70 229) / 0.25)",
          300: "rgb(var(--primary-rgb, 79 70 229) / 0.4)",
          400: "rgb(var(--primary-rgb, 79 70 229) / 0.6)",
          500: "rgb(var(--primary-rgb, 79 70 229) / <alpha-value>)",
          600: "rgb(var(--primary-rgb, 79 70 229) / <alpha-value>)",
          700: "var(--primary-hover, #4338ca)",
          800: "var(--primary-hover, #4338ca)",
          900: "rgb(var(--primary-rgb, 79 70 229) / 0.9)",
          950: "rgb(var(--primary-rgb, 79 70 229) / 0.95)",
        },
        // Map indigo to dynamic primary brand tokens so existing indigo buttons/badges dynamically adapt
        indigo: {
          DEFAULT: "rgb(var(--primary-rgb, 79 70 229) / <alpha-value>)",
          foreground: "var(--primary-foreground, #ffffff)",
          50: "rgb(var(--primary-rgb, 79 70 229) / 0.08)",
          100: "rgb(var(--primary-rgb, 79 70 229) / 0.15)",
          200: "rgb(var(--primary-rgb, 79 70 229) / 0.25)",
          300: "rgb(var(--primary-rgb, 79 70 229) / 0.4)",
          400: "rgb(var(--primary-rgb, 79 70 229) / 0.6)",
          500: "rgb(var(--primary-rgb, 79 70 229) / <alpha-value>)",
          600: "rgb(var(--primary-rgb, 79 70 229) / <alpha-value>)",
          700: "var(--primary-hover, #4338ca)",
          800: "var(--primary-hover, #4338ca)",
          900: "rgb(var(--primary-rgb, 79 70 229) / 0.9)",
          950: "rgb(var(--primary-rgb, 79 70 229) / 0.95)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent-rgb, 6 182 212) / <alpha-value>)",
          foreground: "var(--accent-foreground, #ffffff)",
        },
        secondary: "#64748b",
        background: "#f1f5f9",
        textBase: "#0f172a",
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
        dark: "#0f172a",
        // Canvas & surface tokens
        canvas: '#F6F5F0',
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#FAF9F5',
          sidebar: '#FAF9F5',
        },
        // Pastel accent tints
        lavender: {
          tint: '#F0EEFF',
          text: '#5B21B6',
        },
        mint: {
          tint: '#E8F8F2',
          text: '#065F46',
        },
        butter: {
          tint: '#FEF3E2',
          text: '#9A3412',
        },
        coral: {
          tint: '#FFE8EC',
          text: '#9F1239',
        },
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.875rem",
        base: "1rem",
        md: "1.125rem",
        lg: "1.25rem",
        xl: "1.5rem",
        "2xl": "1.875rem",
        "3xl": "2.25rem",
        "4xl": "3rem",
        "5xl": "4rem",
      },
      fontFamily: {
        // English fonts
        english: ['"Open Sans"', "Arial", "sans-serif"],
        // Sinhala fonts
        sinhalaHeading: ['"FM Abhaya"', '"Noto Sans Sinhala"', "sans-serif"],
        sinhalaBody: [
          '"FM Emanee"',
          '"FM Rashmee"',
          '"Noto Sans Sinhala"',
          "sans-serif",
        ],
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "26": "6.5rem",
        "30": "7.5rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 4px 6px rgba(0, 0, 0, 0.1)",
        hard: "0 4px 10px rgba(0, 0, 0, 0.2)",
        'clay': '0 10px 30px -5px rgba(0,0,0,0.06), 0 4px 12px -2px rgba(0,0,0,0.03)',
        'clay-hover': '0 16px 40px -6px rgba(0,0,0,0.10), 0 6px 16px -3px rgba(0,0,0,0.05)',
        'pill': '0 4px 14px rgba(0,0,0,0.04)',
        'topbar': '0 2px 20px -4px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
      },
      transitionProperty: {
        width: "width",
      },
      animation: {
        "blob-1": "blob 20s infinite",
        "blob-2": "blob 25s infinite",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 30px) scale(0.95)" },
        },
      },
    },
  },
  plugins: [forms, aspectRatio, typography, scrollbar],
};
