/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#111827',
        river: { DEFAULT: '#1E9BD7', dark: '#147BAD', light: '#DCEFFA' },
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
