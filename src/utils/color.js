/**
 * Color helpers for legibility.
 * Backgrounds in the app can be light (celeste, ámbar, naranja…), so any text or
 * icon painted in the same hue must be darkened enough to read against a light tint.
 */

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))

export const parseHex = (hex) => {
  if (!hex || typeof hex !== 'string') return null
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (h.length !== 6) return null
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if ([r, g, b].some(Number.isNaN)) return null
  return { r, g, b }
}

const toHex = ({ r, g, b }) => '#' + [r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('')

// Perceived luminance (0 = black, 255 = white)
export const luminance = (hex) => {
  const c = parseHex(hex)
  if (!c) return 128
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
}

/** Mix a color toward black by `amount` (0..1). */
export const darken = (hex, amount = 0.35) => {
  const c = parseHex(hex)
  if (!c) return hex
  return toHex({ r: c.r * (1 - amount), g: c.g * (1 - amount), b: c.b * (1 - amount) })
}

/** Mix a color toward white by `amount` (0..1). */
export const lighten = (hex, amount = 0.4) => {
  const c = parseHex(hex)
  if (!c) return hex
  return toHex({ r: c.r + (255 - c.r) * amount, g: c.g + (255 - c.g) * amount, b: c.b + (255 - c.b) * amount })
}

/**
 * Return a hue-preserving version of `hex` that reads as text/icon on the
 * current themed surface.
 *  - On a LIGHT surface: darken light colors so they don't wash out.
 *  - On a DARK / saturated surface (productora gradients): brighten dark
 *    colors so the dept accent still pops against the gradient.
 * Keeps the brand hue instead of falling back to flat white/black.
 */
export const onSurface = (hex, lightSurface) => {
  if (lightSurface) return readableText(hex)
  const lum = luminance(hex)
  if (lum >= 170) return hex
  if (lum < 80)  return lighten(hex, 0.62)
  if (lum < 120) return lighten(hex, 0.5)
  if (lum < 150) return lighten(hex, 0.36)
  return lighten(hex, 0.22)
}

/** Pick white or a dark ink for text placed ON TOP of a solid `hex` background. */
export const contrastText = (hex) => (luminance(hex) > 165 ? '#1a1a1a' : '#ffffff')

/**
 * Return a version of `hex` dark enough to read as text/icon over a light background.
 * Light colors get darkened more; already-dark colors are left mostly as-is.
 */
export const readableText = (hex) => {
  const lum = luminance(hex)
  if (lum > 200) return darken(hex, 0.55)
  if (lum > 150) return darken(hex, 0.4)
  if (lum > 110) return darken(hex, 0.25)
  return hex
}
