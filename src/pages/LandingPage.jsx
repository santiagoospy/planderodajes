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
import { Auth } from '../services/auth'
import { memberships } from '../services/memberships'
import { THEME_KEYS, getTheme } from '../constants/themes'

const LANDING_ACTIONS = [
  { key: 'enter',       icon: 'LogIn',        label: 'Entrar a tu productora', desc: 'Con el código y la contraseña de tu productora' },
  { key: 'create',      icon: 'Plus',         label: 'Crear espacio de trabajo', desc: 'Freelance o productora' },
  { key: 'marketplace', icon: 'ShoppingCart', label: 'Marketplace',            desc: 'Equipos, props y servicios' },
  { key: 'demo',        icon: 'Play',         label: 'Ver demo',               desc: 'Explorar el Proyecto Cero' },
]

// Gate de admin por ROL real (ADMIN_EMAILS en el backend), no por PIN.
function AdminGate({ onCorrect, onBack }) {
  const [estado, setEstado] = useState('checking') // 'checking' | 'denied'

  useEffect(() => {
    let alive = true
    memberships.whoami()
      .then(r => { if (alive) (r?.isAdmin ? onCorrect() : setEstado('denied')) })
      .catch(() => { if (alive) setEstado('denied') })
    return () => { alive = false }
  }, [])

  return (
    <div className="px-5 slide-up">
      <button onClick={onBack} className="tap flex items-center gap-2 text-white/60 text-sm mb-6 bg-transparent border-0 cursor-pointer">
        <Icon name="ChevronLeft" size={16} color="rgba(255,255,255,0.6)" />
        Volver
      </button>
      <div className="text-xl font-bold text-white mb-2">Admin</div>
      {estado === 'checking'
        ? <div className="text-sm text-white/50">Verificando permisos…</div>
        : <div className="text-sm text-red-300">No tenés permisos de administrador.</div>}
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

  // Solo proyectos reales creados (excluye el demo / Proyecto Cero y datos de dept guardados como proyectos)
  const realProjects = projects.filter(p =>
    p.title &&
    (p._blobKey || p.id) !== SEED_PROJECT.id &&
    p.id !== SEED_PROJECT.id
  )

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
  const [claimPwd, setClaimPwd] = useState('')
  const [claimErr, setClaimErr] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [pinnedList, setPinnedList] = useState(() => getPinnedProjects())
  const [adminUnlocked, setAdminUnlocked] = useState(false)
  const [mis, setMis] = useState([])        // mis productoras (membresías) [{ productora_id, role, name }]
  const [userEmail, setUserEmail] = useState('')

  const grad = getTheme(theme).grad

  // Cargar mis productoras (membresías) + email del usuario logueado.
  const loadMine = async () => {
    try {
      const rows = await memberships.mine()
      // Traer el nombre de cada productora (best-effort).
      const withNames = await Promise.all(rows.map(async (r) => {
        let name = r.productora_id
        try { const p = await api.getProductora(r.productora_id); if (p?.name) name = p.name } catch {}
        return { ...r, name }
      }))
      setMis(withNames)
    } catch { /* sin sesión o tablas aún no creadas */ }
  }

  useEffect(() => {
    Auth.getUser().then(u => { setUserEmail(u?.email || ''); if (u) loadMine() })
    // Recargar cuando la sesión queda lista o cambia (evita la carrera al primer load).
    const unsub = Auth.onChange(u => { setUserEmail(u?.email || ''); if (u) loadMine() })
    return () => unsub()
  }, [])

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

  const handleEnter = async (e) => {
    e?.preventDefault()
    const id = productoraSlug(codigo)
    if (!id || !claimPwd) return
    setClaiming(true); setClaimErr('')
    try {
      await memberships.claim(id, claimPwd)
      window.location.href = `/?org=${id}`
    } catch (err) {
      setClaimErr(err?.message || 'No se pudo reclamar. Verificá el código y la contraseña.')
      setClaiming(false)
    }
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

        {/* Mis productoras (membresías) */}
        {!modo && mis.length > 0 && (
          <div className="px-5 pb-2">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-white/50 mb-3 uppercase">
              <Icon name="Building2" size={11} color="rgba(255,255,255,0.5)" />
              Mis productoras
            </div>
            <div className="flex flex-col gap-2 mb-5">
              {mis.map(m => (
                <button
                  key={m.productora_id}
                  onClick={() => window.location.href = buildProductoraUrl(m.productora_id)}
                  className="tap flex items-center gap-4 px-4 py-3.5 rounded-[14px] text-left w-full border-0 cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                >
                  <div className="flex items-center justify-center flex-shrink-0 rounded-[11px]" style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.18)' }}>
                    <Icon name="Building2" size={18} color="rgba(255,255,255,0.9)" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-white truncate">{m.name}</div>
                    <div className="text-xs text-white/40">{m.role === 'owner' ? 'Dueño' : 'Miembro'}</div>
                  </div>
                  <Icon name="ChevronRight" size={18} color="rgba(255,255,255,0.3)" />
                </button>
              ))}
            </div>
          </div>
        )}

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

            {/* Admin — botón chico, discreto */}
            <button
              onClick={() => handleAction('admin')}
              className="tap flex items-center gap-2 mt-4 px-1 py-2 border-0 cursor-pointer bg-transparent"
            >
              <Icon name="Settings" size={13} color="rgba(255,255,255,0.25)" />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'inherit' }}>Admin</span>
            </button>
          </div>
        )}

        {/* Enter mode — code input */}
        {modo === 'enter' && (
          <div className="px-5 slide-up">
            <button onClick={() => setModo(null)} className="tap flex items-center gap-2 text-white/60 text-sm mb-6 bg-transparent border-0 cursor-pointer">
              <Icon name="ChevronLeft" size={16} color="rgba(255,255,255,0.6)" />
              Volver
            </button>
            <div className="text-xl font-bold text-white mb-2">Entrar a tu productora</div>
            <div className="text-sm text-white/50 mb-6">Conectá tu productora a tu cuenta con su código y contraseña (la de siempre). El primero del equipo queda como dueño; el resto, como miembros.</div>
            <form onSubmit={handleEnter}>
              <input
                value={codigo}
                onChange={e => { setCodigo(e.target.value); setClaimErr('') }}
                placeholder="Código de tu productora..."
                autoFocus
                className="w-full rounded-[14px] px-4 py-3.5 text-base outline-none mb-3 font-[Inter]"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              <input
                type="password"
                value={claimPwd}
                onChange={e => { setClaimPwd(e.target.value); setClaimErr('') }}
                placeholder="Contraseña de la productora"
                className="w-full rounded-[14px] px-4 py-3.5 text-base outline-none mb-4 font-[Inter]"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
              />
              {claimErr && <div className="text-red-200 text-sm mb-3">{claimErr}</div>}
              <button
                type="submit"
                disabled={!codigo.trim() || !claimPwd || claiming}
                className="tap w-full py-3.5 rounded-[14px] text-base font-bold text-white border-0 cursor-pointer disabled:opacity-40"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                {claiming ? 'Reclamando…' : 'Reclamar'}
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
          <AdminGate onCorrect={() => setAdminUnlocked(true)} onBack={() => setModo(null)} />
        )}
        {modo === 'admin' && adminUnlocked && (
          <AdminView onBack={() => { setModo(null); setAdminUnlocked(false) }} />
        )}
      </div>

      {/* Usuario logueado + salir */}
      {userEmail && !modo && (
        <div className="flex items-center justify-center gap-2 pt-4 max-w-[480px] mx-auto w-full">
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{userEmail}</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
          <button
            onClick={async () => { await Auth.signOut() }}
            className="bg-transparent border-0 cursor-pointer"
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontFamily: 'inherit', fontWeight: 600 }}
          >
            Cerrar sesión
          </button>
        </div>
      )}

      {/* Theme picker — paleta de colores */}
      <div className="flex flex-col items-center pb-8 pt-6 max-w-[480px] mx-auto w-full gap-3">
        <div style={{ display:'flex', borderRadius:14, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,0.35)' }}>
          {THEME_KEYS.map((key) => {
            const active = theme === key
            return (
              <button
                key={key}
                onClick={() => changeTheme(key)}
                className="border-0 cursor-pointer p-0 flex-shrink-0 relative"
                style={{
                  width: active ? 72 : 52,
                  height: 48,
                  background: getTheme(key).grad,
                  transition: 'width 0.2s ease',
                }}
              >
              </button>
            )
          })}
        </div>

        {/* Hecho en Paraguay */}
        <div className="flex items-center justify-center gap-1.5">
          <span style={{ fontSize: 16 }}>🇵🇾</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit', letterSpacing: '0.02em' }}>Hecho en Paraguay</span>
        </div>
      </div>

      {/* Theme picker anterior — círculos (desactivado)
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
      */}
    </div>
  )
}
