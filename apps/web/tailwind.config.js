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
        background: "#080c14",
        card: "#111827",
        primary: "#e8edf5",
        secondary: "#8494a8",
        muted: "#4a5568",
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
      }
    },
  },
  plugins: [],
};
