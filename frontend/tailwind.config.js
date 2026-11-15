/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#C7F04A',
        lime: '#C7F04A',
        darkgreen: '#17211B',
        bright: '#8FE5D4',
        mint: '#E9F5B9',
        lightmint: '#F6F8ED',
        pagebg: '#F4F5EF',
        ink: '#17211B',
        muted: '#728078',
        line: '#DCE2D7',
        'lime-dark': '#6B8D12',
        deep: '#0D1511',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 12px 30px rgba(32, 54, 38, 0.06)',
        'glass-lg': '0 18px 38px rgba(32, 54, 38, 0.11)',
      },
      borderRadius: {
        glass: '14px',
      },
    },
  },
  plugins: [],
}
