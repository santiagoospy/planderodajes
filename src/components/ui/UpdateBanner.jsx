import { useState, useEffect } from 'react'

export function UpdateBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onUpdate = () => setShow(true)
    window.addEventListener('swUpdated', onUpdate)
    return () => window.removeEventListener('swUpdated', onUpdate)
  }, [])

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: '#1a1714',
      color: '#fff',
      borderRadius: 14,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
      fontFamily: 'inherit',
      fontSize: 13,
      whiteSpace: 'nowrap',
      maxWidth: 'calc(100vw - 32px)',
    }}>
      <span style={{ opacity: 0.75 }}>🆕 Nueva versión disponible</span>
      <button
        onClick={() => window.location.reload()}
        style={{
          background: '#0fa87e',
          color: '#fff',
          border: 'none',
          borderRadius: 9,
          padding: '7px 16px',
          fontFamily: 'inherit',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Actualizar
      </button>
      <button
        onClick={() => setShow(false)}
        style={{
          background: 'rgba(255,255,255,0.1)',
          color: '#fff',
          border: 'none',
          borderRadius: 9,
          padding: '7px 10px',
          fontFamily: 'inherit',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Ahora no
      </button>
    </div>
  )
}
