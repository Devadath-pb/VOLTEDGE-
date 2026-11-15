/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#16A34A',
        lime: '#16A34A',
        darkgreen: '#14532D',
        bright: '#22C55E',
        mint: '#DCFCE7',
        lightmint: '#F0FDF4',
        pagebg: '#F7FBF8',
        ink: '#102A22',
        muted: '#64748B',
        line: '#D7E9DC',
        'lime-dark': '#15803D',
        deep: '#14532D',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 16px 38px rgba(21, 128, 61, 0.08)',
        'glass-lg': '0 22px 44px rgba(21, 128, 61, 0.13)',
      },
      borderRadius: {
        glass: '14px',
      },
    },
  },
  plugins: [],
}
