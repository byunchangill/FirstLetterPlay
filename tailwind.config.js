/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'world-consonant': '#C8E6C9',
        'world-vowel': '#B3E5FC',
        'world-number': '#FFF9C4',
        'world-alphabet': '#FFE0B2',
        'star-gold': '#FFD700',
        'correct': '#4CAF50',
        'wrong': '#EF9A9A',
      },
      fontFamily: {
        sans: ['"Gowun Dodum"', 'sans-serif'],
        jua: ['"Jua"', 'sans-serif'],
        gaegu: ['"Gaegu"', 'sans-serif'],
      },
      screens: {
        'sm': '375px',
        'md': '768px',
        'lg': '1024px',
      },
    },
  },
  plugins: [],
}
