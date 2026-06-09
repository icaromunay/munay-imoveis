import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#102a1f',
          gold: '#d4af72',
          cream: '#f6f2e8',
          slate: '#1f2937'
        }
      },
      boxShadow: {
        soft: '0 20px 60px rgba(0,0,0,0.12)'
      },
      backgroundImage: {
        gradientLuxury: 'linear-gradient(135deg, rgba(16,42,31,0.95), rgba(31,41,55,0.88))'
      }
    }
  },
  plugins: []
} satisfies Config;
