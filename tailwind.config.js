/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emobi: {
          yellow: '#FFE600',       // Amarillo Neón principal
          'yellow-warm': '#FFD000',  // Amarillo Cálido secundario
          'yellow-light': '#FFF9C4', // Tinte suave
          black: '#111111',         // Negro Azabache cubista
          'gray-light': '#F8F9FA',   // Fondo neutro ultra claro
          'gray-card': '#F1F3F5',    // Tarjetas y paneles
          'gray-border': '#222222',  // Bordes contrastados
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        syne: ['"National Park"', 'sans-serif'],
        unbounded: ['"National Park"', 'sans-serif'],
        space: ['"National Park"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // Sombras translúcidas y difusas (glassmorfismo)
        'glass-sm': '0 4px 18px rgba(17, 17, 17, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'glass': '0 8px 32px rgba(17, 17, 17, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65)',
        'glass-lg': '0 18px 48px rgba(17, 17, 17, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        'glass-xl': '0 28px 64px rgba(17, 17, 17, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.75)',
        'glass-yellow': '0 10px 30px rgba(255, 230, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        'glow-yellow': '0 0 0 1px rgba(255, 230, 0, 0.5), 0 12px 36px rgba(255, 208, 0, 0.40)',
        'inner-glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.7), inset 0 -1px 0 rgba(17, 17, 17, 0.04)',
      },
      backdropBlur: {
        xs: '2px',
        glass: '18px',
        heavy: '28px',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'aurora': 'aurora 18s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(0, -12px, 0) scale(1.04)' },
        },
      },
    },
  },
  plugins: [],
}
