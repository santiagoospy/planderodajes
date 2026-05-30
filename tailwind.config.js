/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        success: 'var(--color-success)',
        // Background tokens
        'bg-primary':    'var(--bg-primary)',
        'bg-secondary':  'var(--bg-secondary)',
        'bg-card':       'var(--bg-card-dark)',
        'bg-header':     'var(--bg-header)',
        // Text tokens
        'text-primary':   'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary':  'var(--text-tertiary)',
        'text-muted':     'var(--text-muted)',
        // Border
        'border-light': 'var(--border-light)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      screens: {
        'xs':  '480px',
        'sm':  '640px',
        'md':  '768px',   // iPad
        'lg':  '1024px',  // iPad Pro landscape / Desktop
        'xl':  '1280px',
        '2xl': '1400px',
      },
      maxWidth: {
        'app': 'var(--app-max-width)',
      },
      borderRadius: {
        'card': '14px',
        'btn':  '10px',
      },
      boxShadow: {
        'card': '0 1px 4px rgba(0,0,0,0.06)',
        'modal': '0 16px 60px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
}
