import { Icon } from './Icon'

export function LoadingScreen({ text = 'Cargando...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)]">
      <Icon name="Loader" size={32} color="var(--text-muted)" className="animate-spin" />
      <span className="text-sm text-[var(--text-tertiary)] font-[Inter]">{text}</span>
    </div>
  )
}

export function NotFoundScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-8 text-center">
      <Icon name="FileQuestion" size={48} color="var(--text-muted)" />
      <div className="text-lg font-bold text-[var(--text-primary)] font-[Inter]">Proyecto no encontrado</div>
      <div className="text-sm text-[var(--text-tertiary)]">Verificá el link o pedí acceso al productor.</div>
      <a href="/" className="text-sm text-[var(--color-secondary)] underline">Volver al inicio</a>
    </div>
  )
}
