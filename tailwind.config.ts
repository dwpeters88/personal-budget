import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        'surface-container': '#1e293b',
        'surface-container-high': '#334155',
        ink: '#f1f5f9',
        'ink-muted': '#94a3b8',
        primary: '#38bdf8',
        'primary-dim': '#0ea5e9',
        success: '#4ade80',
        warning: '#fbbf24',
        danger: '#f87171',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
