/**
 * Bottom-sheet modal (mobile-first) or centered modal (tablet+).
 */

import { useEffect } from 'react'

/**
 * @param {{
 *   open:      boolean,
 *   onClose:   () => void,
 *   children:  React.ReactNode,
 *   position?: 'bottom'|'center',
 *   className?: string,
 * }} props
 */
export function Modal({ open, onClose, children, position = 'bottom', className = '' }) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
  }, [open])

  if (!open) return null

  const isBottom = position === 'bottom'

  return (
    <div
      className="fixed inset-0 z-[400] flex"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className={[
          'bg-[var(--bg-secondary)] overflow-y-auto max-h-[90vh]',
          isBottom
            ? 'w-full mt-auto rounded-t-[20px] p-5 pb-8 shadow-modal slide-up'
            : 'mx-auto my-auto rounded-[18px] p-6 w-[calc(100%-40px)] max-w-sm shadow-modal',
          className,
        ].join(' ')}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (bottom sheet only) */}
        {isBottom && (
          <div className="flex justify-center mb-4">
            <div className="w-9 h-1 rounded-full bg-[var(--border-light)]" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
