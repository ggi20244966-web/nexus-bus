import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        space: { 950: '#030712', 900: '#070d1f', 800: '#0d1530', 700: '#18214a' },
        accent: { violet: '#8B5CF6', magenta: '#EC4899' },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
      },
      boxShadow: {
        'glow-violet': '0 0 28px -4px rgba(139,92,246,.55)',
        'glow-magenta': '0 0 28px -4px rgba(236,72,153,.5)',
        glass: '0 10px 40px -12px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.08)',
      },
      keyframes: {
        pulseDot: { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '.45', transform: 'scale(1.5)' } },
      },
      animation: { pulseDot: 'pulseDot 1.8s ease-in-out infinite' },
    },
  },
  plugins: [],
} satisfies Config;