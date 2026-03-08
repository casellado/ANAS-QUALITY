import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Tema SEMPRE dark — zero modalità chiara
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Sfondi ─────────────────────────────────────────────
        'brand-bg':       '#080E1A',   // sfondo app principale
        'brand-bg2':      '#0C1524',   // sfondo secondario (input, sidebar)
        'brand-card':     '#0F1D2E',   // sfondo card standard
        'brand-card2':    '#152236',   // sfondo card hover/active

        // ── Bordi ──────────────────────────────────────────────
        'brand-line':     '#1A2E48',   // bordi standard
        'brand-line2':    '#243C5A',   // bordi forti / focus

        // ── Accenti principali ─────────────────────────────────
        'brand-blue':     '#1D6FD8',   // accent primario (pulsanti CTA)
        'brand-blue-l':   '#3B8EF0',   // accent primario chiaro (hover)
        'brand-teal':     '#0C9E89',   // accent secondario
        'brand-teal-l':   '#13C4AB',   // accent secondario chiaro

        // ── Semantici ──────────────────────────────────────────
        'brand-amber':    '#C8860A',   // warning (offline, attenzione)
        'brand-amber-l':  '#F0A824',   // warning chiaro
        'brand-red':      '#C93030',   // errore / pericolo
        'brand-red-l':    '#F05454',   // errore chiaro
        'brand-green':    '#1A8C4E',   // successo / conforme
        'brand-green-l':  '#28C76F',   // successo chiaro
        'brand-violet':   '#5B4AD8',   // accento terziario (terzo modulo)
        'brand-violet-l': '#7C6FF0',   // accento terziario chiaro

        // ── Testo ──────────────────────────────────────────────
        'brand-text':     '#E6EDF8',   // testo principale
        'brand-text2':    '#7A96B8',   // testo secondario / hint
        'brand-text3':    '#3D5570',   // testo disabilitato / placeholder
      },

      fontFamily: {
        sans:  ['Open Sans', 'sans-serif'],           // UI body — font ANAS per strumenti interni
        serif: ['Lora', 'Georgia', 'serif'],          // Wordmark, titoli — simile ad Anas Type
        mono:  ['IBM Plex Mono', 'monospace'],        // codici, badge, numeri
      },

      fontSize: {
        // Scala tipografica ottimizzata per tablet cantiere
        'xs':   ['0.75rem',  { lineHeight: '1rem' }],
        'sm':   ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem',     { lineHeight: '1.5rem' }],
        'lg':   ['1.125rem', { lineHeight: '1.75rem' }],
        'xl':   ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl':  ['1.5rem',   { lineHeight: '2rem' }],
        '3xl':  ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl':  ['2.25rem',  { lineHeight: '2.5rem' }],
      },

      borderRadius: {
        'sm':  '0.375rem',   // 6px
        'md':  '0.5rem',     // 8px
        'lg':  '0.75rem',    // 12px  ← badge
        'xl':  '0.875rem',   // 14px  ← bottoni
        '2xl': '1rem',       // 16px  ← card
        '3xl': '1.5rem',     // 24px  ← modal
      },

      spacing: {
        // Touch target minimo 44px per guanti da cantiere
        'touch': '2.75rem',  // 44px
      },

      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-l': '0 4px 12px rgba(0,0,0,0.5)',
        'glow-blue':  '0 0 20px rgba(29,111,216,0.3)',
        'glow-teal':  '0 0 20px rgba(12,158,137,0.3)',
        'glow-red':   '0 0 20px rgba(201,48,48,0.3)',
      },

      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(8px)' },
                     '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
} satisfies Config
