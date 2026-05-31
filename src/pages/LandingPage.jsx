/**
 * Landing page — entry point for new and returning users.
 * Matches the existing LandingView behavior.
 */

import { useState } from 'react'
import { Icon } from '../components/ui/Icon'
import { NewProductoraView } from '../features/productora/NewProductoraView'
import { MarketplaceView } from '../features/marketplace/MarketplaceView'
import { getPinnedProjects, unpinProject, productoraSlug, buildProjectUrl } from '../utils/urls'
import { SEED_PROJECT } from '../constants/seed'

const THEMES = {
  celeste: 'linear-gradient(165deg, #084C5A 0%, #0B7285 50%, #2EC4B6 100%)',
  coral:   '#C45A3C',
  oscuro:  'linear-gradient(165deg, #1E1E2A 0%, #2A2A3A 50%, #363648 100%)',
}

const LANDING_ACTIONS = [
  { key: 'enter',       icon: 'LogIn',        label: 'Ingresar',               desc: 'Accedé a tu espacio existente' },
  { key: 'create',      icon: 'Plus',         label: 'Crear espacio de trabajo', desc: 'Freelance o productora' },
  { key: 'marketplace', icon: 'ShoppingCart', label: 'Marketplace',            desc: 'Equipos, props y servicios' },
  { key: 'demo',        icon: 'Play',         label: 'Ver demo',               desc: 'Explorar el Proyecto Cero' },
]

export default function LandingPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pdr:landing-theme') || 'celeste')
  const [modo, setModo]   = useState(null)  // null | 'enter' | 'create' | 'marketplace'
  const [codigo, setCodigo] = useState('')
  const [pinnedList, setPinnedList] = useState(() => getPinnedProjects())

  const grad = THEMES[theme] || THEMES.celeste

  const changeTheme = (key) => {
    setTheme(key)
    localStorage.setItem('pdr:landing-theme', key)
  }

  const handleAction = (key) => {
    if (key === 'demo') {
      window.location.href = buildProjectUrl(SEED_PROJECT.id)
      return
    }
    setModo(key)
  }

  const handleEnter = (e) => {
    e?.preventDefault()
    const id = productoraSlug(codigo)
    if (!id) return
    window.location.href = `/?org=${id}`
  }

  const handleOpenPinned = (proj) => {
    window.location.href = buildProjectUrl(proj.id)
  }

  const handleRemovePinned = (id, e) => {
    e.stopPropagation()
    setPinnedList(unpinProject(id))
  }

  return (
    <div
      className="min-h-screen flex flex-col font-[Inter] transition-all duration-300"
      style={{ background: grad }}
    >
      <div className="flex-1 max-w-[480px] mx-auto w-full flex flex-col">
        {/* Header */}
        <div className="px-6 pt-16 pb-8">
          <div className="text-[32px] font-black text-white leading-tight tracking-tight">
            Plan de Rodaje
          </div>
          <div className="text-[15px] text-white/50 mt-2">Organizá tus producciones</div>
        </div>

        {/* Pinned projects */}
        {pinnedList.length > 0 && (
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-white/50 mb-3 uppercase">
              <Icon name="Pin" size={11} color="rgba(255,255,255,0.5)" />
              Acceso directo
            </div>
            <div className="flex flex-col gap-2 mb-5">
              {pinnedList.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => handleOpenPinned(proj)}
                  className="tap flex items-center gap-4 px-4 py-3.5 rounded-[14px] text-left w-full border-0 cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <div
                    className="flex items-center justify-center flex-shrink-0 rounded-[11px]"
                    style={{ width: 40, height: 40, background: proj.color || '#0B7285' }}
                  >
                    <Icon name="Clapperboard" size={18} color="rgba(255,255,255,0.9)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-white truncate">{proj.nombre}</div>
                    <div className="text-xs text-white/40">Abrir proyecto</div>
                  </div>
                  <span
                    onClick={(e) => handleRemovePinned(proj.id, e)}
                    className="text-base text-white/30 px-2 py-1 rounded-lg cursor-pointer"
                  >✕</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main actions */}
        {!modo && (
          <div className="flex flex-col px-5 gap-0">
            {LANDING_ACTIONS.map((action, i) => (
              <button
                key={action.key}
                onClick={() => handleAction(action.key)}
                className="tap flex items-center gap-4 py-4 px-1 text-left w-full border-0 cursor-pointer bg-transparent"
                style={{ borderBottom: i < LANDING_ACTIONS.length - 1 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}
              >
                <div
                  className="flex items-center justify-center flex-shrink-0 rounded-[11px]"
                  style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.15)' }}
                >
                  <Icon name={action.icon} size={18} color="rgba(255,255,255,0.9)" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-white">{action.label}</div>
                  <div className="text-[13px] text-white/50 mt-0.5">{action.desc}</div>
                </div>
                <Icon name="ChevronRight" size={18} color="rgba(255,255,255,0.3)" />
              </button>
            ))}
          </div>
        )}

        {/* Enter mode — code input */}
        {modo === 'enter' && (
          <div className="px-5 slide-up">
            <button onClick={() => setModo(null)} className="tap flex items-center gap-2 text-white/60 text-sm mb-6 bg-transparent border-0 cursor-pointer">
              <Icon name="ChevronLeft" size={16} color="rgba(255,255,255,0.6)" />
              Volver
            </button>
            <div className="text-xl font-bold text-white mb-6">Ingresar a tu espacio</div>
            <form onSubmit={handleEnter}>
              <input
                value={codigo}
                onChange={e => setCodigo(e.target.value)}
                placeholder="Código de tu productora..."
                autoFocus
                className="w-full rounded-[14px] px-4 py-3.5 text-base outline-none mb-4 font-[Inter]"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <button
                type="submit"
                disabled={!codigo.trim()}
                className="tap w-full py-3.5 rounded-[14px] text-base font-bold text-white border-0 cursor-pointer disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                Ingresar
              </button>
            </form>
          </div>
        )}

        {/* Create mode — new productora */}
        {modo === 'create' && (
          <NewProductoraView
            onCreated={(prod) => {
              window.location.href = `/?org=${prod.id}`
            }}
            onCancel={() => setModo(null)}
          />
        )}

        {/* Marketplace mode */}
        {modo === 'marketplace' && (
          <MarketplaceView onBack={() => setModo(null)} />
        )}
      </div>

      {/* Theme picker */}
      <div className="flex items-center justify-center gap-3 pb-8 pt-6 max-w-[480px] mx-auto w-full">
        {Object.entries(THEMES).filter(([k]) => ['celeste','coral','oscuro'].includes(k)).map(([key, grad]) => (
          <button
            key={key}
            onClick={() => changeTheme(key)}
            className="rounded-full border-0 cursor-pointer transition-all duration-200 p-0 flex-shrink-0"
            style={{
              width:  theme === key ? 32 : 22,
              height: theme === key ? 32 : 22,
              background: grad,
              border: theme === key ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
