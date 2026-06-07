import { useState, useEffect } from 'react'
import { Icon } from '../../components/ui/Icon'
import { DeptAvatar } from '../../components/ui/DeptAvatar'
import { PinModal } from '../../components/ui/PinModal'
import { api } from '../../services/api'
import { onSurface } from '../../utils/color'

// ── MiniChecklist ─────────────────────────────────────────────
function MiniChecklist({ items, setItems, color, ink }) {
  const accent = ink ? ink(color) : color
  const [nuevo, setNuevo] = useState('')
  const toggle  = (id) => setItems(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  const eliminar = (id) => setItems(items.filter(i => i.id !== id))
  const agregar = () => {
    const t = nuevo.trim()
    if (!t) return
    setItems([...items, { id: Date.now() + Math.random(), text: t, done: false }])
    setNuevo('')
  }
  return (
    <div>
      <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit', fontWeight:700 }}>
        CHECKLIST
      </div>
      {items.map(it => (
        <div key={it.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, background:'var(--bg-card)', borderRadius:8, padding:'8px 10px' }}>
          <button onClick={() => toggle(it.id)}
            style={{ width:20, height:20, borderRadius:6, background: it.done ? color : 'transparent', border: it.done ? 'none' : `2px solid ${accent}`, cursor:'pointer', flexShrink:0, padding:0, color:'#fff', fontSize:12 }}>
            {it.done ? '✓' : ''}
          </button>
          <span style={{ flex:1, fontSize:13, color: it.done ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily:'inherit', textDecoration: it.done ? 'line-through' : 'none' }}>{it.text}</span>
          <button onClick={() => eliminar(it.id)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:15, cursor:'pointer', padding:0, lineHeight:1 }}>✕</button>
        </div>
      ))}
      <div style={{ display:'flex', gap:6, marginTop:6 }}>
        <input value={nuevo} onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); agregar() } }}
          placeholder="Agregar tarea…"
          style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:8, padding:'8px 10px', color:'var(--text-primary)', outline:'none' }}/>
        <button onClick={agregar}
          style={{ fontFamily:'inherit', fontSize:14, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:8, padding:'0 14px', cursor:'pointer' }}>+</button>
      </div>
    </div>
  )
}

// ── DeptChecklistCard ─────────────────────────────────────────
function DeptChecklistCard({ deptKey, meta, checklist, onUpdateChecklist, onRemove, isAdmin, themeLight }) {
  const [open, setOpen] = useState(false)
  const done = (checklist || []).filter(i => i.done).length
  const total = (checklist || []).length
  const ink = (c) => onSurface(c, themeLight)
  const deptInk = ink(meta.color)

  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:12, border:`1px solid ${deptInk}3a`, marginBottom:8, overflow:'hidden' }}>
      <div onClick={() => setOpen(!open)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:'pointer', background:deptInk+'14' }}>
        <Icon name={meta.icon || 'Clapperboard'} size={18} color={deptInk}/>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{meta.label}</div>
          <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit' }}>
            {done}/{total} ✓
          </div>
        </div>
        {isAdmin && (
          <button onClick={e => { e.stopPropagation(); onRemove() }}
            style={{ background:'var(--bg-error)', border:'none', borderRadius:6, color:'var(--color-primary)', fontSize:11, cursor:'pointer', padding:'4px 7px' }}>✕</button>
        )}
        <span style={{ fontSize:14, color:'#ccc' }}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div style={{ padding:'14px', borderTop:`1px solid ${deptInk}22`, background:'var(--bg-card-dark)' }}>
          <MiniChecklist
            items={checklist || []}
            setItems={onUpdateChecklist}
            color={meta.color}
            ink={ink}/>
        </div>
      )}
    </div>
  )
}

