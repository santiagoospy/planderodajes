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
