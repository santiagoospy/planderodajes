/**
 * Horizontal scrollable tab bar.
 *
 * @param {{
 *   tabs:     Array<[key: string, label: string]>,
 *   active:   string,
 *   onChange: (key: string) => void,
 *   color?:   string,
 * }} props
 */
export function TabBar({ tabs, active, onChange, color = 'var(--color-primary)' }) {
  return (
    <div className="flex overflow-x-auto gap-1 pb-1 hide-scrollbar">
      {tabs.map(([key, label]) => {
        const isActive = key === active
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className="tap flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide font-[Inter] cursor-pointer border-0"
            style={{
              background: isActive ? color : 'var(--bg-card)',
              color:      isActive ? '#fff' : 'var(--text-tertiary)',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
