/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        primary: '#dc2626', // red-600
        'primary-dark': '#b91c1c', // red-700
        'primary-darker': '#991b1b', // red-800
        secondary: '#f3f4f6', // gray-100
        'text-primary': '#ffffff', // white
        'text-secondary': '#1f2937', // gray-800
        accent: '#dc2626', // red-600 for consistency
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        scroll: 'scroll 20s linear infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
