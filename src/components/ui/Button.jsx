/**
 * Base button component with tap feedback and variant styles.
 */

import { Icon } from './Icon'

const VARIANTS = {
  primary:   'bg-[var(--color-primary)] text-white hover:opacity-90',
  secondary: 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-light)]',
  ghost:     'bg-transparent text-[var(--text-tertiary)]',
  danger:    'bg-[var(--bg-error)] text-[var(--color-primary)] border border-[var(--color-primary)]/20',
}

/**
 * @param {{
 *   variant?: 'primary'|'secondary'|'ghost'|'danger',
 *   icon?:    string,
 *   iconSize?: number,
 *   size?:    'sm'|'md'|'lg',
 *   full?:    boolean,
 *   children: React.ReactNode,
 *   className?: string,
 * } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({
  variant = 'secondary',
  icon,
  iconSize = 14,
  size = 'md',
  full = false,
  children,
  className = '',
  style,
  ...rest
}) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 rounded-lg',
    md: 'text-sm px-4 py-2.5 rounded-[10px]',
    lg: 'text-base px-5 py-3 rounded-card',
  }

  return (
    <button
      className={[
        'tap inline-flex items-center justify-center gap-2 font-semibold',
        'font-[Inter] cursor-pointer border-0 outline-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANTS[variant],
        sizeClasses[size],
        full ? 'w-full' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={style}
      {...rest}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
    </button>
  )
}
