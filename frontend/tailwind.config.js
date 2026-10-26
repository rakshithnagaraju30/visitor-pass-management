const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}', './public/index.html'],
  theme: {
    extend: {
      // One brand color for the whole app: buttons, links, focus rings, charts
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe7fe',
          200: '#bfd4fe',
          300: '#93b5fd',
          400: '#608dfa',
          500: '#3b68f6',
          600: '#2549eb',
          700: '#1d37d8',
          800: '#1e2faf',
          900: '#1e2d8a',
          950: '#171d54',
        },
        ink: '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        lift: '0 20px 45px -12px rgba(15, 23, 42, 0.18)',
      },
    },
  },
  plugins: [],
};
