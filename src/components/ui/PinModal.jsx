/**
 * 4-digit PIN entry modal.
 */

import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Icon } from './Icon'
import { hashPin } from '../../utils/hash'

export function PinModal({ title, subtitle, onSuccess, onCancel, correctPin, pinHash }) {
  const [pin, setPin]     = useState('')
  const [error, setError] = useState(false)

  const digits = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  const press = async (d) => {
    if (d === '⌫') { setPin(p => p.slice(0, -1)); setError(false); return }
    if (!d || pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setError(false)
    if (next.length === 4) {
      const ok = pinHash
        ? await hashPin(next) === pinHash
        : next === correctPin
      if (ok) { onSuccess(); setPin('') }
      else { setError(true); setTimeout(() => setPin(''), 500) }
    }
  }

  return (
    <Modal open onClose={onCancel} position="center">
      <div className="text-center mb-6">
        <div className="flex justify-center mb-3">
          <Icon name="Lock" size={32} color="var(--text-primary)" />
        </div>
        <div className="text-lg font-bold text-[var(--text-primary)] font-[Inter]">{title}</div>
        {subtitle && <div className="text-xs text-[var(--text-tertiary)] mt-1">{subtitle}</div>}
      </div>

      {/* PIN dots */}
      <div className="flex justify-center gap-3 mb-7">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={[
              'w-3.5 h-3.5 rounded-full border-2 transition-all duration-150',
              pin.length > i
                ? (error ? 'bg-red-500 border-red-500' : 'bg-[var(--color-primary)] border-[var(--color-primary)]')
                : 'bg-transparent border-[var(--text-muted)]',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3">
        {digits.map((d, i) => (
          <button
            key={i}
            onClick={() => press(d)}
            disabled={!d && d !== '0'}
            className={[
              'tap h-14 rounded-card text-xl font-semibold font-[Inter]',
              'bg-[var(--bg-card)] text-[var(--text-primary)]',
              d ? 'cursor-pointer' : 'opacity-0 pointer-events-none',
            ].join(' ')}
          >
            {d}
          </button>
        ))}
      </div>

      {onCancel && (
        <Button variant="ghost" full className="mt-4 text-[var(--text-tertiary)]" onClick={onCancel}>
          Cancelar
        </Button>
      )}
    </Modal>
  )
}
