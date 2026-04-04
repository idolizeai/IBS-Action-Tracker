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
          0: '#ef4444',   // red
          1: '#f97316',   // orange
          2: '#eab308',   // yellow
          3: '#3b82f6',   // blue
          4: '#6b7280',   // gray
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
};
