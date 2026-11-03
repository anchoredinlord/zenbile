/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fff1f0',
          100: '#ffe0de',
          200: '#ffc6c2',
          300: '#ff9e98',
          400: '#ff6b62',
          500: '#f03e33',   // main brand color — professional red/orange
          600: '#de2519',
          700: '#bb1b10',
          800: '#9a1b12',
          900: '#7f1d13',
        },
        accent: {
          50:  '#fefce8',
          100: '#fef9c3',
          400: '#facc15',
          500: '#eab308',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-hover': '0 4px 12px 0 rgb(0 0 0 / 0.12)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
