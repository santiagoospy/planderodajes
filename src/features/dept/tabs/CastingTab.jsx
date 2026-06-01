import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'

function ActorForm({ color, project, form, set, editId, onSave, onCancel, label }) {
  const todasEscenas = project ? project.days.flatMap(d => d.scenes.map(s => ({ id:s.id, label:`${s.num} — ${s.title.slice(0,25)}`, day:d.label }))) : []
  const toggleEscena = (scId) => {
    const curr = form.escenas || []
    set('escenas', curr.includes(scId) ? curr.filter(x=>x!==scId) : [...curr, scId])
  }
  const handleFoto = async (e) => {
    const file = e.target.files[0]; if (!file) return
    try { set('foto', await window.compressImage(file, 800, 0.70)) }
    catch { const r = new FileReader(); r.onload = ev => set('foto', ev.target.result); r.readAsDataURL(file) }
  }
  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30` }}>
      <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.08em', marginBottom:12, fontFamily:'inherit' }}>{editId ? `✎ EDITAR ${label}` : `NUEVO ${label}`}</div>
      <div style={{ marginBottom:12 }}>
        {form.foto
          ? <div style={{ position:'relative', borderRadius:10, overflow:'hidden', maxHeight:160 }}>
              <img src={form.foto} alt="preview" style={{ width:'100%', objectFit:'cover', maxHeight:160 }} />
              <button onClick={() => set('foto','')} style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.5)', border:'none', borderRadius:'50%', width:26, height:26, color:'#fff', fontSize:13, cursor:'pointer' }}>✕</button>
            </div>
          : <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'var(--bg-card-dark)', border:'1px dashed #ccc', borderRadius:10, padding:'16px', cursor:'pointer', fontFamily:'inherit', fontSize:12, color:'#aaa' }}>
              Foto (opcional)
              <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleFoto} style={{ display:'none' }} />
            </label>
        }
      </div>
      {['nombre','personaje','altura','talla','telefono','correo','notas'].map(k => (
        <input key={k} value={form[k]||''} onChange={e => set(k, e.target.value)} placeholder={k === 'nombre' ? 'Nombre y apellido *' : k.charAt(0).toUpperCase() + k.slice(1)}
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
      ))}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit' }}>CITACIÓN (CALL TIME)</div>
        <input value={form.citacion||''} onChange={e => set('citacion', e.target.value)} placeholder="Ej: 08:30hs - Locación principal"
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:`1px solid ${color}44`, borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
      </div>
      {todasEscenas.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit' }}>ESCENAS EN QUE PARTICIPA</div>
          <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:140, overflowY:'auto' }}>
            {todasEscenas.map(sc => {
              const sel = (form.escenas||[]).includes(sc.id)
              return (
                <div key={sc.id} onClick={() => toggleEscena(sc.id)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', borderRadius:8, cursor:'pointer', background:sel?color+'12':'var(--bg-card-dark)', border:`1px solid ${sel?color+'44':'var(--border-light)'}` }}>
                  <div style={{ width:16, height:16, borderRadius:4, background:sel?color:'transparent', border:sel?'none':`2px solid ${color}66`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {sel && <span style={{ color:'#fff', fontSize:10, fontWeight:700 }}>✓</span>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:11, color:'var(--text-secondary)', fontFamily:'inherit' }}>{sc.label}</div>
                    <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit' }}>{sc.day}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onCancel} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
        <button onClick={onSave} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>{editId ? 'Guardar cambios' : 'Agregar'}</button>
      </div>
    </div>
  )
}

function CastingPrincipales({ color, projectId, project }) {
  const { items: actores, save: setActores } = useDeptData(projectId, 'casting', 'principales', [])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const emptyForm = { nombre:'', personaje:'', altura:'', talla:'', telefono:'', correo:'', notas:'', foto:'', escenas:[], citacion:'' }
  const [form, setFormState] = useState(emptyForm)
  const set = (k, v) => setFormState(f => ({ ...f, [k]: v }))
  const todasEscenas = project ? project.days.flatMap(d => d.scenes.map(s => ({ id:s.id }))) : []

  const openAdd  = () => { setEditId(null); setFormState(emptyForm); setShowForm(true) }
  const openEdit = (a) => { setEditId(a.id); setFormState({ nombre:a.nombre||'', personaje:a.personaje||'', altura:a.altura||'', talla:a.talla||'', telefono:a.telefono||'', correo:a.correo||'', notas:a.notas||'', foto:a.foto||'', escenas:a.escenas||[], citacion:a.citacion||'' }); setShowForm(true) }
  const save = () => {
    if (!form.nombre) return
    if (editId) setActores(actores.map(a => a.id===editId ? { ...a, ...form } : a))
    else        setActores([...actores, { id:Date.now(), ...form }])
    setShowForm(false)
  }
  const del = (id) => setActores(actores.filter(a => a.id !== id))

  return (
    <div>
      <SectionLabel>ACTORES PRINCIPALES — {actores.length} cargados</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        {actores.map(a => {
          const escenaLabels = (a.escenas||[]).map(scId => project?.days.flatMap(d=>d.scenes).find(s=>s.id===scId)?.num).filter(Boolean)
          return (
            <div key={a.id} style={{ background:'var(--bg-secondary)', borderRadius:14, border:`1px solid ${color}20`, overflow:'hidden', position:'relative' }}>
              <div style={{ width:'100%', aspectRatio:'3/4', background:'var(--bg-card-dark-secondary)', overflow:'hidden' }}>
                {a.foto ? <img src={a.foto} alt={a.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, color:'rgba(255,255,255,0.3)' }}>🎭</div>}
              </div>
              <div style={{ padding:'10px 10px 12px' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit', marginBottom:2 }}>{a.nombre}</div>
                {a.personaje && <div style={{ fontSize:11, color, fontFamily:'inherit', marginBottom:4, fontStyle:'italic' }}>"{a.personaje}"</div>}
                {a.altura    && <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit' }}>{a.altura}</div>}
                {a.talla     && <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit' }}>{a.talla}</div>}
                {a.telefono  && <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit' }}>{a.telefono}</div>}
                {a.citacion  && <div style={{ fontSize:11, color, fontFamily:'inherit', marginTop:4 }}>{a.citacion}</div>}
                {escenaLabels.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:4 }}>
                    {escenaLabels.map((lb,i) => <span key={i} style={{ fontSize:9, padding:'2px 6px', borderRadius:8, background:color+'15', color, fontFamily:'inherit' }}>{lb}</span>)}
                  </div>
                )}
              </div>
              <div style={{ position:'absolute', top:6, right:6, display:'flex', gap:4 }}>
                <button onClick={() => openEdit(a)} style={{ width:24, height:24, borderRadius:'50%', background:'rgba(0,0,0,0.4)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
                <button onClick={() => del(a.id)} style={{ width:24, height:24, borderRadius:'50%', background:'rgba(200,0,0,0.5)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
              </div>
            </div>
          )
        })}
      </div>
      {!showForm
        ? <button onClick={openAdd} style={{ width:'100%', fontFamily:'inherit', fontSize:12, color:'var(--text-primary)', background:`${color}14`, border:`1px dashed ${color}66`, borderRadius:12, padding:'11px', cursor:'pointer', marginTop:4 }}>+ Agregar actor principal</button>
        : <ActorForm color={color} project={project} form={form} set={set} editId={editId} onSave={save} onCancel={() => { setShowForm(false); setEditId(null) }} label="ACTOR PRINCIPAL" />
      }
    </div>
  )
}

function CastingExtras({ color, projectId, project }) {
  const { items: extras, save: setExtras } = useDeptData(projectId, 'casting', 'extras', [])
  const { items: infoRaw, save: saveInfoArr } = useDeptData(projectId, 'casting', 'extras_info', [])
  const infoTexto = infoRaw && infoRaw[0] ? infoRaw[0].texto || '' : ''
  const saveInfo = (t) => saveInfoArr([{ texto: t }])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const emptyForm = { nombre:'', personaje:'', altura:'', talla:'', telefono:'', correo:'', notas:'', foto:'', escenas:[], citacion:'' }
  const [form, setFormState] = useState(emptyForm)
  const set = (k, v) => setFormState(f => ({ ...f, [k]: v }))

  const openAdd  = () => { setEditId(null); setFormState(emptyForm); setShowForm(true) }
  const openEdit = (e) => { setEditId(e.id); setFormState({ nombre:e.nombre||'', personaje:e.personaje||'', altura:e.altura||'', talla:e.talla||'', telefono:e.telefono||'', correo:e.correo||'', notas:e.notas||'', foto:e.foto||'', escenas:e.escenas||[], citacion:e.citacion||'' }); setShowForm(true) }
  const save = () => {
    if (!form.nombre) return
    if (editId) setExtras(extras.map(e => e.id===editId ? { ...e, ...form } : e))
    else        setExtras([...extras, { id:Date.now(), ...form }])
    setShowForm(false); setEditId(null)
  }
  const del = (id) => setExtras(extras.filter(e => e.id !== id))
  const todasEscenas = project ? project.days.flatMap(d => d.scenes.map(s => ({ id:s.id }))) : []

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.08em', marginBottom:8, fontFamily:'inherit' }}>INFO GENERAL PARA EXTRAS</div>
        <textarea value={infoTexto} onChange={e => saveInfo(e.target.value)} placeholder='Ej: "Nadie lleve ropa roja. Call time 07:00hs."' rows={3}
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #f5e8c0', borderRadius:12, padding:'12px 14px', color:'var(--text-primary)', outline:'none', resize:'none', lineHeight:1.6 }} />
      </div>
      <SectionLabel>EXTRAS REGISTRADOS — {extras.length} personas</SectionLabel>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
        {extras.map(e => (
          <div key={e.id} style={{ background:'var(--bg-secondary)', borderRadius:12, border:'1px solid var(--border-light)', overflow:'hidden', position:'relative' }}>
            <div style={{ width:'100%', aspectRatio:'1', background:'var(--bg-card-dark-secondary)', overflow:'hidden' }}>
              {e.foto ? <img src={e.foto} alt={e.nombre} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, color:'rgba(255,255,255,0.3)' }}>👤</div>}
            </div>
            <div style={{ padding:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{e.nombre}</div>
              {e.notas    && <div style={{ fontSize:10, color:'#aaa', fontFamily:'inherit', marginTop:2 }}>{e.notas}</div>}
              {e.citacion && <div style={{ fontSize:10, color, fontFamily:'inherit', marginTop:2 }}>{e.citacion}</div>}
            </div>
            <div style={{ position:'absolute', top:4, right:4, display:'flex', gap:3 }}>
              <button onClick={() => openEdit(e)} style={{ width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.4)', border:'none', color:'#fff', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
              <button onClick={() => del(e.id)} style={{ width:20, height:20, borderRadius:'50%', background:'rgba(200,0,0,0.5)', border:'none', color:'#fff', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
          </div>
        ))}
      </div>
      {!showForm
        ? <button onClick={openAdd} style={{ width:'100%', fontFamily:'inherit', fontSize:12, color:'var(--text-primary)', background:`${color}14`, border:`1px dashed ${color}66`, borderRadius:12, padding:'11px', cursor:'pointer', marginTop:4 }}>+ Agregar extra</button>
        : <ActorForm color={color} project={project} form={form} set={set} editId={editId} onSave={save} onCancel={() => { setShowForm(false); setEditId(null) }} label="EXTRA" />
      }
    </div>
  )
}

export default function CastingTab({ color, projectId, project }) {
  const [subTab, setSubTab] = useState('principales')
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['principales','Principales'],['extras','Extras']].map(([k,l]) => (
          <button key={k} onClick={() => setSubTab(k)} style={{ flex:1, fontFamily:'inherit', fontSize:13, fontWeight:700, padding:'12px 8px', borderRadius:14, cursor:'pointer', border:'none', background:subTab===k?color:'var(--bg-card-dark)', color:subTab===k?'#fff':'#888' }}>{l}</button>
        ))}
      </div>
      {subTab==='principales' && <CastingPrincipales color={color} projectId={projectId} project={project} />}
      {subTab==='extras'      && <CastingExtras      color={color} projectId={projectId} project={project} />}
    </div>
  )
}
