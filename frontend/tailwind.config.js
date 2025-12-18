/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        display: ['Clash Display', 'system-ui', 'sans-serif'],
      },
      colors: {
        efund: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bbd8ff',
          300: '#8cc0ff',
          400: '#559dff',
          500: '#2d75ff',
          600: '#1651f5',
          700: '#0f3de1',
          800: '#1333b6',
          900: '#16308f',
          950: '#111d57',
        },
        midnight: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          200: '#c7d4fe',
          300: '#a4b5fc',
          400: '#7f8cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#1e1b4b',
          950: '#0f0d2e',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, #0f0d2e 0%, #1e1b4b 50%, #111d57 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      }
    },
  },
  plugins: [],
}

