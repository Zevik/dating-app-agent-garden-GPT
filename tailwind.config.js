/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        primary: '#E03177',
        secondary: '#3B82F6',
        success: '#22C55E',
        danger: '#EF4444'
      },
      borderRadius: {
        xl: '1.25rem'
      },
      fontFamily: {
        sans: ['"Heebo"', '"Assistant"', '"Inter"', 'sans-serif']
      }
    }
  },
  plugins: [require('tailwindcss-rtl'), require('@tailwindcss/forms')]
};
