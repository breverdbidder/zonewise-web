import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'zw-navy': '#03B3CB',
        'zw-teal': '#0D9488',
        'zw-amber': '#F59E0B',
      }
    }
  },
  plugins: []
}

export default config
