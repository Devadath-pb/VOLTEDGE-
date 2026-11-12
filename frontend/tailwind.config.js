/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#16A34A',
        darkgreen: '#14532D',
        bright: '#22C55E',
        mint: '#DCFCE7',
        lightmint: '#F0FDF4',
        pagebg: '#F7FBF8',
        ink: '#102A22',
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px rgba(22, 163, 74, 0.10)',
        'glass-lg': '0 16px 48px rgba(22, 163, 74, 0.16)',
      },
      borderRadius: {
        glass: '20px',
      },
    },
  },
  plugins: [],
}
