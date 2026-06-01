import { useState, useEffect } from 'react'
import { Icon } from '../../components/ui/Icon'
import { DeptAvatar } from '../../components/ui/DeptAvatar'
import { api } from '../../services/api'

// ── Sub-tab panels ────────────────────────────────────────────

function PlanosTab({ scene, planos, depts, color, isAdmin, projectId, onUpdateScene, onOpenDept, savePlanos }) {
  const [showForm, setShowForm] = useState(false)
  const [editPlano, setEditPlano] = useState(null)

  const togglePlano     = (id) => savePlanos(planos.map(p => p.id===id ? {...p, done:!p.done} : p))
  const toggleEstrella  = (id) => savePlanos(planos.map(p => p.id===id ? {...p, estrella:!p.estrella} : p))
  const deletePlano     = (id) => savePlanos(planos.filter(p => p.id!==id))
  const savePlano = (form) => {
    if (!form.numero) return
    if (editPlano) savePlanos(planos.map(p => p.id===editPlano.id ? {...p,...form} : p))
    else           savePlanos([...planos, { id:Date.now(), ...form }])
    setShowForm(false); setEditPlano(null)
  }

  const donePlanos = planos.filter(p => p.done).length
  const tiempoTotal = planos.reduce((acc, p) => {
    if (!p.duracion) return acc
    const m = p.duracion.match(/(\d+)\s*(h|hs|hora|min|m)/i)
    if (!m) return acc
    const val = parseInt(m[1])
    return acc + (m[2].toLowerCase().startsWith('h') ? val*60 : val)
  }, 0)
  const tiempoStr = tiempoTotal > 0
    ? (tiempoTotal>=60 ? `${Math.floor(tiempoTotal/60)}h ${tiempoTotal%60}m` : `${tiempoTotal}m`)
    : null

  return (
    <div>
      {/* Scene description */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, color:'var(--text-tertiary)', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit', fontWeight:700 }}>
          DESCRIPCIÓN / NOTAS DE LA ESCENA
        </div>
        <textarea
          value={scene.descripcion || ''}
          onChange={e => onUpdateScene({ ...scene, descripcion: e.target.value })}
          placeholder="Describí la escena, acción, atmósfera..."
          rows={3}
          style={{ width:'100%', fontFamily:'inherit', fontSize:14, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:12, padding:'12px 14px', color:'var(--text-primary)', outline:'none', resize:'none', lineHeight:1.6 }}
        />
      </div>

      {tiempoStr && (
        <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:12, display:'flex', alignItems:'center', gap:4 }}>
          <Icon name="Timer" size={11} color="currentColor"/> {donePlanos}/{planos.length} planos · {tiempoStr} total
        </div>
      )}

      {showForm && (
        <PlanoForm plano={editPlano} color={color} depts={depts}
          onSave={savePlano} onCancel={() => { setShowForm(false); setEditPlano(null) }}/>
      )}

      {!showForm && planos.length === 0 && (
        <div style={{ textAlign:'center', padding:'32px 20px', color:'#ccc', fontFamily:'inherit' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:10 }}>
            <Icon name="Video" size={32} color="var(--text-tertiary)"/>
          </div>
          <div style={{ fontSize:14 }}>Sin tomas todavía</div>
        </div>
      )}

      {planos.map(p => (
        <PlanoCard key={p.id} plano={p} depts={depts} color={color}
          onToggle={() => togglePlano(p.id)}
          onEdit={() => { setEditPlano(p); setShowForm(true) }}
          onDelete={() => deletePlano(p.id)}
          onOpenDept={onOpenDept}
          onToggleEstrella={() => toggleEstrella(p.id)}
          onSaveComentario={txt => savePlanos(planos.map(x => x.id===p.id ? {...x,comentario:txt} : x))}
        />
      ))}

      {!showForm && (
        <button onClick={() => { setEditPlano(null); setShowForm(true) }}
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:4 }}>
          + Agregar toma
        </button>
      )}
    </div>
  )
}

