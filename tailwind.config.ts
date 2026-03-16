import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/demo/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        hot: {
          DEFAULT: "hsl(var(--hot))",
          foreground: "hsl(var(--hot-foreground))",
        },
        warm: {
          DEFAULT: "hsl(var(--warm))",
          foreground: "hsl(var(--warm-foreground))",
        },
        cold: {
          DEFAULT: "hsl(var(--cold))",
          foreground: "hsl(var(--cold-foreground))",
        },
        "stage-new": {
          DEFAULT: "hsl(var(--stage-new))",
          foreground: "hsl(var(--stage-new-foreground))",
        },
        "stage-active": {
          DEFAULT: "hsl(var(--stage-active))",
          foreground: "hsl(var(--stage-active-foreground))",
        },
        "stage-progress": {
          DEFAULT: "hsl(var(--stage-progress))",
          foreground: "hsl(var(--stage-progress-foreground))",
        },
        "stage-approved": {
          DEFAULT: "hsl(var(--stage-approved))",
          foreground: "hsl(var(--stage-approved-foreground))",
        },
        "stage-closed": {
          DEFAULT: "hsl(var(--stage-closed))",
          foreground: "hsl(var(--stage-closed-foreground))",
        },
        "stage-hold": {
          DEFAULT: "hsl(var(--stage-hold))",
          foreground: "hsl(var(--stage-hold-foreground))",
        },
        "stage-dead": {
          DEFAULT: "hsl(var(--stage-dead))",
          foreground: "hsl(var(--stage-dead-foreground))",
        },
        "chat-bubble": "hsl(var(--chat-bubble))",
        "text-dark": "hsl(var(--text-dark))",
        "text-body": "hsl(var(--text-body))",
        "text-muted": "hsl(var(--text-muted))",
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
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
