/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-space)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        bg: {
          primary: "#05080f", // Darker, crisper base
          secondary: "#0a0f1c", // High contrast separation
          elevated: "#121a2f",
          glass: "rgba(10, 15, 28, 0.6)",
        },
        text: {
          primary: "#f8fafc", // Stark white for contrast
          secondary: "#94a3b8", // Crisp gray
          muted: "#475569",
        },
        accent: {
          primary: "#6366f1",
          secondary: "#818cf8",
          glow: "rgba(99,102,241,0.15)",
        },
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
        crypto: "#f6c90e",
        pqc: "#a855f7",
      },
      backgroundImage: {
        'glass': 'linear-gradient(to bottom right, rgba(10,15,28,0.7), rgba(10,15,28,0.3))',
        'grid-pattern': 'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
        'glow-sm': '0 0 16px rgba(99,102,241,0.1)',
        'glow-md': '0 0 32px rgba(99,102,241,0.15)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
};

