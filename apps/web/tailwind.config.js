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
          primary: "#080c14",
          secondary: "#0e1623",
          elevated: "#141e2e",
          glass: "rgba(14,22,35,0.7)",
        },
        text: {
          primary: "#e8edf5",
          secondary: "#8494a8",
          muted: "#4a5568",
        },
        accent: {
          primary: "#6366f1",
          secondary: "#818cf8",
          glow: "rgba(99,102,241,0.2)",
        },
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
        info: "#3b82f6",
        crypto: "#f6c90e",
        pqc: "#a855f7",
      },
      backgroundImage: {
        'glass': 'linear-gradient(to bottom right, rgba(14,22,35,0.8), rgba(14,22,35,0.4))',
        'hero-radial': 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(99,102,241,0.18) 0%, transparent 70%)',
      },
      boxShadow: {
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
        'glow-sm': '0 0 16px rgba(99,102,241,0.15)',
        'glow-md': '0 0 32px rgba(99,102,241,0.2)',
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

