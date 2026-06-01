import { useEffect, useRef, useState } from 'react'

/**
 * Fullscreen image lightbox.
 *
 * Props:
 *   images   – array of { src, alt? } objects
 *   index    – initial index to show (-1 or undefined = closed)
 *   onClose  – callback to close
 */
export function ImageLightbox({ images = [], index: initialIndex = 0, onClose }) {
  const [idx, setIdx] = useState(initialIndex)
  const touchStartX = useRef(null)

  // Sync when parent reopens with a new index
  useEffect(() => { setIdx(initialIndex) }, [initialIndex])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, images.length - 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  if (!images.length) return null

  const current = images[Math.min(idx, images.length - 1)]

  const prev = (e) => { e.stopPropagation(); setIdx(i => Math.max(i - 1, 0)) }
  const next = (e) => { e.stopPropagation(); setIdx(i => Math.min(i + 1, images.length - 1)) }

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null) return
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) > 40) {
      if (diff < 0) setIdx(i => Math.min(i + 1, images.length - 1))
      else          setIdx(i => Math.max(i - 1, 0))
    }
    touchStartX.current = null
  }

  return (
    <div
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        userSelect: 'none',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16,
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)', border: 'none',
          color: '#fff', fontSize: 20, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10,
        }}
      >✕</button>

      {/* Prev */}
      {images.length > 1 && idx > 0 && (
        <button
          onClick={prev}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >‹</button>
      )}

      {/* Image */}
      <img
        src={current.src}
        alt={current.alt || ''}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '100%', maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: 10,
          boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      />

      {/* Next */}
      {images.length > 1 && idx < images.length - 1 && (
        <button
          onClick={next}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10,
          }}
        >›</button>
      )}

      {/* Counter */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'inherit',
          background: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: '4px 12px',
        }}>
          {idx + 1} / {images.length}
        </div>
      )}
    </div>
  )
}
