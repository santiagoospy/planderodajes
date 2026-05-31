import { useState, useEffect } from 'react'
import { Lock, Palette, Link as LinkIcon, Check, Trash2, Plus, X, ChevronLeft } from 'lucide-react'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { api } from '../services/api'
import { storage } from '../services/storage'
import { db } from '../services/db'
import { buildProjectUrl, buildProductoraUrl } from '../utils/urls'
import { uid } from '../utils/uid'
import { DEPT_DEFAULTS } from '../constants/depts'

import { THEMES, getTheme } from '../constants/themes'

/** @param {{ productoraId: string }} props */
export default function ProductoraShell({ productoraId }) {
  const [productora,  setProductora]  = useState(() => storage.getProductora(productoraId))
  const [projects,    setProjects]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [notFound,    setNotFound]    = useState(false)
  const [unlocked,    setUnlocked]    = useState(false)
  const [pin,         setPin]         = useState('')
  const [pinError,    setPinError]    = useState('')
  const [creating,    setCreating]    = useState(false)
  const [newTitle,    setNewTitle]    = useState('')
  const [saving,      setSaving]      = useState(false)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [deleting,    setDeleting]    = useState(null)
  const [copied,      setCopied]      = useState(null)
  const [showColors,  setShowColors]  = useState(false)
  const [colorPin,    setColorPin]    = useState('')
  const [colorPinOk,  setColorPinOk]  = useState(false)
  const [colorPinErr, setColorPinErr] = useState('')

  useEffect(() => {
    let cancelled = false
    api.getProductora(productoraId)
      .then(data => {
        if (cancelled) return
        if (!data) { setNotFound(true); setLoading(false); return }
        setProductora(data)
        storage.setProductora(productoraId, data)

        // Check saved password
        try {
          const saved = localStorage.getItem(`prod_pwd_${productoraId}`)
          if (!data.password || saved === data.password) setUnlocked(true)
        } catch { if (!data.password) setUnlocked(true) }

        // BUG FIX: api.listProjects() returns { projects: [...] }, not an array
        return api.listProjects().then(list => {
          if (cancelled) return
          const mine = (list?.projects || []).filter(p => p.productoraId === productoraId)
          setProjects(mine)
        })
      })
      .catch(() => {
        const cached = storage.getProductora(productoraId)
        if (!cancelled && cached) { setProductora(cached); if (!cached.password) setUnlocked(true) }
        else if (!cancelled) setNotFound(true)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [productoraId])

  const themeKey = productora?.colorTheme || 'celeste'
  const theme    = getTheme(themeKey)
  const isLight  = theme.light
  const tc = (dark, light) => isLight ? light : dark

  const handleUnlock = (e) => {
    e?.preventDefault()
    if (pin === productora?.password) {
      try { localStorage.setItem(`prod_pwd_${productoraId}`, pin) } catch {}
      setUnlocked(true)
    } else {
      setPinError('Contraseña incorrecta')
      setPin('')
    }
  }

  const handleLogout = () => {
    try { localStorage.removeItem(`prod_pwd_${productoraId}`) } catch {}
    setUnlocked(false); setPin(''); setPinError('')
  }

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const id = `proj_${uid()}`
      const proj = {
        id,
        productoraId,
        title: newTitle.trim(),
        client: '',
        dates: '',
        crew: 0,
        pin: '',
        days: [],
        depts: { ...DEPT_DEFAULTS },
      }
      await api.saveProject(id, proj)
      window.location.href = buildProjectUrl(id)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async (projId) => {
    setDeleting(projId)
    try {
      await api.delete('projects', projId)
      setProjects(prev => prev.filter(p => p.id !== projId))
    } finally {
      setDeleting(null); setConfirmDel(null)
    }
  }

  const handleUpdateTheme = (key) => {
    const updated = { ...productora, colorTheme: key }
    setProductora(updated)
    db.saveProductora(productoraId, updated)
    setShowColors(false); setColorPinOk(false); setColorPin('')
  }

  const copyLink = (id) => {
    navigator.clipboard.writeText(buildProjectUrl(id))
    setCopied(id); setTimeout(() => setCopied(null), 2000)
  }

  const copyProductoraLink = () => {
    navigator.clipboard.writeText(buildProductoraUrl(productoraId))
    setCopied('productora'); setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <LoadingScreen text="Cargando espacio..." />

  if (notFound) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: THEMES.celeste.grad, gap: 14, padding: 32, fontFamily: 'inherit' }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textAlign: 'center' }}>Productora no encontrada</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.6, maxWidth: 300 }}>
        No existe ninguna productora con el nombre <strong style={{ color: 'rgba(255,200,160,0.9)' }}>"{productoraId}"</strong>.<br />Verificá que esté bien escrito.
      </div>
      <button onClick={() => window.location.href = '/'} style={{ marginTop: 16, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.9)', color: '#0B7285', border: 'none', borderRadius: 12, padding: '12px 24px', cursor: 'pointer' }}>← Volver al inicio</button>
    </div>
  )

  // ── Auth gate ────────────────────────────────────────────────
  if (!unlocked && productora?.password) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.grad, padding: 32, fontFamily: 'inherit' }}>
      <button onClick={() => window.location.href = '/'} style={{ position: 'absolute', top: 20, left: 20, background: 'none', border: 'none', fontSize: 13, color: 'rgba(255,255,255,0.55)', cursor: 'pointer', fontFamily: 'inherit' }}>← Inicio</button>
      <div style={{ width: '100%', maxWidth: 340 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Lock size={42} color="#fff" />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: 8, fontWeight: 600, marginTop: 16 }}>PRODUCTORA</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>{productora.name}</div>
          <div style={{ fontSize: 13, color: '#888' }}>Ingresá la contraseña para continuar</div>
        </div>
        <form onSubmit={handleUnlock}>
          <input
            type="password"
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError('') }}
            autoFocus
            placeholder="Contraseña"
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 16, background: 'rgba(255,255,255,0.1)', border: `1.5px solid ${pinError ? 'rgba(255,180,150,0.8)' : 'rgba(255,255,255,0.2)'}`, padding: '14px 18px', color: '#fff', outline: 'none', marginBottom: 10, textAlign: 'center', letterSpacing: '0.2em', boxSizing: 'border-box', borderRadius: 12 }}
          />
          {pinError && <div style={{ fontSize: 12, color: 'rgba(255,200,160,0.9)', textAlign: 'center', marginBottom: 10, fontWeight: 600 }}>{pinError}</div>}
          <button type="submit" disabled={!pin} style={{ width: '100%', fontFamily: 'inherit', fontSize: 14, fontWeight: 900, background: pin ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.12)', color: pin ? '#0B7285' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: 12, padding: '14px', cursor: pin ? 'pointer' : 'not-allowed' }}>
            ENTRAR →
          </button>
        </form>
      </div>
    </div>
  )

  // ── Hub ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', background: theme.grad, fontFamily: 'inherit' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '56px 20px 48px' }}>

        {/* Back to home */}
        <button
          onClick={() => window.location.href = '/'}
          style={{ background: 'none', border: 'none', fontSize: 13, color: tc('rgba(255,255,255,0.5)', 'rgba(0,0,0,0.4)'), cursor: 'pointer', fontFamily: 'inherit', padding: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ChevronLeft size={14} color="currentColor" /> Inicio
        </button>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: tc('rgba(255,255,255,0.4)', 'rgba(0,0,0,0.35)'), letterSpacing: '0.12em', fontWeight: 600 }}>PRODUCTORA</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => { setShowColors(v => !v); setColorPin(''); setColorPinErr(''); setColorPinOk(false) }}
              style={{ background: tc('rgba(255,255,255,0.12)', 'rgba(0,0,0,0.08)'), border: 'none', fontSize: 12, color: tc('rgba(255,255,255,0.7)', 'rgba(0,0,0,0.55)'), cursor: 'pointer', fontFamily: 'inherit', padding: '5px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Palette size={13} color="currentColor" style={{ marginRight: 2 }} /> Color
            </button>
            <button
              onClick={handleLogout}
              style={{ background: tc('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)'), border: 'none', fontSize: 12, color: tc('rgba(255,255,255,0.5)', 'rgba(0,0,0,0.4)'), cursor: 'pointer', fontFamily: 'inherit', padding: '5px 12px', borderRadius: 20 }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Productora name */}
        <div style={{ fontSize: 28, fontWeight: 800, color: tc('#fff', '#1a1714'), marginBottom: 4, letterSpacing: '-0.5px' }}>{productora?.name}</div>
        <div style={{ fontSize: 13, color: tc('rgba(255,255,255,0.45)', 'rgba(0,0,0,0.4)'), marginBottom: 28 }}>
          {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
        </div>

        {/* Color picker panel */}
        {showColors && (
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 20, marginBottom: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Palette size={14} color="#fff" /> Cambiar color de productora
            </div>
            {!colorPinOk ? (
              <>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
                  Ingresá el código de la productora ({productoraId}) para confirmar
                </div>
                <input
                  value={colorPin}
                  onChange={e => { setColorPin(e.target.value); setColorPinErr('') }}
                  placeholder="Código de productora"
                  style={{ width: '100%', fontFamily: 'inherit', fontSize: 14, background: 'rgba(255,255,255,0.15)', border: `1.5px solid ${colorPinErr ? 'rgba(255,150,150,0.8)' : 'rgba(255,255,255,0.3)'}`, borderRadius: 8, padding: '10px 14px', color: '#fff', outline: 'none', marginBottom: 8, boxSizing: 'border-box' }}
                />
                {colorPinErr && <div style={{ fontSize: 11, color: 'rgba(255,200,150,0.9)', marginBottom: 8 }}>{colorPinErr}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowColors(false)} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={() => {
                    if (colorPin.trim().toLowerCase() === productoraId.toLowerCase() || colorPin === productora?.password) {
                      setColorPinOk(true); setColorPinErr('')
                    } else {
                      setColorPinErr('Código incorrecto. Usá el ID o la contraseña de la productora.')
                    }
                  }} style={{ flex: 2, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: 'rgba(255,255,255,0.9)', color: '#0B7285', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer' }}>Verificar</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>Elegí el color para esta productora:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  {Object.entries(THEMES).map(([key, th]) => (
                    <button key={key} onClick={() => handleUpdateTheme(key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: th.grad, border: themeKey === key ? '3px solid #fff' : '2px solid rgba(255,255,255,0.3)', boxShadow: themeKey === key ? '0 0 0 2px rgba(0,0,0,0.3)' : 'none', transition: 'all 0.2s' }} />
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontFamily: 'inherit', textTransform: 'capitalize' }}>{key}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowColors(false)} style={{ width: '100%', fontFamily: 'inherit', fontSize: 12, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer' }}>Cerrar</button>
              </>
            )}
          </div>
        )}

        {/* Share link */}
        <div style={{ background: tc('rgba(255,255,255,0.06)', 'rgba(0,0,0,0.06)'), borderRadius: 14, padding: '14px 16px', border: `1px solid ${tc('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.1)')}`, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 9, color: tc('rgba(255,255,255,0.35)', 'rgba(0,0,0,0.35)'), letterSpacing: '0.1em', marginBottom: 4, fontWeight: 600 }}>LINK DE LA PRODUCTORA</div>
              <div style={{ fontSize: 11, color: tc('rgba(255,255,255,0.6)', 'rgba(0,0,0,0.5)'), overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{buildProductoraUrl(productoraId)}</div>
            </div>
            <button onClick={copyProductoraLink} style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: copied === 'productora' ? tc('rgba(255,255,255,0.9)', 'rgba(0,0,0,0.15)') : tc('rgba(255,255,255,0.12)', 'rgba(0,0,0,0.08)'), color: copied === 'productora' ? tc('#7a3200', '#1a1714') : tc('rgba(255,255,255,0.7)', 'rgba(0,0,0,0.5)'), border: 'none', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {copied === 'productora' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <div style={{ fontSize: 10, color: tc('rgba(255,255,255,0.3)', 'rgba(0,0,0,0.3)'), marginTop: 8 }}>Compartilo con tu equipo (junto con la contraseña)</div>
        </div>

        {/* Project list */}
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: tc('rgba(255,255,255,0.3)', 'rgba(0,0,0,0.3)'), fontSize: 13 }}>
            Todavía no hay proyectos en esta productora
          </div>
        ) : (
          <div style={{ background: tc('rgba(255,255,255,0.06)', 'rgba(0,0,0,0.05)'), borderRadius: 14, overflow: 'hidden', border: `1px solid ${tc('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.1)')}`, marginBottom: 20 }}>
            {projects.map((p, idx) => (
              <div key={p.id} style={{ borderBottom: idx < projects.length - 1 ? `1px solid ${tc('rgba(255,255,255,0.06)', 'rgba(0,0,0,0.06)')}` : 'none' }}>
                {confirmDel === p.id ? (
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: tc('rgba(255,200,160,0.9)', '#c00'), marginBottom: 6 }}>¿Borrar "{p.title}"?</div>
                    <div style={{ fontSize: 11, color: tc('rgba(255,255,255,0.4)', 'rgba(0,0,0,0.4)'), marginBottom: 10 }}>Esta acción no se puede deshacer.</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setConfirmDel(null)} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, background: tc('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)'), color: tc('rgba(255,255,255,0.5)', 'rgba(0,0,0,0.4)'), border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>Cancelar</button>
                      <button onClick={() => handleDeleteProject(p.id)} disabled={deleting === p.id} style={{ flex: 1, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: deleting === p.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,80,60,0.8)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer' }}>
                        {deleting === p.id ? 'Borrando…' : 'Sí, borrar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px' }}>
                    <div onClick={() => window.location.href = buildProjectUrl(p.id)} style={{ flex: 1, cursor: 'pointer', minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: tc('#fff', '#1a1714') }}>{p.title}</div>
                      <div style={{ fontSize: 11, color: tc('rgba(255,255,255,0.45)', 'rgba(0,0,0,0.4)'), marginTop: 2 }}>
                        {p.client || ''}{p.client && p.dates ? ' · ' : ''}{p.dates || 'sin fechas'}
                      </div>
                      <div style={{ fontSize: 10, color: tc('rgba(255,255,255,0.3)', 'rgba(0,0,0,0.3)'), marginTop: 2 }}>
                        {(p.days || []).length} día{(p.days || []).length !== 1 ? 's' : ''} · {(p.days || []).reduce((s, d) => s + (d.scenes || []).length, 0)} escenas
                      </div>
                    </div>
                    <button onClick={() => copyLink(p.id)} style={{ background: copied === p.id ? tc('rgba(255,255,255,0.9)', 'rgba(0,0,0,0.12)') : tc('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)'), border: 'none', borderRadius: 8, color: copied === p.id ? tc('#0f3460', '#1a1714') : tc('rgba(255,255,255,0.5)', 'rgba(0,0,0,0.4)'), fontSize: 13, cursor: 'pointer', padding: '8px 12px', fontFamily: 'inherit' }}>
                      {copied === p.id ? <Check size={14} color="currentColor" /> : <LinkIcon size={14} color="currentColor" />}
                    </button>
                    <button onClick={() => setConfirmDel(p.id)} style={{ background: 'rgba(255,80,60,0.15)', border: 'none', borderRadius: 8, color: tc('rgba(255,160,140,0.9)', '#c00'), fontSize: 13, cursor: 'pointer', padding: '8px 10px' }}>
                      <Trash2 size={14} color="currentColor" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create project button */}
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="tap"
            style={{ width: '100%', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, background: tc('rgba(255,255,255,0.9)', '#1a1714'), color: tc('#1a1714', '#fff'), border: 'none', borderRadius: 14, padding: '16px 20px', cursor: 'pointer', letterSpacing: '0.01em' }}
          >
            + Crear nuevo proyecto
          </button>
        ) : (
          <div style={{ background: tc('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)'), borderRadius: 14, padding: 20, border: `1px solid ${tc('rgba(255,255,255,0.12)', 'rgba(0,0,0,0.1)')}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tc('#fff', '#1a1714'), marginBottom: 12 }}>Nuevo proyecto</div>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
              placeholder="Nombre del proyecto..."
              autoFocus
              style={{ width: '100%', fontFamily: 'inherit', fontSize: 15, background: tc('rgba(255,255,255,0.12)', 'rgba(0,0,0,0.08)'), border: `1.5px solid ${tc('rgba(255,255,255,0.2)', 'rgba(0,0,0,0.15)')}`, borderRadius: 10, padding: '12px 16px', color: tc('#fff', '#1a1714'), outline: 'none', marginBottom: 12, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setCreating(false); setNewTitle('') }} style={{ flex: 1, fontFamily: 'inherit', fontSize: 13, background: tc('rgba(255,255,255,0.08)', 'rgba(0,0,0,0.06)'), color: tc('rgba(255,255,255,0.6)', 'rgba(0,0,0,0.4)'), border: 'none', borderRadius: 10, padding: '11px', cursor: 'pointer' }}>Cancelar</button>
              <button onClick={handleCreateProject} disabled={!newTitle.trim() || saving} style={{ flex: 2, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: newTitle.trim() ? tc('rgba(255,255,255,0.9)', '#1a1714') : tc('rgba(255,255,255,0.15)', 'rgba(0,0,0,0.1)'), color: newTitle.trim() ? tc('#1a1714', '#fff') : tc('rgba(255,255,255,0.3)', 'rgba(0,0,0,0.3)'), border: 'none', borderRadius: 10, padding: '11px', cursor: newTitle.trim() ? 'pointer' : 'not-allowed' }}>
                {saving ? 'Creando…' : 'Crear proyecto →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
