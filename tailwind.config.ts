import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'zw-navy': {
          50: '#E8F4FD',
          100: '#C5DFEF',
          200: '#9DC6E0',
          300: '#7099C0',
          400: '#4A6F9A',
          500: '#2A4F7A',
          600: '#1E3A5F',
          700: '#162D4A',
          800: '#0F2035',
          900: '#07111C',
          DEFAULT: '#1E3A5F',
        },
        'zw-orange': {
          50: '#FEF3C7',
          100: '#FDE68A',
          200: '#FCD34D',
          300: '#FBBF24',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
          DEFAULT: '#F59E0B',
        },
      }
    }
  },
  plugins: []
}

export default config
