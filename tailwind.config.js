/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        beat: {
          bg:      '#0a0a0a',
          surface: '#141414',
          card:    '#1a1a1a',
          border:  '#2a2a2a',
          accent:  '#c8f53d',
          purple:  '#a78bfa',
          coral:   '#fb7185',
          amber:   '#fbbf24',
          teal:    '#2dd4bf',
          muted:   '#525252',
          text:    '#e5e5e5',
          sub:     '#a3a3a3',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.5s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
      }
    }
  },
  plugins: []
}
