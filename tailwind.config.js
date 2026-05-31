/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './index.js',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        smc: {
          green:       '#2E7D32',
          'green-dark': '#1B5E20',
          'green-light': '#4CAF50',
          card:        '#FFFFFF',
          'card-dark': '#1E1E1E',
        },
      },
    },
  },
  plugins: [],
};
