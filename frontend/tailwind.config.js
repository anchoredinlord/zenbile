/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Zenbil brand colors
        primary: {
          50:  '#fef3f2',
          100: '#fde8e6',
          500: '#e85d3f',
          600: '#d4492c',
          700: '#b33820',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
