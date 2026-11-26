/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        game: {
          bg: '#0a0d1f',
          panel: '#ffffff',
          ink: '#18181b',
          border: '#18181b',
          amber: '#f59e0b',
          yellow: '#facc15',
          coral: '#ff5a36',
          orange: '#ea580c',
          green: '#10b981',
          blue: '#0ea5e9',
          purple: '#8b5cf6',
          cream: '#fef3c7',
        },
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c', // Warm, punchy energetic game accent
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        surface: {
          ground: '#0a0d1f',
          panel: '#ffffff',
          muted: '#1e293b',
          border: '#18181b',
          dark: '#0a0d1f',
        },
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        tactile: '0 3px 0 0 #18181b',
        'tactile-sm': '0 2px 0 0 #18181b',
        'tactile-md': '0 4px 0 0 #18181b',
        'tactile-lg': '0 6px 0 0 #18181b',
        'tactile-xl': '0 8px 0 0 #18181b',
        'tactile-pressed': '0 0 0 0 #18181b',
        soft: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
      },
    },
  },
  plugins: [],
};

