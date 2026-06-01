/**
 * Landing page — entry point for new and returning users.
 * Matches the existing LandingView behavior.
 */

import { useState, useEffect } from 'react'
import { Icon } from '../components/ui/Icon'
import { NewProductoraView } from '../features/productora/NewProductoraView'
import { MarketplaceView } from '../features/marketplace/MarketplaceView'
import { getPinnedProjects, unpinProject, productoraSlug, buildProjectUrl, buildProductoraUrl } from '../utils/urls'
import { SEED_PROJECT } from '../constants/seed'
import { api } from '../services/api'
import { THEME_KEYS, getTheme } from '../constants/themes'

const LANDING_ACTIONS = [
  { key: 'enter',       icon: 'LogIn',        label: 'Ingresar',               desc: 'Accedé a tu espacio existente' },
  { key: 'create',      icon: 'Plus',         label: 'Crear espacio de trabajo', desc: 'Freelance o productora' },
  { key: 'marketplace', icon: 'ShoppingCart', label: 'Marketplace',            desc: 'Equipos, props y servicios' },
  { key: 'demo',        icon: 'Play',         label: 'Ver demo',               desc: 'Explorar el Proyecto Cero' },
  { key: 'admin',       icon: 'Settings',     label: 'Admin',                  desc: 'Ver productoras y proyectos' },
]

function AdminPinPrompt({ onCorrect, onBack }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const check = () => {
    if (pin === '4862') { onCorrect() }
    else { setError('PIN incorrecto'); setPin('') }
  }

  return (
    <div className="px-5 slide-up">
      <button onClick={onBack} className="tap flex items-center gap-2 text-white/60 text-sm mb-6 bg-transparent border-0 cursor-pointer">
        <Icon name="ChevronLeft" size={16} color="rgba(255,255,255,0.6)" />
        Volver
      </button>
      <div className="text-xl font-bold text-white mb-2">Admin</div>
      <div className="text-sm text-white/50 mb-6">Ingresá el PIN para continuar</div>
      <input
        type="password"
        value={pin}
        onChange={e => { setPin(e.target.value); setError('') }}
        onKeyDown={e => e.key === 'Enter' && check()}
        placeholder="PIN"
        autoFocus
        className="w-full rounded-[14px] px-4 py-3.5 text-base outline-none mb-3 font-[Inter] text-center tracking-widest"
        style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
      />
      {error && <div className="text-red-300 text-sm text-center mb-3">{error}</div>}
      <button
        onClick={check}
        disabled={!pin}
        className="tap w-full py-3.5 rounded-[14px] text-base font-bold text-white border-0 cursor-pointer disabled:opacity-40"
        style={{ background: 'rgba(255,255,255,0.2)' }}
      >
        Ingresar
      </button>
    </div>
  )
}

