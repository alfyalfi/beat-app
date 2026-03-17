/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body:    ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        m: {
          // Backgrounds
          bg:       '#f8f9fb',
          surface:  '#ffffff',
          card:     'rgba(255,255,255,0.75)',
          // Borders
          border:   'rgba(0,0,0,0.08)',
          bordhi:   'rgba(0,0,0,0.14)',
          // Text
          text:     '#0f1117',
          sub:      '#4a5568',
          muted:    '#9aa0ad',
          // Accent colors
          cyan:     '#00b4d8',
          cyandark: '#0077a8',
          cyanglow: 'rgba(0,180,216,0.18)',
          yellow:   '#f5a623',
          yelldark: '#c47d00',
          yellglow: 'rgba(245,166,35,0.18)',
          // Status
          coral:    '#f05252',
          green:    '#10b981',
          purple:   '#8b5cf6',
          // Surfaces
          frost:    'rgba(255,255,255,0.6)',
          frosthi:  'rgba(255,255,255,0.88)',
        }
      },
      boxShadow: {
        'card':      '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-md':   '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.06)',
        'card-lift': '0 4px 20px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
        'neon-cyan': '0 0 0 1.5px rgba(0,180,216,0.35), 0 0 12px rgba(0,180,216,0.2)',
        'neon-yell': '0 0 0 1.5px rgba(245,166,35,0.35), 0 0 12px rgba(245,166,35,0.2)',
        'inner':     'inset 0 1px 2px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in':   'fadeIn 0.18s ease-out',
        'slide-up':  'slideUp 0.22s ease-out',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
      },
      backdropBlur: {
        xs: '4px',
        sm: '8px',
      }
    }
  },
  plugins: []
}
