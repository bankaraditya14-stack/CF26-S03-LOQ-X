/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FFFCF2',
          100: '#FDF4D2', // Primary Warm Cream
          200: '#F7EBC0',
          300: '#EFE2AC',
          400: '#E2D193',
          500: '#CDB874',
        },
        charcoal: {
          50: '#F6F6F7',
          100: '#E7E7E9',
          200: '#CFCFD3',
          300: '#9E9EA7',
          400: '#6C6C77',
          500: '#4A4A54',
          700: '#2B2B32',
          800: '#24242A',
          900: '#1F1F24', // Primary Dark Charcoal
          950: '#151518',
        },
        softblue: {
          50: '#F2F7FB',
          100: '#E1EEF8',
          200: '#C8DEF0',
          300: '#B0CDE6', // Primary Soft Blue
          400: '#8FB9DE',
          500: '#6EA0CD',
          600: '#4F84B5',
          700: '#3D678E',
        },
        mutedpurple: {
          50: '#F6F4F8',
          100: '#ECE6F2',
          200: '#D7CCE3',
          300: '#A290B7', // Primary Muted Purple
          400: '#8A74A3',
          500: '#735B8C',
          600: '#5C4672',
          700: '#453356',
        },
        dustybrown: {
          50: '#FAF5F5',
          100: '#F2E8E8',
          200: '#E2CECE',
          300: '#946D6D', // Primary Dusty Brown
          400: '#7F5656',
          500: '#6A4343',
          600: '#543333',
          700: '#3F2424',
        },
      },
      fontFamily: {
        heading: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'command': '0 4px 20px -2px rgba(31, 31, 36, 0.08), 0 2px 6px -1px rgba(31, 31, 36, 0.04)',
        'command-lg': '0 12px 32px -4px rgba(31, 31, 36, 0.12), 0 4px 12px -2px rgba(31, 31, 36, 0.06)',
        'glow-softblue': '0 0 20px rgba(176, 205, 230, 0.35)',
        'glow-purple': '0 0 20px rgba(162, 144, 183, 0.35)',
        'glow-brown': '0 0 20px rgba(148, 109, 109, 0.35)',
      },
    },
  },
  plugins: [],
}