// ── PlanoCard ────────────────────────────────────────────────
function PlanoCard({ plano, depts, color, themeLight, onToggle, onEdit, onDelete, onToggleEstrella, onSaveComentario, onToggleDeptOk }) {
  const [showComment, setShowComment] = useState(false)
  const [draft, setDraft] = useState(plano.comentario || '')
  const ink = (c) => onSurface(c, themeLight)
  const accent = ink(color)

  const assignedDepts = (plano.depts || []).map(dk => ({ dk, meta: depts?.[dk] })).filter(x => x.meta)

  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:14, border:`1px solid ${color}22`, marginBottom:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'stretch' }}>
        <div style={{ width:4, background:plano.done ? '#0fa87e' : (plano.estrella ? '#d48c0e' : color) }}/>
        <div style={{ flex:1, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:13, fontWeight:800, color:accent, fontFamily:'inherit' }}>{plano.numero}</span>
            {plano.estrella && <Icon name="Star" size={14} color="#d48c0e" style={{ fill:'#d48c0e' }}/>}
            {plano.duracion && (
              <span style={{ fontSize:12, fontWeight:700, color:'#d48c0e', fontFamily:'inherit', marginLeft:'auto', display:'flex', alignItems:'center', gap:4 }}>
                <Icon name="Timer" size={14} color="#d48c0e"/> {plano.duracion}
              </span>
            )}
          </div>
          {(plano.tipo || plano.lente) && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:6, alignItems:'center' }}>
              {plano.tipo && (
                <span style={{ fontSize:12, fontWeight:600, color:accent, fontFamily:'inherit' }}>{plano.tipo}</span>
              )}
              {plano.tipo && plano.lente && <span style={{ fontSize:12, color:'var(--text-muted)' }}>·</span>}
              {plano.lente && (
                <span style={{ fontSize:12, fontWeight:600, color:'var(--text-secondary)', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:4 }}>
                  <Icon name="Aperture" size={13} color="currentColor"/> {plano.lente}
                </span>
              )}
            </div>
          )}
          {plano.foto && (
            <div style={{ marginBottom:8, borderRadius:10, overflow:'hidden', border:`1px solid ${color}22` }}>
              <img src={plano.foto} alt="referencia" style={{ width:'100%', maxHeight:140, objectFit:'cover', display:'block' }}/>
            </div>
          )}
          {plano.descripcion && (
            <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', lineHeight:1.5, marginBottom:8 }}>{plano.descripcion}</div>
          )}
          {assignedDepts.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:8, marginTop:4 }}>
              {assignedDepts.map(({ dk, meta }) => {
                const ok = plano.deptsOk?.[dk]
                const di = ink(meta.color)
                return (
                  <button key={dk} onClick={() => onToggleDeptOk(dk)} className="tap"
                    style={{ display:'flex', alignItems:'center', gap:8, background: ok ? `${di}22` : 'var(--bg-card)', border:`1px solid ${ok ? di+'66' : 'var(--border-light)'}`, borderRadius:8, padding:'7px 10px', cursor:'pointer', textAlign:'left' }}>
                    <Icon name={ok ? 'CheckSquare' : 'Square'} size={15} color={ok ? di : 'var(--text-secondary)'}/>
                    <Icon name={meta.icon || 'Clapperboard'} size={14} color={ok ? di : 'var(--text-secondary)'}/>
                    <span style={{ fontSize:12, fontWeight:600, color: ok ? di : 'var(--text-secondary)', fontFamily:'inherit' }}>{meta.label}</span>
                  </button>
                )
              })}
            </div>
          )}
          {plano.comentario && !showComment && (
            <div style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'inherit', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
              <Icon name="MessageSquare" size={13} color="currentColor"/> {plano.comentario}
            </div>
          )}
          {showComment && (
            <div style={{ marginTop:6 }}>
              <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={2} placeholder="Nota de toma..."
                style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:8, padding:'8px 10px', color:'var(--text-primary)', outline:'none', resize:'none', marginBottom:4 }}/>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => { onSaveComentario(draft); setShowComment(false) }}
                  style={{ flex:1, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:8, padding:'8px', cursor:'pointer' }}>Guardar</button>
                <button onClick={() => setShowComment(false)}
                  style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:8, padding:'8px', cursor:'pointer' }}>Cancelar</button>
              </div>
            </div>
          )}
          <div style={{ display:'flex', gap:6, marginTop:8 }}>
            <button onClick={onEdit}
              style={{ fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', color:'var(--text-secondary)' }}>Editar</button>
            <button onClick={() => setShowComment(!showComment)}
              style={{ fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:4 }}>
              <Icon name="MessageSquare" size={13} color="currentColor"/> Nota
            </button>
            <button onClick={onToggleEstrella}
              style={{ fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color: plano.estrella ? '#d48c0e' : 'var(--text-muted)' }}>
              <Icon name="Star" size={13} color={plano.estrella ? '#d48c0e' : 'currentColor'} style={plano.estrella ? { fill:'#d48c0e' } : {}}/>
            </button>
            <button onClick={onDelete}
              style={{ fontFamily:'inherit', fontSize:12, background:'var(--bg-error)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'var(--color-primary)' }}>✕</button>
          </div>
        </div>
        <div onClick={onToggle} className="tap"
          style={{ width:48, display:'flex', alignItems:'center', justifyContent:'center', background:plano.done ? '#f0fff8' : 'var(--bg-card)', borderLeft:'1px solid var(--border-light)', cursor:'pointer', flexShrink:0 }}>
          <Icon name={plano.done ? 'CheckCircle' : 'Circle'} size={22} color={plano.done ? '#0fa87e' : 'var(--text-muted)'}/>
        </div>
      </div>
    </div>
  )
}

// ── PlanoForm ────────────────────────────────────────────────
function PlanoForm({ plano, color, depts, themeLight, onSave, onCancel }) {
  const ink = (c) => onSurface(c, themeLight)
  const accent = ink(color)
  const [form, setForm] = useState({
    numero: plano?.numero || '',
    descripcion: plano?.descripcion || '',
    duracion: plano?.duracion || '',
    tipo: plano?.tipo || '',
    lente: plano?.lente || '',
    noche: plano?.noche || false,
    depts: plano?.depts || [],
    deptsOk: plano?.deptsOk || {},
    foto: plano?.foto || null,
    ...plano,
  })
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const [uploadingFoto, setUploadingFoto] = useState(false)

  const handleFoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const data = await window.compressImage(file, 1200, 0.80)
      s('foto', data)
    } finally {
      setUploadingFoto(false)
    }
  }
  const toggleDept = (dk) => setForm(f => {
    const curr = f.depts || []
    return { ...f, depts: curr.includes(dk) ? curr.filter(k => k !== dk) : [...curr, dk] }
  })

  const TIPOS = ['Plano general','Plano medio','Plano cerrado','Primer plano','Plano detalle','Plano americano','Plano picado','Contraplano','Travelling','Plano secuencia','Aéreo']
  const LENTES = ['10mm','12mm','14mm','16mm','18mm','21mm','24mm','28mm','35mm','40mm','50mm','65mm','75mm','85mm','100mm','135mm','150mm','180mm','200mm']
  const deptEntries = Object.entries(depts || {})

  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginBottom:12 }}>
      <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.06em', marginBottom:12, fontFamily:'inherit', fontWeight:700 }}>
        {plano ? 'EDITAR TOMA' : 'NUEVA TOMA'}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input value={form.numero} onChange={e => s('numero', e.target.value)} placeholder="Plano 1A"
          style={{ width:'38%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:`1.5px solid ${accent}77`, borderRadius:10, padding:'10px', color:'var(--text-primary)', outline:'none' }}/>
        <input value={form.duracion} onChange={e => s('duracion', e.target.value)} placeholder="Duración (ej: 2min)"
          style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}/>
      </div>
      <select value={form.tipo} onChange={e => s('tipo', e.target.value)}
        style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }}>
        <option value="">Tipo de plano...</option>
        {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea value={form.descripcion} onChange={e => s('descripcion', e.target.value)} placeholder="Descripción, movimiento de cámara, acción..." rows={2}
        style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', resize:'none', marginBottom:10 }}/>

      {/* Foto de referencia */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit', fontWeight:700 }}>FOTO / STORYBOARD</div>
        {form.foto ? (
          <div style={{ position:'relative', display:'inline-block' }}>
            <img src={form.foto} alt="referencia" style={{ width:'100%', maxHeight:180, objectFit:'cover', borderRadius:10, display:'block', border:`1px solid ${color}33` }}/>
            <button onClick={() => s('foto', null)}
              style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.55)', border:'none', borderRadius:20, width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14, lineHeight:1 }}>✕</button>
          </div>
        ) : (
          <label style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'var(--bg-card)', border:`1.5px dashed ${color}55`, borderRadius:10, cursor:'pointer', color:'var(--text-secondary)', fontFamily:'inherit', fontSize:13 }}>
            <Icon name={uploadingFoto ? 'Loader' : 'ImagePlus'} size={18} color={accent}/>
            <span>{uploadingFoto ? 'Subiendo…' : 'Agregar foto de referencia'}</span>
            <input type="file" accept="image/*" onChange={handleFoto} style={{ display:'none' }} disabled={uploadingFoto}/>
          </label>
        )}
      </div>

      <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit', fontWeight:700 }}>LENTE</div>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <select value={LENTES.includes(form.lente) ? form.lente : ''} onChange={e => s('lente', e.target.value)}
          style={{ width:'42%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}>
          <option value="">Elegí mm…</option>
          {LENTES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input value={form.lente} onChange={e => s('lente', e.target.value)} placeholder="Ej: 35mm t2,5"
          style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}/>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
        {LENTES.map(l => (
          <button key={l} onClick={() => s('lente', l)}
            style={{ fontFamily:'inherit', fontSize:11, padding:'4px 9px', borderRadius:16, border:`1px solid ${form.lente === l ? accent : 'var(--border-light)'}`, background:form.lente === l ? `${accent}22` : 'transparent', color:form.lente === l ? accent : 'var(--text-secondary)', cursor:'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onCancel}
          style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'11px', cursor:'pointer' }}>Cancelar</button>
        <button onClick={() => onSave(form)}
          style={{ flex:2, fontFamily:'inherit', fontSize:13, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'11px', cursor:'pointer' }}>
          {plano ? 'Guardar cambios' : 'Agregar toma'}
        </button>
      </div>
    </div>
  )
}

// ── Main SceneView ────────────────────────────────────────────
export default function SceneView({ scene, depts, isAdmin, onBack, onUpdateScene, projectId, accentColor, themeLight, project, onLock, onUnlock }) {
  const [planos, setPlanos]           = useState([])
  const [deptChecklists, setDeptChecklists] = useState({})
  const [showForm, setShowForm]       = useState(false)
  const [editPlano, setEditPlano]     = useState(null)
  const [editingNum, setEditing]      = useState(false)
  const [numDraft, setNumDraft]       = useState('')
  const [showPinModal, setShowPinModal] = useState(false)

  useEffect(() => {
    if (!projectId) return
    api.getDeptData(projectId, 'scenes', `${scene.id}__planos`)
      .then(d => { if (Array.isArray(d)) setPlanos(d) }).catch(() => {})
    api.getDeptData(projectId, 'scenes', `${scene.id}__deptchecklists`)
      .then(d => { if (d && typeof d === 'object') setDeptChecklists(d) }).catch(() => {})
  }, [projectId, scene.id])

  const savePlanos = (v) => {
    const total = v.reduce((acc, p) => {
      if (!p.duracion) return acc
      const m = p.duracion.match(/(\d+)\s*(h|hs|hora|min|m)/i)
      if (!m) return acc
      return acc + (m[2].toLowerCase().startsWith('h') ? parseInt(m[1]) * 60 : parseInt(m[1]))
    }, 0)
    setPlanos(v)
    api.saveDeptData(projectId, 'scenes', `${scene.id}__planos`, v).catch(() => {})
    onUpdateScene({ ...scene, tiempoTotal: total })
  }

  const saveDeptChecklists = (v) => {
    setDeptChecklists(v)
    api.saveDeptData(projectId, 'scenes', `${scene.id}__deptchecklists`, v).catch(() => {})
  }

  const updateDeptChecklist = (dk, items) => {
    saveDeptChecklists({ ...deptChecklists, [dk]: items })
  }

  const toggleDept = (dk) => {
    const curr = scene.depts || []
    onUpdateScene({ ...scene, depts: curr.includes(dk) ? curr.filter(k => k !== dk) : [...curr, dk] })
  }

  const savePlano = (form) => {
    if (!form.numero) return
    if (editPlano) savePlanos(planos.map(p => p.id === editPlano.id ? { ...p, ...form } : p))
    else           savePlanos([...planos, { id: Date.now(), ...form }])
    setShowForm(false); setEditPlano(null)
  }

  const togglePlano    = (id) => savePlanos(planos.map(p => p.id === id ? { ...p, done:!p.done } : p))
  const toggleEstrella = (id) => savePlanos(planos.map(p => p.id === id ? { ...p, estrella:!p.estrella } : p))
  const deletePlano    = (id) => savePlanos(planos.filter(p => p.id !== id))

  const donePlanos = planos.filter(p => p.done).length
  const tiempoTotal = planos.reduce((acc, p) => {
    if (!p.duracion) return acc
    const m = p.duracion.match(/(\d+)\s*(h|hs|hora|min|m)/i)
    if (!m) return acc
    const val = parseInt(m[1])
    return acc + (m[2].toLowerCase().startsWith('h') ? val * 60 : val)
  }, 0)
  const tiempoStr = tiempoTotal > 0
    ? (tiempoTotal >= 60 ? `${Math.floor(tiempoTotal / 60)}h ${tiempoTotal % 60}m` : `${tiempoTotal}m`)
    : null

  const assignedDepts = (scene.depts || []).filter(k => depts[k])
  const otherDepts    = Object.keys(depts).filter(k => !(scene.depts || []).includes(k))
  const color = accentColor || '#0B7285'
  const ink = (c) => onSurface(c, themeLight)
  const accent = ink(color)

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', flexDirection:'column' }} className="slide-r">
      {/* Header */}
      <div className="theme-surface" style={{ paddingTop:'calc(env(safe-area-inset-top, 0px) + 14px)', paddingBottom:12, paddingLeft:20, paddingRight:20, borderBottom:'1px solid var(--border-light)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <button onClick={onBack} className="tap"
            style={{ background:'none', border:'none', fontSize:14, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', padding:0, display:'flex', alignItems:'center', gap:4 }}>
            <Icon name="ChevronLeft" size={16} color="currentColor"/> Volver
          </button>
          {(onLock || onUnlock) && (
            <button onClick={() => isAdmin ? onLock?.() : setShowPinModal(true)} className="tap"
              style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 8px', display:'flex', alignItems:'center', gap:5, color:'var(--text-secondary)', fontFamily:'inherit', fontSize:12 }}>
              <Icon name={isAdmin ? 'LockOpen' : 'Lock'} size={16} color={isAdmin ? accent : 'var(--text-muted)'}/>
            </button>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
              {editingNum ? (
                <input value={numDraft} onChange={e => setNumDraft(e.target.value)}
                  onBlur={() => { if (numDraft.trim()) onUpdateScene({ ...scene, num:numDraft.trim() }); setEditing(false) }}
                  onKeyDown={e => { if (e.key === 'Enter') { if (numDraft.trim()) onUpdateScene({ ...scene, num:numDraft.trim() }); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
                  autoFocus
                  style={{ fontSize:12, letterSpacing:'0.08em', color:'var(--text-tertiary)', fontFamily:'inherit', fontWeight:700, border:'1.5px solid var(--color-primary)', background:'var(--bg-card-dark)', borderRadius:6, padding:'3px 8px', outline:'none', maxWidth:160 }}/>
              ) : (
                <span style={{ fontSize:12, letterSpacing:'0.1em', color:'var(--text-tertiary)', fontFamily:'inherit', fontWeight:600 }}>{scene.num}</span>
              )}
              <button onClick={() => { setNumDraft(scene.num); setEditing(true) }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:13, padding:'2px 4px', opacity:0.6 }}>✎</button>
            </div>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit', lineHeight:1.3 }}>{scene.title}</div>
          </div>
          <div onClick={() => onUpdateScene({ ...scene, done:!scene.done })} className="tap"
            style={{ cursor:'pointer', width:38, height:38, borderRadius:'50%', background:scene.done ? '#0fa87e18' : 'var(--bg-card)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1.5px solid ${scene.done ? '#0fa87e44' : 'var(--border-light)'}` }}>
            <Icon name={scene.done ? 'CheckCircle' : 'Circle'} size={22} color={scene.done ? '#0fa87e' : 'var(--text-muted)'}/>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:'16px 16px 80px' }}>
        {/* Notas de dirección */}
        {scene.notes && (
          <div style={{ background:'var(--bg-card)', borderRadius:12, padding:'10px 14px', border:'1px solid var(--border-light)', marginBottom:16 }}>
            <div style={{ fontSize:10, color:'#d48c0e', letterSpacing:'0.08em', marginBottom:4, fontFamily:'inherit', fontWeight:700 }}>NOTAS DE DIRECCIÓN</div>
            <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', lineHeight:1.5 }}>{scene.notes}</div>
          </div>
        )}

        {/* Descripción de la escena */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10, color:'var(--text-tertiary)', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit', fontWeight:700 }}>
            DESCRIPCIÓN / NOTAS DE LA ESCENA
          </div>
          <textarea
            value={scene.descripcion || ''}
            onChange={e => onUpdateScene({ ...scene, descripcion: e.target.value })}
            placeholder="Describí la escena, acción, atmósfera..."
            rows={3}
            style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:12, padding:'12px 14px', color:'var(--text-primary)', outline:'none', resize:'none', lineHeight:1.6 }}
          />
        </div>

        {/* Tomas */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.06em', fontFamily:'inherit' }}>
            TOMAS
          </div>
          {tiempoStr && (
            <div style={{ fontSize:12, color:'var(--text-muted)', display:'flex', alignItems:'center', gap:5 }}>
              <Icon name="Timer" size={13} color="currentColor"/> {donePlanos}/{planos.length} · {tiempoStr}
            </div>
          )}
        </div>

        {showForm && (
          <PlanoForm plano={editPlano} color={color} depts={depts} themeLight={themeLight}
            onSave={savePlano} onCancel={() => { setShowForm(false); setEditPlano(null) }}/>
        )}

        {!showForm && planos.length === 0 && (
          <div style={{ textAlign:'center', padding:'24px 20px', color:'var(--text-muted)', fontFamily:'inherit', background:'var(--bg-secondary)', borderRadius:14, border:'1px dashed var(--border-light)', marginBottom:12 }}>
            <Icon name="Video" size={28} color="var(--text-tertiary)"/>
            <div style={{ fontSize:13, marginTop:8 }}>Sin tomas todavía</div>
          </div>
        )}

        {planos.map(p => (
          <PlanoCard key={p.id} plano={p} depts={depts} color={color} themeLight={themeLight}
            onToggle={() => togglePlano(p.id)}
            onEdit={() => { setEditPlano(p); setShowForm(true) }}
            onDelete={() => deletePlano(p.id)}
            onToggleEstrella={() => toggleEstrella(p.id)}
            onSaveComentario={txt => savePlanos(planos.map(x => x.id === p.id ? { ...x, comentario:txt } : x))}
            onToggleDeptOk={(dk) => savePlanos(planos.map(x => x.id === p.id ? { ...x, deptsOk:{ ...(x.deptsOk || {}), [dk]:!(x.deptsOk?.[dk]) } } : x))}
          />
        ))}

        {!showForm && (
          <button onClick={() => { setEditPlano(null); setShowForm(true) }}
            style={{ width:'100%', fontFamily:'inherit', fontSize:14, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:4 }}>
            + Agregar toma
          </button>
        )}

        {/* Departamentos */}
        <div style={{ marginTop:28, marginBottom:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Icon name="Users" size={16} color="var(--text-secondary)"/>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', letterSpacing:'0.06em', fontFamily:'inherit' }}>
              DEPARTAMENTOS
            </span>
          </div>

          {assignedDepts.length === 0 && !isAdmin && (
            <div style={{ textAlign:'center', padding:20, color:'var(--text-muted)', fontFamily:'inherit', fontSize:13 }}>
              Sin departamentos asignados
            </div>
          )}

          {assignedDepts.map(dk => (
            <DeptChecklistCard
              key={dk}
              deptKey={dk}
              meta={depts[dk]}
              checklist={deptChecklists[dk] || []}
              onUpdateChecklist={(items) => updateDeptChecklist(dk, items)}
              onRemove={() => toggleDept(dk)}
              isAdmin={isAdmin}
              themeLight={themeLight}
            />
          ))}

          {isAdmin && otherDepts.length > 0 && (
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:10, fontFamily:'inherit' }}>
                AGREGAR DEPARTAMENTO
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                {otherDepts.map(dk => {
                  const m = depts[dk]
                  const di = ink(m.color)
                  return (
                    <button key={dk} onClick={() => toggleDept(dk)} className="tap"
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5, background:'var(--bg-secondary)', borderRadius:12, padding:'12px 8px', border:`1px dashed ${m.color}66`, cursor:'pointer', fontFamily:'inherit' }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:m.color, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <Icon name={m.icon || 'Clapperboard'} size={18} color='#fff'/>
                      </div>
                      <span style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'inherit', textAlign:'center', lineHeight:1.2 }}>{m.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="theme-surface" style={{ position:'sticky', bottom:0, borderTop:'1px solid var(--border-light)', padding:'8px 20px calc(env(safe-area-inset-bottom,0px) + 8px)', display:'flex', alignItems:'center', gap:12, zIndex:10 }}>
        <button onClick={onBack} className="tap"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 20px', borderRadius:12, color:'var(--text-secondary)', fontFamily:'inherit', minWidth:72 }}>
          <Icon name="ChevronLeft" size={20} color="var(--text-secondary)"/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em' }}>VOLVER</span>
        </button>
        <div style={{ width:1, height:36, background:'var(--border-light)' }}/>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 20px', fontFamily:'inherit', minWidth:72 }}>
          <Icon name="Clapperboard" size={20} color={accent}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em', maxWidth:80, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:accent }}>
            {scene.num}
          </span>
        </div>
      </div>

      {showPinModal && (
        <PinModal
          title="Desbloquear edición"
          subtitle="PIN del proyecto"
          correctPin={project?.pin || '1234'}
          pinHash={project?.pinHash}
          onSuccess={() => { onUnlock?.(); setShowPinModal(false) }}
          onCancel={() => setShowPinModal(false)}
        />
      )}
    </div>
  )
}
