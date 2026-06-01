/**
 * Single source of truth for workspace / productora color themes.
 *
 * Each theme has:
 *   - grad:   CSS background (solid color or gradient)
 *   - label:  human-readable name (UI pickers)
 *   - light:  true  → background is light, use DARK text
 *             false → background is dark/saturated, use WHITE text
 *   - accent: solid color used as the UI accent (buttons, borders, tab
 *             underlines) on the light interior pages (scenes, citaciones…).
 *             Must read well on a light background.
 */
export const THEMES = {
  celeste:  { grad: 'linear-gradient(165deg, #084C5A 0%, #0B7285 50%, #2EC4B6 100%)', label: 'Celeste', light: false, accent: '#0B7285' },
  coral:    { grad: '#C45A3C',                                                         label: 'Coral',   light: false, accent: '#C45A3C' },
  oscuro:   { grad: 'linear-gradient(165deg, #1E1E2A 0%, #2A2A3A 50%, #363648 100%)', label: 'Oscuro',  light: false, accent: '#3A3A4E' },
  claro:    { grad: '#F1FAEE',                                                         label: 'Claro',   light: true,  accent: '#0B7285' },
  // Ámbar: fondo cálido saturado → texto BLANCO (light: false)
  amarillo: { grad: '#F5A52A',                                                         label: 'Ámbar',   light: false, accent: '#D98B0E' },
}

/** Order shown in the main pickers (excludes "claro" which is a light variant). */
export const THEME_KEYS = ['celeste', 'coral', 'oscuro', 'amarillo']

/** Legacy / alias keys kept so older productoras keep rendering. */
const THEME_ALIASES = {
  ambar:   'amarillo',
  amber:   'amarillo',
  naranja: 'coral',
  gris:    'oscuro',
  verde:   'celeste',
  violeta: 'coral',
  rojo:    'coral',
  rosado:  'coral',
}

/** Resolve any (possibly legacy) key to a canonical theme object. */
export function getTheme(key) {
  const canonical = THEME_ALIASES[key] || key
  return THEMES[canonical] || THEMES.celeste
}

/**
 * CSS custom-property overrides for a productora theme.
 *
 * Applied inline on the project root container so the ENTIRE interior
 * (cards, inputs, text, borders) re-skins automatically from the
 * shared `var(--token)` design tokens — no per-component edits needed.
 *
 * The container itself paints the gradient; here `--bg-primary` and
 * `--bg-header` become transparent so the gradient shows through, and
 * cards/inputs become translucent "glass" that reads on the gradient.
 *
 * Returns an object suitable for spreading into a React `style` prop.
 */
export function getThemeVars(key) {
  const t = getTheme(key)
  if (t.light) {
    // Light gradient/background → dark text, subtle dark glass.
    return {
      '--theme-grad':              t.grad,
      '--bg-primary':              'transparent',
      '--bg-secondary':            'rgba(255,255,255,0.72)',
      '--bg-card-dark':            'rgba(0,0,0,0.04)',
      '--bg-card-dark-secondary':  'rgba(0,0,0,0.08)',
      '--bg-header':               'transparent',
      '--bg-error':                'rgba(239,68,68,0.12)',
      '--bg-elevated':             '#ffffff',
      '--text-primary':            '#1a1714',
      '--text-secondary':          '#403b36',
      '--text-tertiary':           '#6a6560',
      '--text-muted':              '#8a847e',
      '--text-light':              '#aaa49e',
      '--border-light':            'rgba(0,0,0,0.1)',
    }
  }
  // Dark/saturated gradient → white text, white glass.
  return {
    '--theme-grad':              t.grad,
    '--bg-primary':              'transparent',
    '--bg-secondary':            'rgba(255,255,255,0.10)',
    '--bg-card-dark':            'rgba(255,255,255,0.07)',
    '--bg-card-dark-secondary':  'rgba(255,255,255,0.14)',
    '--bg-header':               'transparent',
    '--bg-error':                'rgba(239,68,68,0.18)',
    '--bg-elevated':             '#1f1d1a',
    '--text-primary':            '#ffffff',
    '--text-secondary':          'rgba(255,255,255,0.86)',
    '--text-tertiary':           'rgba(255,255,255,0.66)',
    '--text-muted':              'rgba(255,255,255,0.5)',
    '--text-light':              'rgba(255,255,255,0.36)',
    '--border-light':            'rgba(255,255,255,0.15)',
  }
}
