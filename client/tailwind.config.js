/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f1f5f9',
          card:    '#ffffff',
          hover:   '#f8fafc',
          border:  '#e2e8f0',
        },
        prio: {
          0: '#ef4444',   // red    — Do Now
          1: '#f97316',   // orange — Do Today
          2: '#eab308',   // yellow — This Week
          3: '#3b82f6',   // blue   — Weekend
          4: '#6b7280',   // gray
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in':   'fadeIn 0.2s ease-out',
        'slide-in':  'slideIn 0.3s ease-out',       // ← for notifications
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        slideIn: {                                   // ← slide in from right
          from: { opacity: 0, transform: 'translateX(100%)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};