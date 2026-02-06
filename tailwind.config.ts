import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        // Primary Colors
        "deep-space": "hsl(var(--deep-space))",
        "electric-violet": "hsl(var(--electric-violet))",
        "neon-magenta": "hsl(var(--neon-magenta))",
        "liquid-gold": "hsl(var(--liquid-gold))",
        // Secondary Colors
        "cosmic-purple": "hsl(var(--cosmic-purple))",
        "chrome-silver": "hsl(var(--chrome-silver))",
        "obsidian": "hsl(var(--obsidian))",
        "pure-white": "hsl(var(--pure-white))",
        // Channel Colors
        "afropunk-blue": "hsl(var(--afropunk-blue))",
        "afropunk-green": "hsl(var(--afropunk-green))",
        "codeblack-orange": "hsl(var(--codeblack-orange))",
        "codeblack-gold": "hsl(var(--codeblack-gold))",
        "lol-pink": "hsl(var(--lol-pink))",
        "lol-yellow": "hsl(var(--lol-yellow))",
        "essence-rose": "hsl(var(--essence-rose))",
        "essence-champagne": "hsl(var(--essence-champagne))",
        // Semantic Colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        accent: ['"Space Grotesk"', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        "glow-violet": "0 0 30px hsl(270 73% 59% / 0.4)",
        "glow-magenta": "0 0 30px hsl(338 100% 50% / 0.4)",
        "glow-gold": "0 0 30px hsl(42 100% 58% / 0.4)",
        "card": "0 8px 32px hsl(0 0% 0% / 0.6)",
        "elevated": "0 16px 48px hsl(0 0% 0% / 0.8)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "heart-burst": {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.3)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(338 100% 50% / 0.4)" },
          "50%": { boxShadow: "0 0 40px hsl(338 100% 50% / 0.8)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "pulse-subtle": "pulse-subtle 2s ease-in-out infinite",
        "heart-burst": "heart-burst 0.4s ease-out",
        "shimmer": "shimmer 1.5s infinite",
        "float": "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-hero": "linear-gradient(135deg, hsl(280, 89%, 39%) 0%, hsl(338, 100%, 50%) 50%, hsl(42, 100%, 58%) 100%)",
        "gradient-button": "linear-gradient(135deg, hsl(338, 100%, 50%) 0%, hsl(270, 73%, 59%) 100%)",
        "gradient-gold": "linear-gradient(135deg, hsl(42, 100%, 58%) 0%, hsl(43, 43%, 43%) 100%)",
        "gradient-card": "linear-gradient(180deg, transparent 0%, hsl(0, 0%, 4%) 100%)",
        "gradient-radial": "radial-gradient(circle at center, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
