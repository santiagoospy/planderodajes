/**
 * MarketplaceView — Equipos, props y servicios para producción.
 * Migrado del legacy a React con Netlify Blobs persistence.
 */

import { useState, useEffect } from 'react'
import { Icon } from '../../components/ui/Icon'
import { api } from '../../services/api'
import { compressAndUploadToR2 } from '../../utils/uploadR2'
import { hashPin } from '../../utils/hash'

const CATEGORIAS = ['Equipos','Cámaras','Lentes','Iluminación','Sonido','Props & Arte','Transporte','Vestuario','Servicios','Otros']
const EMPTY_FORM = { titulo:'', descripcion:'', precio:'', contacto:'', nombre:'', categoria:'Equipos', fotos:[], pin:'' }

export function MarketplaceView({ onBack }) {
  const STORE_KEY = 'mkt_v2'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [mode, setMode] = useState(null) // null | 'new' | 'edit' | 'pin-edit' | 'pin-del'
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState(null)
  const [photoIdx, setPhotoIdx] = useState(0)

  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }))

  // ── LOAD desde Netlify Blobs ────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('marketplace', 'items')
        if (Array.isArray(data)) {
          setItems(data)
          localStorage.setItem(STORE_KEY, JSON.stringify(data))
        } else if (data && Array.isArray(data.items)) {
          setItems(data.items)
          localStorage.setItem(STORE_KEY, JSON.stringify(data.items))
        }
      } catch {
        try {
          const s = localStorage.getItem(STORE_KEY)
          if (s) setItems(JSON.parse(s))
        } catch {}
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── SAVE en Netlify Blobs ───────────────────────────────────
  const persist = async (list) => {
    setItems(list)
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)) } catch {}
    try {
      await api.set('marketplace', 'items', list)
    } catch (e) {
      console.warn('Marketplace save offline:', e.message)
    }
  }

  // ── FOTOS ───────────────────────────────────────────────────
  const handleFotos = async (e) => {
    const list = Array.from(e.target.files || []).slice(0, 5 - (form.fotos || []).length)
    if (!list.length) return
    setUploading(true)
    const nuevas = []
    for (const f of list) {
      try {
        const { url } = await compressAndUploadToR2(f, 1200, 0.75)
        nuevas.push(url)
      } catch (err) {
        console.error('Foto error:', err)
      }
    }
    sf('fotos', [...(form.fotos || []), ...nuevas].slice(0, 5))
    setUploading(false)
    e.target.value = ''
  }

  // ── SUBMIT NUEVA PUBLICACIÓN ────────────────────────────────
  const submitNew = async () => {
    if (!form.titulo || !form.contacto || !form.pin) return
    setSaving(true)
    const newItem = {
      id: Date.now(),
      ...form,
      pin: await hashPin(form.pin),
      createdAt: new Date().toLocaleDateString('es')
    }
    await persist([newItem, ...items])
    setForm(EMPTY_FORM)
    setMode(null)
    setSaving(false)
  }

  // ── VERIFICAR PIN ──────────────────────────────────────────
  const verifyPin = async (item) => {
    const h = await hashPin(pinInput)
    if (h === item.pin) return true           // SHA-256 (new)
    try { return atob(item.pin) === pinInput } catch {} // btoa (legacy)
    return false
  }

  // ── FLUJO EDITAR ───────────────────────────────────────────
  const startEdit = (item) => {
    setEditId(item.id)
    setPinInput('')
    setPinError('')
    setMode('pin-edit')
  }

  const confirmPinEdit = async () => {
    const item = items.find(i => i.id === editId)
    if (!item || !await verifyPin(item)) { setPinError('PIN incorrecto'); return }
    setForm({ ...item, pin: pinInput })
    setPinError('')
    setMode('edit')
  }

  const submitEdit = async () => {
    if (!form.titulo || !form.contacto) return
    setSaving(true)
    const pinH = await hashPin(form.pin)
    const updated = items.map(i =>
      i.id === editId
        ? { ...i, ...form, pin: pinH, updatedAt: new Date().toLocaleDateString('es') }
        : i
    )
    await persist(updated)
    setForm(EMPTY_FORM)
    setEditId(null)
    setMode(null)
    setSaving(false)
  }

  // ── FLUJO ELIMINAR ─────────────────────────────────────────
  const startDel = (item) => {
    setEditId(item.id)
    setPinInput('')
    setPinError('')
    setMode('pin-del')
  }

  const confirmDel = async () => {
    const item = items.find(i => i.id === editId)
    if (!item || !await verifyPin(item)) { setPinError('PIN incorrecto'); return }
    await persist(items.filter(i => i.id !== editId))
    setEditId(null)
    setMode(null)
  }

  const openWhatsApp = (contacto) => {
    const num = (contacto || '').replace(/\D/g, '')
    if (!num) return
    window.open('https://wa.me/' + num, '_blank')
  }

  const openDetail = async (item) => {
    const updated = items.map(i => i.id === item.id ? { ...i, vistas: (i.vistas || 0) + 1 } : i)
    const withViews = updated.find(i => i.id === item.id)
    setItems(updated)
    setSelected(withViews)
    setPhotoIdx(0)
    try { await api.set('marketplace', 'items', updated) } catch {}
  }

  const closeModal = () => {
    setMode(null)
    setForm(EMPTY_FORM)
    setEditId(null)
    setPinInput('')
    setPinError('')
  }

  const filtered = items.filter(i =>
    !search || (i.titulo + i.descripcion + i.categoria + i.nombre).toLowerCase().includes(search.toLowerCase())
  )

  // ── FORM COMPARTIDO (nueva / editar) ───────────────────────
  const renderForm = (isEdit) => (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-t-[20px] w-full p-5 pb-8 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex justify-center mb-3">
          <div className="w-9 h-1 bg-[#e0ddd8] rounded" />
        </div>
        <div className="text-base font-bold text-[#1a1714] mb-4">
          {isEdit ? 'Editar publicación' : 'Nueva publicación'}
        </div>

        {/* Fotos */}
        <div className="mb-3">
          <div className="flex gap-2 overflow-x-auto mb-2">
            {(form.fotos || []).map((src, i) => (
              <div key={i} className="relative flex-shrink-0">
                <img src={src} alt="" className="w-[72px] h-[72px] rounded-[10px] object-cover" />
                <button
                  onClick={() => sf('fotos', (form.fotos || []).filter((_, j) => j !== i))}
                  className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-600/70 border-0 text-white text-[10px] cursor-pointer flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
            {(form.fotos || []).length < 5 && (
              <label className="w-[72px] h-[72px] rounded-[10px] border-[1.5px] border-dashed border-[#ccc] flex items-center justify-center cursor-pointer flex-shrink-0 text-2xl text-[#bbb]">
                {uploading ? <Icon name="Loader" size={14} color="currentColor" /> : <Icon name="Camera" size={14} color="currentColor" />}
                <input type="file" accept="image/*" multiple onChange={handleFotos} className="hidden" />
              </label>
            )}
          </div>
          <div className="text-[10px] text-[#aaa]">Máximo 5 fotos</div>
        </div>

        <input
          value={form.titulo}
          onChange={e => sf('titulo', e.target.value)}
          placeholder="Título del ítem *"
          className="w-full font-[Inter] text-sm bg-[#f7f5f2] border border-[#e5e2dd] rounded-[10px] px-3 py-3 text-[#1a1714] outline-none mb-2"
        />

        <textarea
          value={form.descripcion}
          onChange={e => sf('descripcion', e.target.value)}
          placeholder="Descripción (estado, características, etc.)"
          rows={3}
          className="w-full font-[Inter] text-sm bg-[#f7f5f2] border border-[#e5e2dd] rounded-[10px] px-3 py-3 text-[#1a1714] outline-none mb-2 resize-none"
        />

        <div className="flex gap-2 mb-2">
          <input
            value={form.precio}
            onChange={e => sf('precio', e.target.value)}
            placeholder="Precio (ej: $500)"
            className="flex-1 font-[Inter] text-sm bg-[#f7f5f2] border border-[#e5e2dd] rounded-[10px] px-3 py-3 text-[#1a1714] outline-none"
          />
          <select
            value={form.categoria}
            onChange={e => sf('categoria', e.target.value)}
            className="flex-1 font-[Inter] text-xs bg-[#f7f5f2] border border-[#e5e2dd] rounded-[10px] px-2.5 py-3 text-[#1a1714] outline-none"
          >
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-2 mb-2">
          <input
            value={form.nombre}
            onChange={e => sf('nombre', e.target.value)}
            placeholder="Tu nombre"
            className="flex-1 font-[Inter] text-sm bg-[#f7f5f2] border border-[#e5e2dd] rounded-[10px] px-3 py-3 text-[#1a1714] outline-none"
          />
          <input
            value={form.contacto}
            onChange={e => sf('contacto', e.target.value)}
            placeholder="WhatsApp *"
            className="flex-1 font-[Inter] text-sm bg-[#f7f5f2] border-[1.5px] border-[#0B7285] rounded-[10px] px-3 py-3 text-[#1a1714] outline-none"
          />
        </div>

        {/* PIN — solo al crear */}
        {!isEdit && (
          <div className="mb-4">
            <input
              value={form.pin}
              onChange={e => sf('pin', e.target.value)}
              placeholder="PIN para editar/eliminar *"
              type="password"
              maxLength={20}
              className="w-full font-[Inter] text-sm bg-[#fff8e1] border-[1.5px] border-[#f0b429] rounded-[10px] px-3 py-3 text-[#1a1714] outline-none mb-1"
            />
            <div className="text-[11px] text-[#aaa]">Guardá este PIN — lo necesitarás para editar o eliminar tu publicación</div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={closeModal}
            className="flex-1 font-[Inter] text-xs bg-[#f0ede8] text-[#888] border-0 rounded-[12px] py-3 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={isEdit ? submitEdit : submitNew}
            disabled={saving || (!isEdit ? (!form.titulo || !form.contacto || !form.pin) : (!form.titulo || !form.contacto))}
            className="flex-[2] font-[Inter] text-xs font-bold text-white border-0 rounded-[12px] py-3 cursor-pointer disabled:opacity-40"
            style={{ background: saving ? '#aaa' : '#0B7285' }}
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Publicar ítem'}
          </button>
        </div>
      </div>
    </div>
  )

  // ── MODAL DE PIN ───────────────────────────────────────────
  const renderPinModal = (action) => (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
      onClick={closeModal}
    >
      <div
        className="bg-white rounded-[20px] w-full max-w-[340px] p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center mb-2">
          <Icon
            name={action === 'edit' ? 'PencilLine' : 'Trash2'}
            size={32}
            color={action === 'edit' ? 'var(--text-primary)' : 'var(--color-primary)'}
          />
        </div>
        <div className="text-base font-bold text-[#1a1714] text-center mb-1">
          {action === 'edit' ? 'Editar publicación' : 'Eliminar publicación'}
        </div>
        <div className="text-xs text-[#888] text-center mb-5">Ingresá el PIN que elegiste al publicar</div>

        <input
          value={pinInput}
          onChange={e => {
            setPinInput(e.target.value)
            setPinError('')
          }}
          placeholder="PIN"
          type="password"
          maxLength={20}
          className={`w-full font-[Inter] text-base text-center tracking-widest bg-[#f7f5f2] border-[1.5px] rounded-[12px] px-3 py-3 text-[#1a1714] outline-none mb-1 ${pinError ? 'border-red-600' : 'border-[#e5e2dd]'}`}
        />
        {pinError && <div className="text-[#e53e3e] text-xs text-center mb-2">{pinError}</div>}

        <div className="flex gap-2 mt-3">
          <button
            onClick={closeModal}
            className="flex-1 font-[Inter] text-xs bg-[#f0ede8] text-[#888] border-0 rounded-[12px] py-3 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={action === 'edit' ? confirmPinEdit : confirmDel}
            disabled={!pinInput}
            className="flex-1 font-[Inter] text-xs font-bold text-white border-0 rounded-[12px] py-3 cursor-pointer disabled:opacity-40"
            style={{ background: action === 'edit' ? '#0B7285' : '#e53e3e' }}
          >
            {action === 'edit' ? 'Continuar' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )

  const renderDetail = () => {
    const item = selected
    if (!item) return null
    const fotos = item.fotos || []
    return (
      <div className="fixed inset-0 bg-black/80 z-50 flex flex-col" onClick={() => setSelected(null)}>
        <div
          className="bg-white w-full flex flex-col overflow-y-auto"
          style={{ marginTop: 'env(safe-area-inset-top, 0px)', maxHeight: '100dvh', borderRadius: '0 0 0 0' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#ede9e3]">
            <button onClick={() => setSelected(null)} className="bg-transparent border-0 text-[#0B7285] font-bold text-sm cursor-pointer font-[Inter]">‹ Volver</button>
            <div className="text-[10px] bg-[#0B728515] text-[#0B7285] rounded px-2 py-0.5">{item.categoria}</div>
          </div>

          {/* Fotos */}
          {fotos.length > 0 && (
            <div className="relative bg-[#f0ede8]">
              <img src={fotos[photoIdx]} alt={item.titulo} className="w-full object-contain" style={{ maxHeight: 280 }} />
              {fotos.length > 1 && (
                <>
                  <button onClick={() => setPhotoIdx(i => (i - 1 + fotos.length) % fotos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border-0 text-white text-lg cursor-pointer flex items-center justify-center">‹</button>
                  <button onClick={() => setPhotoIdx(i => (i + 1) % fotos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border-0 text-white text-lg cursor-pointer flex items-center justify-center">›</button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {fotos.map((_, i) => (
                      <div key={i} onClick={() => setPhotoIdx(i)} className="w-1.5 h-1.5 rounded-full cursor-pointer" style={{ background: i === photoIdx ? '#0B7285' : 'rgba(255,255,255,0.5)' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {fotos.length === 0 && (
            <div className="w-full flex items-center justify-center bg-[#f0ede8]" style={{ height: 160 }}>
              <Icon name="Package" size={52} color="#ccc" />
            </div>
          )}

          {/* Contenido */}
          <div className="p-4 flex flex-col gap-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
            <div>
              <div className="text-base font-black text-[#1a1714] mb-1">{item.titulo}</div>
              {item.precio && <div className="text-lg font-black text-[#0B7285]">{item.precio}</div>}
            </div>

            {item.descripcion && (
              <div className="bg-[#f7f5f2] rounded-[12px] p-3">
                <div className="text-[10px] text-[#aaa] mb-1 uppercase tracking-wider">Descripción</div>
                <div className="text-sm text-[#333] leading-relaxed">{item.descripcion}</div>
              </div>
            )}

            <div className="bg-[#f7f5f2] rounded-[12px] p-3">
              <div className="text-[10px] text-[#aaa] mb-1 uppercase tracking-wider">Contacto</div>
              <div className="text-sm font-bold text-[#1a1714]">{item.nombre || '—'}</div>
              <div className="text-sm text-[#555]">{item.contacto}</div>
            </div>

            <div className="flex items-center justify-between">
              {item.createdAt && (
                <div className="text-[10px] text-[#bbb]">Publicado el {item.createdAt}</div>
              )}
              {(item.vistas || 0) > 0 && (
                <div className="text-[10px] text-[#bbb] flex items-center gap-1">
                  <Icon name="Eye" size={11} color="#bbb" />
                  {item.vistas} {item.vistas === 1 ? 'vista' : 'vistas'}
                </div>
              )}
            </div>

            <button
              onClick={() => openWhatsApp(item.contacto)}
              className="w-full text-center text-white rounded-[14px] py-3.5 text-sm font-bold border-0 cursor-pointer font-[Inter] flex items-center justify-center gap-2"
              style={{ background: '#25D366' }}
            >
              <Icon name="MessageCircle" size={16} color="#fff" />
              Contactar por WhatsApp
            </button>

            <div className="flex gap-2">
              <button onClick={() => { setSelected(null); startEdit(item) }}
                className="flex-1 bg-[#f0f7ff] border border-[#cce4f7] rounded-[10px] text-[11px] text-[#0B7285] font-semibold py-2.5 cursor-pointer font-[Inter]">
                ✏️ Editar
              </button>
              <button onClick={() => { setSelected(null); startDel(item) }}
                className="flex-1 bg-[#fff5f5] border border-[#fecaca] rounded-[10px] text-[11px] text-[#e53e3e] font-semibold py-2.5 cursor-pointer font-[Inter] flex items-center justify-center gap-1">
                <Icon name="Trash2" size={12} color="#e53e3e" /> Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-[Inter] flex flex-col" style={{ background: 'linear-gradient(165deg, #062F38 0%, #084C5A 60%, #0A6070 100%)' }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#084C5A] via-[#0B7285] to-[#2EC4B6] px-5 pb-5 sticky top-0 z-10 flex flex-col" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <button
          onClick={onBack}
          className="bg-transparent border-0 text-white/70 cursor-pointer px-0 py-3 font-[Inter] text-left"
        >
          ‹ Volver
        </button>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 text-2xl font-black text-white">
              <Icon name="ShoppingCart" size={22} color="#fff" />
              Marketplace
            </div>
            <div className="text-xs text-white/60 mt-0.5">Equipos, props y servicios para producción</div>
          </div>
          <button
            onClick={() => {
              setForm(EMPTY_FORM)
              setMode('new')
            }}
            className="bg-white/95 border-0 rounded-[12px] px-4 py-2.5 text-xs font-bold text-[#0B7285] cursor-pointer font-[Inter]"
          >
            + Publicar
          </button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar equipos, props, servicios..."
          className="w-full font-[Inter] text-sm bg-white/15 border-[1.5px] border-white/25 rounded-[12px] px-3.5 py-2.5 text-white placeholder-white/50 outline-none"
        />
      </div>

      {/* Modales */}
      {selected && renderDetail()}
      {mode === 'new' && renderForm(false)}
      {mode === 'edit' && renderForm(true)}
      {mode === 'pin-edit' && renderPinModal('edit')}
      {mode === 'pin-del' && renderPinModal('del')}

      {/* Items */}
      <div className="flex-1 p-4 pb-8">
        {loading ? (
          <div className="text-center py-[60px] text-white/50">
            <div
              className="w-8 h-8 border-[3px] border-white/20 border-t-white/70 rounded-full animate-spin mx-auto mb-3"
            />
            <div className="text-xs">Cargando publicaciones…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-[60px] text-white/50">
            <div className="mb-1"><Icon name="ShoppingCart" size={40} color="rgba(255,255,255,0.5)" /></div>
            <div className="text-base font-semibold mb-1.5">{search ? 'Sin resultados' : 'El marketplace está vacío'}</div>
            <div className="text-xs">{search ? 'Probá con otra búsqueda' : 'Sé el primero en publicar'}</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-[14px] overflow-hidden border border-[#ede9e3] shadow-sm cursor-pointer"
                onClick={() => openDetail(item)}
              >
                {(item.fotos || []).length > 0 ? (
                  <img
                    src={item.fotos[0]}
                    alt={item.titulo}
                    className="w-full aspect-video object-cover"
                  />
                ) : (
                  <div className="w-full aspect-video bg-[#f0ede8] flex items-center justify-center">
                    <Icon name="Package" size={36} color="var(--text-secondary)" />
                  </div>
                )}
                <div className="p-2.5">
                  <div className="text-[10px] bg-[#0B728515] text-[#0B7285] rounded px-1.5 py-0.5 inline-block mb-1.5">
                    {item.categoria}
                  </div>
                  <div className="text-xs font-bold text-[#1a1714] mb-0.5 line-clamp-2">
                    {item.titulo}
                  </div>
                  {item.descripcion && (
                    <div className="text-[10px] text-[#888] mb-1 line-clamp-2">
                      {item.descripcion.slice(0, 60)}{item.descripcion.length > 60 ? '…' : ''}
                    </div>
                  )}
                  {item.precio && (
                    <div className="text-xs font-bold text-[#0B7285] mb-1">{item.precio}</div>
                  )}
                  <div className="text-[10px] text-[#aaa] mb-1 flex items-center gap-1">
                    <Icon name="Phone" size={10} color="#aaa" />
                    {item.contacto}{item.nombre ? ' · ' + item.nombre : ''}
                  </div>
                  {(item.vistas || 0) > 0 && (
                    <div className="text-[10px] text-[#bbb] mb-2 flex items-center gap-1">
                      <Icon name="Eye" size={10} color="#bbb" />
                      {item.vistas} {item.vistas === 1 ? 'vista' : 'vistas'}
                    </div>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); openWhatsApp(item.contacto) }}
                    className="w-full text-center bg-[#25D366] text-white rounded-lg px-3 py-2 text-[11px] font-bold border-0 cursor-pointer font-[Inter] mb-2 flex items-center justify-center gap-1"
                  >
                    <Icon name="MessageCircle" size={12} color="#fff" />
                    WhatsApp
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(item) }}
                      className="flex-1 bg-[#f0f7ff] border border-[#cce4f7] rounded text-[10px] text-[#0B7285] font-semibold py-1.5 cursor-pointer font-[Inter]"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); startDel(item) }}
                      className="flex-1 bg-[#fff5f5] border border-[#fecaca] rounded text-[10px] text-[#e53e3e] font-semibold py-1.5 cursor-pointer font-[Inter] flex items-center justify-center gap-1"
                    >
                      <Icon name="Trash2" size={12} color="#e53e3e" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .animate-spin { animation: spin 0.8s linear infinite }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden }
      `}</style>
    </div>
  )
}
