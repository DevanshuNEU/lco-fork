import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        saar: {
          bg: '#1a1a1a',
          card: '#242424',
          hover: '#2e2e2e',
          border: '#333333',
          text: '#e8e6e3',
          secondary: '#a0a0a0',
          muted: '#6b6b6b',
          accent: '#c15f3c',
          'accent-light': 'rgba(193, 95, 60, 0.15)',
          green: '#4caf50',
          yellow: '#f5a623',
          orange: '#ff9800',
          red: '#e53935',
        },
      },
      fontFamily: {
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      animation: {
        'tick-up': 'tick-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
      keyframes: {
        'tick-up': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [typography],
}

export default config
