/**
 * Wrapper around lucide-react icons.
 * Usage: <Icon name="Camera" size={20} color="currentColor" />
 */

import * as LucideIcons from 'lucide-react'

export function Icon({ name, size = 18, color = 'currentColor', strokeWidth = 1.8, className = '', style }) {
  const LucideIcon = LucideIcons[name]
  if (!LucideIcon) {
    if (import.meta.env.DEV) console.warn(`[Icon] Unknown icon: "${name}"`)
    return null
  }
  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      style={{ flexShrink: 0, ...style }}
    />
  )
}