function PlanoCard({ plano, depts, color, onToggle, onEdit, onDelete, onOpenDept, onToggleEstrella, onSaveComentario }) {
  const [showComment, setShowComment] = useState(false)
  const [draft, setDraft] = useState(plano.comentario || '')

  const tags = [
    plano.lluvia    && { label:'Lluvia',   icon:'CloudRain',     bg:'#e4f0f7', color:'#2f7ed8' },
    plano.vfx       && { label:'VFX',      icon:'Sparkles',      bg:'#f5f0ff', color:'#7c3fbf' },
    plano.drone     && { label:'Drone',    icon:'Navigation',    bg:'#e8f8f0', color:'#0fa87e' },
    plano.animales  && { label:'Animales', icon:'PawPrint',      bg:'#fff8ec', color:'#d48c0e' },
    plano.actores   && { label:'Actores',  icon:'Theater',       bg:'#f5f0ff', color:'#7c3fbf' },
    plano.sonido    && { label:'Sonido',   icon:'Mic',           bg:'#e8f8f0', color:'#0fa87e' },
  ].filter(Boolean)

  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:14, border:`1px solid ${color}22`, marginBottom:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'stretch' }}>
        <div style={{ width:4, background:plano.done ? '#0fa87e' : (plano.estrella ? '#d48c0e' : color) }}/>
        <div style={{ flex:1, padding:'12px 14px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <span style={{ fontSize:12, fontWeight:800, color:color, fontFamily:'inherit' }}>{plano.numero}</span>
            {plano.estrella && <Icon name="Star" size={13} color="#d48c0e" style={{fill:'#d48c0e'}}/>}
            {plano.duracion && (
              <span style={{ fontSize:11, fontWeight:700, color:'#d48c0e', fontFamily:'inherit', marginLeft:'auto' }}>
                <Icon name="Timer" size={12} color="#d48c0e"/> {plano.duracion}
              </span>
            )}
          </div>
          {(plano.tipo || plano.lente) && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:6 }}>
              {plano.tipo && (
                <span style={{ fontSize:10, fontWeight:600, color:color, fontFamily:'inherit' }}>{plano.tipo}</span>
              )}
              {plano.tipo && plano.lente && <span style={{ fontSize:10, color:'var(--text-muted)' }}>·</span>}
              {plano.lente && (
                <span style={{ fontSize:10, fontWeight:600, color:'var(--text-secondary)', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:3 }}>
                  <Icon name="Aperture" size={10} color="currentColor"/> {plano.lente}
                </span>
              )}
            </div>
          )}
          {plano.descripcion && (
            <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', lineHeight:1.4, marginBottom:6 }}>{plano.descripcion}</div>
          )}
          {tags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
              {tags.map(t => (
                <span key={t.label} style={{ fontSize:9, padding:'1px 6px', borderRadius:6, background:t.bg, color:t.color, display:'inline-flex', alignItems:'center', gap:3 }}>
                  <Icon name={t.icon} size={9} color={t.color}/> {t.label}
                </span>
              ))}
            </div>
          )}
          {plano.comentario && !showComment && (
            <div style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'inherit', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              <Icon name="MessageSquare" size={10} color="currentColor"/> {plano.comentario}
            </div>
          )}
          {showComment && (
            <div style={{ marginTop:6 }}>
              <textarea value={draft} onChange={e=>setDraft(e.target.value)} rows={2} placeholder="Comentario..."
                style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:8, padding:'8px 10px', color:'var(--text-primary)', outline:'none', resize:'none', marginBottom:4 }}/>
              <div style={{ display:'flex', gap:6 }}>
                <button onClick={() => { onSaveComentario(draft); setShowComment(false) }}
                  style={{ flex:1, fontFamily:'inherit', fontSize:11, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:8, padding:'7px', cursor:'pointer' }}>Guardar</button>
                <button onClick={() => setShowComment(false)}
                  style={{ flex:1, fontFamily:'inherit', fontSize:11, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:8, padding:'7px', cursor:'pointer' }}>Cancelar</button>
              </div>
            </div>
          )}
          <div style={{ display:'flex', gap:6, marginTop:6 }}>
            <button onClick={onEdit} style={{ fontFamily:'inherit', fontSize:11, background:'var(--bg-card)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'var(--text-secondary)' }}>Editar</button>
            <button onClick={() => setShowComment(!showComment)} style={{ fontFamily:'inherit', fontSize:11, background:'var(--bg-card)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:3 }}>
              <Icon name="MessageSquare" size={11} color="currentColor"/> Nota
            </button>
            <button onClick={onToggleEstrella} style={{ fontFamily:'inherit', fontSize:11, background:'var(--bg-card)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', color: plano.estrella ? '#d48c0e' : 'var(--text-muted)' }}>
              <Icon name="Star" size={11} color={plano.estrella?'#d48c0e':'currentColor'} style={plano.estrella?{fill:'#d48c0e'}:{}}/>
            </button>
            <button onClick={onDelete} style={{ fontFamily:'inherit', fontSize:11, background:'var(--bg-error)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', color:'var(--color-primary)' }}>✕</button>
          </div>
        </div>
        <div onClick={onToggle} className="tap"
          style={{ width:44, display:'flex', alignItems:'center', justifyContent:'center', background:plano.done?'#f0fff8':'var(--bg-card)', borderLeft:'1px solid var(--border-light)', cursor:'pointer', flexShrink:0 }}>
          <Icon name={plano.done?'CheckCircle':'Circle'} size={20} color={plano.done?'#0fa87e':'#ccc'}/>
        </div>
      </div>
    </div>
  )
}

function PlanoForm({ plano, color, depts, onSave, onCancel }) {
  const [form, setForm] = useState({
    numero: plano?.numero || '',
    descripcion: plano?.descripcion || '',
    duracion: plano?.duracion || '',
    tipo: plano?.tipo || '',
    lente: plano?.lente || '',
    noche: plano?.noche || false,
    lluvia: plano?.lluvia || false,
    vfx: plano?.vfx || false,
    drone: plano?.drone || false,
    animales: plano?.animales || false,
    actores: plano?.actores || false,
    sonido: plano?.sonido || false,
    ...plano,
  })
  const s = (k, v) => setForm(f => ({...f, [k]: v}))

  const TIPOS = ['Plano general', 'Plano medio', 'Plano cerrado', 'Primer plano', 'Plano detalle', 'Plano americano', 'Plano picado', 'Contraplano', 'Travelling', 'Plano secuencia', 'Aéreo']
  const LENTES = ['10mm','12mm','14mm','16mm','18mm','21mm','24mm','28mm','35mm','40mm','50mm','65mm','75mm','85mm','100mm','135mm','150mm','180mm','200mm']
  const FLAGS = [
    {k:'lluvia',icon:'CloudRain',label:'Lluvia'},
    {k:'vfx',icon:'Sparkles',label:'VFX'},{k:'drone',icon:'Navigation',label:'Drone'},
    {k:'animales',icon:'PawPrint',label:'Animales'},{k:'actores',icon:'Theater',label:'Actores'},
    {k:'sonido',icon:'Mic',label:'Sonido'},
  ]

  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginBottom:12 }}>
      <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.06em', marginBottom:12, fontFamily:'inherit' }}>
        {plano ? 'EDITAR PLANO' : 'NUEVO PLANO'}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:10 }}>
        <input value={form.numero} onChange={e=>s('numero',e.target.value)} placeholder="Plano 1A"
          style={{ width:'38%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:`1.5px solid ${color}55`, borderRadius:10, padding:'10px', color:'var(--text-primary)', outline:'none' }}/>
        <input value={form.duracion} onChange={e=>s('duracion',e.target.value)} placeholder="Duración (ej: 2min)"
          style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}/>
      </div>
      <select value={form.tipo} onChange={e=>s('tipo',e.target.value)}
        style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }}>
        <option value="">Tipo de plano...</option>
        {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <textarea value={form.descripcion} onChange={e=>s('descripcion',e.target.value)} placeholder="Descripción, movimiento de cámara, acción..." rows={2}
        style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', resize:'none', marginBottom:10 }}/>

      {/* Lente */}
      <div style={{ fontSize:10, color:'var(--text-tertiary)', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit', fontWeight:700 }}>LENTE</div>
      <div style={{ display:'flex', gap:8, marginBottom:8 }}>
        <select value={LENTES.includes(form.lente) ? form.lente : ''} onChange={e=>s('lente',e.target.value)}
          style={{ width:'42%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}>
          <option value="">Elegí mm…</option>
          {LENTES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <input value={form.lente} onChange={e=>s('lente',e.target.value)} placeholder="Ej: 35mm t2,5"
          style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}/>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
        {LENTES.map(l => (
          <button key={l} onClick={() => s('lente', l)}
            style={{ fontFamily:'inherit', fontSize:10, padding:'3px 9px', borderRadius:16, border:`1px solid ${form.lente===l?color:'var(--border-light)'}`, background:form.lente===l?`${color}15`:'transparent', color:form.lente===l?color:'var(--text-muted)', cursor:'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
        {FLAGS.map(f => (
          <button key={f.k} onClick={() => s(f.k, !form[f.k])}
            style={{ fontFamily:'inherit', fontSize:11, padding:'4px 10px', borderRadius:20, border:`1px solid ${form[f.k]?color:'var(--border-light)'}`, background:form[f.k]?`${color}15`:'transparent', color:form[f.k]?color:'var(--text-muted)', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4 }}>
            <Icon name={f.icon} size={11} color={form[f.k]?color:'currentColor'}/> {f.label}
          </button>
        ))}
      </div>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onCancel} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
        <button onClick={() => onSave(form)} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>
          {plano ? 'Guardar cambios' : 'Agregar plano'}
        </button>
      </div>
    </div>
  )
}

// ── Main SceneView ────────────────────────────────────────────
export default function SceneView({ scene, depts, isAdmin, onBack, onUpdateScene, projectId, accentColor }) {
  const [section, setSection]   = useState('planos')
  const [planos, setPlanos]     = useState([])
  const [storyboard, setStory]  = useState([])
  const [editingNum, setEditing] = useState(false)
  const [numDraft, setNumDraft] = useState('')
  const [activeDept, setActiveDept] = useState(null)

  useEffect(() => {
    if (!projectId) return
    api.getDeptData(projectId, 'scenes', `${scene.id}__planos`).then(d => { if (Array.isArray(d)) setPlanos(d) }).catch(() => {})
    api.getDeptData(projectId, 'scenes', `${scene.id}__storyboard`).then(d => { if (Array.isArray(d)) setStory(d) }).catch(() => {})
  }, [projectId, scene.id])

  const savePlanos = (v) => {
    const total = v.reduce((acc, p) => {
      if (!p.duracion) return acc
      const m = p.duracion.match(/(\d+)\s*(h|hs|hora|min|m)/i)
      if (!m) return acc
      return acc + (m[2].toLowerCase().startsWith('h') ? parseInt(m[1])*60 : parseInt(m[1]))
    }, 0)
    setPlanos(v)
    api.saveDeptData(projectId, 'scenes', `${scene.id}__planos`, v).catch(() => {})
    onUpdateScene({ ...scene, tiempoTotal: total })
  }

  const saveStoryboard = (v) => {
    setStory(v)
    api.saveDeptData(projectId, 'scenes', `${scene.id}__storyboard`, v).catch(() => {})
  }

  const toggleDept = (dk) => {
    const curr = scene.depts || []
    onUpdateScene({ ...scene, depts: curr.includes(dk) ? curr.filter(k=>k!==dk) : [...curr,dk] })
  }

  const assignedDepts = (scene.depts || []).filter(k => depts[k])
  const otherDepts    = Object.keys(depts).filter(k => !(scene.depts||[]).includes(k))
  const color = accentColor || '#0B7285'

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', flexDirection:'column' }} className="slide-r">
      {/* Header */}
      <div className="theme-surface" style={{ padding:'14px 20px 0', borderBottom:'1px solid var(--border-light)', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ display:'flex', alignItems:'center', marginBottom:8 }}>
          <button onClick={onBack} className="tap" style={{ background:'none', border:'none', fontSize:13, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', padding:0 }}>
            ‹ Volver
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
              {editingNum ? (
                <input value={numDraft} onChange={e => setNumDraft(e.target.value)}
                  onBlur={() => { if (numDraft.trim()) onUpdateScene({...scene, num:numDraft.trim()}); setEditing(false) }}
                  onKeyDown={e => { if(e.key==='Enter'){ if(numDraft.trim()) onUpdateScene({...scene, num:numDraft.trim()}); setEditing(false) } if(e.key==='Escape') setEditing(false) }}
                  autoFocus
                  style={{ fontSize:12, letterSpacing:'0.08em', color:'var(--text-tertiary)', fontFamily:'inherit', fontWeight:700, border:'1.5px solid var(--color-primary)', background:'var(--bg-card-dark)', borderRadius:6, padding:'3px 8px', outline:'none', maxWidth:160 }}/>
              ) : (
                <span style={{ fontSize:11, letterSpacing:'0.1em', color:'var(--text-tertiary)', fontFamily:'inherit' }}>{scene.num}</span>
              )}
              <button onClick={() => { setNumDraft(scene.num); setEditing(true) }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:12, padding:'2px 4px', opacity:0.6 }}>✎</button>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit', lineHeight:1.3 }}>{scene.title}</div>
          </div>
          <div onClick={() => onUpdateScene({...scene, done:!scene.done})} className="tap"
            style={{ cursor:'pointer', width:36, height:36, borderRadius:'50%', background:scene.done?'#0fa87e18':'var(--bg-card)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon name={scene.done?'CheckCircle':'Circle'} size={22} color={scene.done?'#0fa87e':'#ccc'}/>
          </div>
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex' }}>
          {[['planos',`Tomas (${planos.length})`],['storyboard','Story'],['deptos','Deptos']].map(([k,l]) => (
            <button key={k} onClick={() => setSection(k)}
              style={{ flex:1, fontFamily:'inherit', fontSize:11, fontWeight:700, padding:'10px 4px', border:'none', background:'none', cursor:'pointer', color:section===k?color:'var(--text-tertiary)', borderBottom:section===k?`2px solid ${color}`:'2px solid transparent' }}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1, padding:'16px 16px 80px' }}>
        {scene.notes && (
          <div style={{ background:'var(--bg-card)', borderRadius:12, padding:'10px 14px', border:'1px solid var(--border-light)', marginBottom:16 }}>
            <div style={{ fontSize:10, color:'#d48c0e', letterSpacing:'0.08em', marginBottom:3, fontFamily:'inherit' }}>NOTAS DE DIRECCIÓN</div>
            <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', lineHeight:1.5 }}>{scene.notes}</div>
          </div>
        )}

        {section === 'planos' && (
          <PlanosTab scene={scene} planos={planos} depts={depts} color={color}
            isAdmin={isAdmin} projectId={projectId} onUpdateScene={onUpdateScene}
            onOpenDept={setActiveDept} savePlanos={savePlanos}/>
        )}

        {section === 'storyboard' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em', fontFamily:'inherit' }}>STORYBOARD ({storyboard.length} frames)</div>
              <label style={{ fontFamily:'inherit', fontSize:11, fontWeight:700, color:'#7c3fbf', background:'#7c3fbf15', border:'1px solid #7c3fbf33', borderRadius:20, padding:'5px 12px', cursor:'pointer' }}>
                + Subir frame
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files[0]; if(!file) return
                  try {
                    if (window.uploadFileToR2) { const {url} = await window.uploadFileToR2(file); saveStoryboard([...storyboard,{id:Date.now(),url}]) }
                  } catch(err) { alert('Error: '+err.message) }
                }} style={{ display:'none' }}/>
              </label>
            </div>
            {storyboard.length === 0
              ? <div style={{ background:'var(--bg-card-dark)', borderRadius:12, padding:28, textAlign:'center', color:'var(--text-muted)', fontSize:12, border:'1px dashed var(--border-light)' }}>Sin frames — subí las imágenes del storyboard</div>
              : storyboard.map((f,i) => (
                  <div key={f.id} style={{ position:'relative', borderRadius:12, overflow:'hidden', marginBottom:10 }}>
                    <img src={f.url||f.img} alt={`Frame ${i+1}`} style={{ width:'100%', display:'block', borderRadius:12, border:'1px solid var(--border-light)' }}/>
                    <div style={{ position:'absolute', top:8, left:8, fontSize:11, color:'#fff', fontWeight:700, background:'rgba(0,0,0,0.5)', borderRadius:6, padding:'2px 8px' }}>Frame {i+1}</div>
                    <button onClick={() => saveStoryboard(storyboard.filter(x=>x.id!==f.id))} style={{ position:'absolute', top:8, right:8, width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.5)', border:'none', color:'#fff', fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                  </div>
                ))
            }
          </div>
        )}

        {section === 'deptos' && (
          <div>
            {assignedDepts.length > 0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:10, fontFamily:'inherit' }}>ASIGNADOS</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {assignedDepts.map(dk => {
                    const m = depts[dk]
                    return (
                      <div key={dk} style={{ display:'flex', alignItems:'center', background:'var(--bg-secondary)', borderRadius:14, border:`1px solid ${m.color}30`, overflow:'hidden' }}>
                        <button onClick={() => setActiveDept(dk)} className="tap"
                          style={{ flex:1, display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                          <DeptAvatar photo={m.photo} icon={m.icon} color={m.color} size={36} borderRadius={10} fontSize={18}/>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{m.label}</div>
                            <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'inherit' }}>Checklist · Citación →</div>
                          </div>
                          <div style={{ fontSize:18, color:'#ccc' }}>›</div>
                        </button>
                        {isAdmin && (
                          <button onClick={() => toggleDept(dk)}
                            style={{ width:44, alignSelf:'stretch', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-error)', border:'none', borderLeft:'1px solid #ffe0e0', cursor:'pointer', color:'#ffb3b3', fontSize:16 }}>✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            {isAdmin && otherDepts.length > 0 && (
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:10, fontFamily:'inherit' }}>AGREGAR DEPARTAMENTO</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
                  {otherDepts.map(dk => {
                    const m = depts[dk]
                    return (
                      <button key={dk} onClick={() => toggleDept(dk)} className="tap"
                        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'var(--bg-secondary)', borderRadius:12, padding:'12px 8px', border:'1px dashed var(--border-light)', cursor:'pointer', fontFamily:'inherit' }}>
                        <DeptAvatar photo={m.photo} icon={m.icon} color={m.color} size={32} borderRadius={10} fontSize={18}/>
                        <span style={{ fontSize:10, color:'#aaa', fontFamily:'inherit', textAlign:'center' }}>{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {assignedDepts.length === 0 && !isAdmin && (
              <div style={{ textAlign:'center', padding:28, color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin departamentos asignados</div>
            )}
          </div>
        )}
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
          <Icon name="Clapperboard" size={20} color={color}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em', maxWidth:80, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color }}>
            {scene.num}
          </span>
        </div>
      </div>
    </div>
  )
}
