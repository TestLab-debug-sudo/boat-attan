/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        peach: {
          DEFAULT: '#FFBFA3',
          light: '#FFE0D0',
          dark: '#FF9E79',
          50: '#FFF8F5',
          100: '#FFEFE8',
          200: '#FFE0D0',
          300: '#FFC8B3',
          400: '#FFBFA3',
          500: '#FF9E79',
          600: '#F27B4F',
          700: '#D9582A',
        },
        cream: {
          DEFAULT: '#FFF8F2',
          light: '#FFFCFA',
          dark: '#F7EBE1',
        },
        ocean: {
          light: '#BAEDF3',
          DEFAULT: '#8EDCE6',
          deep: '#287D91',
          darker: '#1B5462',
          surface: '#E2F7F9',
        },
        coral: {
          DEFAULT: '#FF8A75',
          hover: '#FF735A',
          light: '#FFA694',
        },
        navy: {
          DEFAULT: '#263746',
          light: '#3C5267',
          dark: '#17222B',
          muted: '#5F7589',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'peach-soft': '0 10px 30px -10px rgba(255, 191, 163, 0.45)',
        'ocean-glow': '0 8px 25px -5px rgba(142, 220, 230, 0.4)',
        'card-glass': '0 8px 32px 0 rgba(38, 55, 70, 0.06)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'wave-drift': 'drift 8s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        drift: {
          '0%': { transform: 'translateX(-4px) rotate(-0.5deg)' },
          '100%': { transform: 'translateX(4px) rotate(0.5deg)' },
        }
      }
    },
  },
  plugins: [],
}

