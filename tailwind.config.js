/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Orbitron"', '"Space Mono"', 'monospace'],
        body:    ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        beat: {
          bg:      '#050508',
          surface: '#0d0d14',
          card:    '#111119',
          border:  '#1e1e2e',
          bordhi:  '#2a2a40',
          cyan:    '#00e5ff',
          yellow:  '#ffe600',
          purple:  '#b56aff',
          coral:   '#ff4d6d',
          green:   '#00ffaa',
          muted:   '#44445a',
          text:    '#e8e8f0',
          sub:     '#8888aa',
          glass:   'rgba(255,255,255,0.04)',
          glasshi: 'rgba(0,229,255,0.06)',
        }
      },
      backgroundImage: {
        'glow-cyan':   'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.12) 0%, transparent 70%)',
        'glow-yellow': 'radial-gradient(ellipse at 50% 100%, rgba(255,230,0,0.08) 0%, transparent 70%)',
        'grid-lines':  'linear-gradient(rgba(0,229,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.04) 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-cyan':   '0 0 20px rgba(0,229,255,0.25), 0 0 60px rgba(0,229,255,0.08)',
        'glow-yellow': '0 0 20px rgba(255,230,0,0.25), 0 0 60px rgba(255,230,0,0.08)',
        'glow-sm':     '0 0 8px rgba(0,229,255,0.3)',
        'card':        '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-dot':  'pulseDot 1.5s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'scan':       'scan 3s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseDot:  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
        glowPulse: { '0%,100%': { boxShadow: '0 0 8px rgba(0,229,255,0.2)' }, '50%': { boxShadow: '0 0 24px rgba(0,229,255,0.5)' } },
        scan:      { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100vh)' } },
      }
    }
  },
  plugins: []
}
