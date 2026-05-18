import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}', './index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        lore: {
          bg:      '#F8FAFC',
          surface: '#1E293B',
          border:  '#334155',
          accent:  '#2563EB',
          accent2: '#4F46E5',
        },
      },
      borderRadius: { xl: '12px', '2xl': '16px' },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        modal: '0 20px 60px rgba(0,0,0,0.2)',
      },
    },
  },
  plugins: [],
} satisfies Config
