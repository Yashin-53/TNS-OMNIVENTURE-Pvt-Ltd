/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10303B', // deep river-teal, used for text and dark surfaces
        river: { DEFAULT: '#0F766E', dark: '#0B5A54', light: '#D5EEEA' }, // main brand colour
        marigold: { DEFAULT: '#F5A524', dark: '#DB8E0C' }, // accent for the main call to action
        mist: '#F2F6F5', // page background
        line: '#DCE5E3', // borders
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        body: ['Figtree', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
