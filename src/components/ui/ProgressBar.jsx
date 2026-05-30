export function ProgressBar({ pct = 0, color = 'var(--color-primary)', height = 4 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'var(--bg-card)' }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
      />
    </div>
  )
}
