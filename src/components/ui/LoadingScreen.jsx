export function LoadingScreen({ text = 'Cargando...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)]">
      <svg
        width="32" height="32" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className="animate-spin" style={{ flexShrink: 0 }}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span className="text-sm text-[var(--text-tertiary)] font-[Inter]">{text}</span>
    </div>
  )
}

export function NotFoundScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-8 text-center">
      <svg
        width="48" height="48" viewBox="0 0 24 24" fill="none"
        stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        style={{ flexShrink: 0 }}
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
        <polyline points="14 2 14 8 20 8"/>
        <path d="M9.5 12.5a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.5 3.5"/>
        <line x1="12" y1="20" x2="12.01" y2="20"/>
      </svg>
      <div className="text-lg font-bold text-[var(--text-primary)] font-[Inter]">Proyecto no encontrado</div>
      <div className="text-sm text-[var(--text-tertiary)]">Verificá el link o pedí acceso al productor.</div>
      <a href="/" className="text-sm text-[var(--color-secondary)] underline">Volver al inicio</a>
    </div>
  )
}
