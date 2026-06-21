/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        sandal: {
          50: '#F5F0E6',
          100: '#E8DFCE',
          200: '#D4C4A8',
          300: '#B8A078',
          400: '#9E825A',
          500: '#7D6542',
          600: '#5D4037',
          700: '#4E342E',
          800: '#3E2723',
          900: '#2C1810',
        },
        copper: {
          400: '#D4A574',
          500: '#B8860B',
          600: '#8B6914',
          700: '#6B4F0F',
        },
        cinnabar: {
          400: '#E53935',
          500: '#C62828',
          600: '#B71C1C',
        },
        ink: {
          400: '#757575',
          500: '#616161',
          600: '#424242',
          700: '#212121',
        },
        rice: {
          50: '#FFFEF7',
          100: '#F8F4E8',
          200: '#F0E9D2',
        },
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', 'SimSun', 'serif'],
        kai: ['"ZCOOL KuaiLe"', '"KaiTi"', 'STKaiti', 'serif'],
      },
      boxShadow: {
        'paper': '0 4px 20px rgba(93, 64, 55, 0.15)',
        'ink': '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
