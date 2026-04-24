/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:     '#141210',
          text:   '#F0EBE1',
          accent: '#C9973A',
        },
        severity: {
          critical: '#E04B4B',
          high:     '#EF9F27',
          medium:   '#C9973A',
          low:      '#639922',
          info:     '#378ADD',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}