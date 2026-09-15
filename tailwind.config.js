/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--brand-50, #f5f3ff)',
          100: 'var(--brand-100, #ede9fe)',
          200: 'var(--brand-200, #ddd6fe)',
          300: 'var(--brand-300, #c4b5fd)',
          400: 'var(--brand-400, #a78bfa)',
          500: 'var(--brand-500, #8b5cf6)',
          600: 'var(--brand-600, #7c3aed)',
          700: 'var(--brand-700, #6d28d9)',
          800: 'var(--brand-800, #5b21b6)',
          900: 'var(--brand-900, #4c1d95)',
          DEFAULT: 'var(--brand-primary, #7c3aed)',
        },
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
          card: 'var(--surface-card, #ffffff)',
          border: 'var(--surface-border, #e2e8f0)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        glow: '0 0 25px -5px var(--brand-primary, #7c3aed)',
      }
    },
  },
  plugins: [],
}
