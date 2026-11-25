/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // Primary brand color
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          ground: '#f8fafc',
          panel: '#ffffff',
          muted: '#f1f5f9',
          border: '#e2e8f0',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        tactile: '0 2px 0 0 rgba(0, 0, 0, 0.08)',
        'tactile-lg': '0 4px 0 0 rgba(0, 0, 0, 0.1)',
        'tactile-pressed': '0 0 0 0 rgba(0, 0, 0, 0.1)',
        soft: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

