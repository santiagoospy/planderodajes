/**
 * ScoutingView — stub (migration in progress)
 * TODO: Extract full implementation from legacy index.html
 */
export default function ScoutingView({ onBack, ...props }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-8 text-center">
      <div className="text-lg font-bold text-[var(--text-primary)] font-[Inter] mb-2">Scouting</div>
      <div className="text-sm text-[var(--text-tertiary)] mb-6">Vista en migración</div>
      {onBack && (
        <button onClick={onBack} className="tap px-4 py-2 rounded-btn bg-[var(--bg-secondary)] border border-[var(--border-light)] text-sm font-semibold text-[var(--text-secondary)] font-[Inter] cursor-pointer">
          Volver
        </button>
      )}
    </div>
  )
}