function AdminView({ onBack }) {
  const [productoras,  setProductoras]  = useState([])
  const [projects,     setProjects]     = useState([])
  const [loading,      setLoading]      = useState(true)
  const [confirmDel,   setConfirmDel]   = useState(null)  // { type, id, label }
  const [deleting,     setDeleting]     = useState(null)
  const [deleteError,  setDeleteError]  = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([api.listProductoras(), api.listProjects()])
      .then(([pRes, projRes]) => {
        setProductoras(pRes?.items || [])
        setProjects(projRes?.projects || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    if (!confirmDel) return
    setDeleting(confirmDel.id)
    setDeleteError('')
    const key = confirmDel._blobKey || confirmDel.id
    try {
      await api.delete(confirmDel.type === 'productora' ? 'productoras' : 'projects', key)
      if (confirmDel.type === 'productora') setProductoras(prev => prev.filter(p => (p._blobKey || p.id) !== key))
      else setProjects(prev => prev.filter(p => (p._blobKey || p.id) !== key))
      setConfirmDel(null)
    } catch (e) {
      setDeleteError('Error al borrar: ' + (e.message || 'intenta de nuevo'))
    } finally {
      setDeleting(null)
    }
  }

  // Solo proyectos reales creados (excluye el demo / Proyecto Cero)
  const realProjects = projects.filter(p => (p._blobKey || p.id) !== SEED_PROJECT.id && p.id !== SEED_PROJECT.id)

  const countByProductora = {}
  realProjects.forEach(p => {
    if (!p.productoraId) return
    countByProductora[p.productoraId] = (countByProductora[p.productoraId] || 0) + 1
  })

  const DelBtn = ({ type, id, blobKey, label }) => (
    <button
      onClick={e => { e.stopPropagation(); setConfirmDel({ type, id, _blobKey: blobKey, label }); setDeleteError('') }}
      className="flex-shrink-0 tap"
      style={{ background: 'rgba(255,80,60,0.2)', border: 'none', borderRadius: 8, color: 'rgba(255,160,140,0.9)', fontSize: 12, cursor: 'pointer', padding: '5px 10px', fontFamily: 'inherit' }}
    >
      <Icon name="Trash2" size={13} color="currentColor" />
    </button>
  )

  return (
    <div className="px-5 slide-up pb-10">
      <button onClick={onBack} className="tap flex items-center gap-2 text-white/60 text-sm mb-6 bg-transparent border-0 cursor-pointer">
        <Icon name="ChevronLeft" size={16} color="rgba(255,255,255,0.6)" />
        Volver
      </button>
      <div className="text-xl font-bold text-white mb-1">Admin</div>
      <div className="text-xs text-white/40 mb-6">Vista general de productoras y proyectos</div>

      {/* Confirm delete dialog */}
      {confirmDel && (
        <div className="rounded-[14px] p-4 mb-6" style={{ background: 'rgba(255,80,60,0.15)', border: '1px solid rgba(255,80,60,0.3)' }}>
          <div className="text-sm font-bold text-white mb-1">¿Borrar "{confirmDel.label}"?</div>
          <div className="text-xs text-white/50 mb-3">Esta acción no se puede deshacer.</div>
          {deleteError && <div className="text-xs text-red-300 mb-2">{deleteError}</div>}
          <div className="flex gap-2">
            <button onClick={() => { setConfirmDel(null); setDeleteError('') }} className="tap flex-1 text-xs py-2 rounded-[10px] border-0 cursor-pointer font-[Inter]" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>Cancelar</button>
            <button onClick={handleDelete} disabled={!!deleting} className="tap flex-1 text-xs font-bold py-2 rounded-[10px] border-0 cursor-pointer font-[Inter]" style={{ background: 'rgba(255,80,60,0.8)', color: '#fff' }}>
              {deleting ? 'Borrando…' : 'Sí, borrar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-white/40 text-sm text-center py-8">Cargando datos…</div>
      ) : (
        <>
          {/* Productoras creadas */}
          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-3">
            Productoras ({productoras.length})
          </div>
          <div className="flex flex-col gap-2 mb-6">
            {productoras.length === 0 && <div className="text-white/30 text-sm">Sin productoras</div>}
            {productoras.map(p => {
              const n = countByProductora[p.id] || 0
              return (
                <div key={p.id} className="flex items-center gap-2 rounded-[14px] px-4 py-3" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <button onClick={() => window.location.href = buildProductoraUrl(p.id)} className="tap flex-1 text-left bg-transparent border-0 cursor-pointer p-0 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{p.name || p.id}</div>
                    <div className="text-xs text-white/40">{n} proyecto{n !== 1 ? 's' : ''}</div>
                  </button>
                  <DelBtn type="productora" id={p.id} blobKey={p._blobKey} label={p.name || p.id} />
                </div>
              )
            })}
          </div>

          {/* Proyectos creados */}
          <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-3">
            Proyectos ({realProjects.length})
          </div>
          <div className="flex flex-col gap-2">
            {realProjects.length === 0 && <div className="text-white/30 text-sm">Sin proyectos</div>}
            {realProjects.map(p => (
              <div key={p._blobKey || p.id} className="flex items-center gap-2 rounded-[14px] px-4 py-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <button onClick={() => window.location.href = buildProjectUrl(p._blobKey || p.id)} className="tap flex-1 text-left bg-transparent border-0 cursor-pointer p-0 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{p.title || p._blobKey || p.id}</div>
                  {p.productoraId && <div className="text-xs text-white/40">{p.productoraId}</div>}
                </button>
                <DelBtn type="project" id={p.id} blobKey={p._blobKey} label={p.title || p._blobKey || p.id} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function LandingPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('pdr:landing-theme') || 'celeste')
  const [modo, setModo]   = useState(null)  // null | 'enter' | 'create' | 'marketplace' | 'admin'
  const [codigo, setCodigo] = useState('')
  const [pinnedList, setPinnedList] = useState(() => getPinnedProjects())
  const [adminUnlocked, setAdminUnlocked] = useState(false)

  const grad = getTheme(theme).grad

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

  if (modo === 'marketplace') return <MarketplaceView onBack={() => setModo(null)} />

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

        {/* Admin mode */}
        {modo === 'admin' && !adminUnlocked && (
          <AdminPinPrompt onCorrect={() => setAdminUnlocked(true)} onBack={() => setModo(null)} />
        )}
        {modo === 'admin' && adminUnlocked && (
          <AdminView onBack={() => { setModo(null); setAdminUnlocked(false) }} />
        )}
      </div>

      {/* Theme picker */}
      <div className="flex items-center justify-center gap-3 pb-8 pt-6 max-w-[480px] mx-auto w-full">
        {THEME_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => changeTheme(key)}
            className="rounded-full border-0 cursor-pointer transition-all duration-200 p-0 flex-shrink-0"
            style={{
              width:  theme === key ? 32 : 22,
              height: theme === key ? 32 : 22,
              background: getTheme(key).grad,
              border: theme === key ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
