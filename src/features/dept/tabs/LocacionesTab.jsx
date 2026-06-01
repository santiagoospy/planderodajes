import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'

function StarRating({ value, onChange }) {
  return (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{ background:'none', border:'none', cursor:'pointer', padding:2, fontSize:24, color: n<=value ? '#f5a623' : 'var(--border-light)' }}>★</button>
      ))}
    </div>
  )
}

function MultiPhotoUploader({ fotos, setFotos, color, label='Fotos', max=24 }) {
  const [uploading, setUploading] = useState(false)
  const [progreso, setProgreso] = useState({ done:0, total:0 })
  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const restantes = Math.max(0, max - fotos.length)
    const aSubir = files.slice(0, restantes)
    setUploading(true); setProgreso({ done:0, total:aSubir.length })
    const nuevas = []
    for (let i = 0; i < aSubir.length; i++) {
      try {
        const data = window.compressImageStrong
          ? await window.compressImageStrong(aSubir[i])
          : await new Promise(res => { const r = new FileReader(); r.onload = ev => res(ev.target.result); r.readAsDataURL(aSubir[i]) })
        nuevas.push({ id: Date.now()+i+Math.random(), data, nombre: aSubir[i].name })
        setProgreso({ done:i+1, total:aSubir.length })
      } catch { /* skip */ }
    }
    setFotos([...fotos, ...nuevas]); setUploading(false); setProgreso({ done:0, total:0 })
    e.target.value = ''
  }
  const eliminar = (id) => setFotos(fotos.filter(f => f.id !== id))
  return (
    <div>
      <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit' }}>
        {label.toUpperCase()} ({fotos.length}/{max})
      </div>
      {fotos.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginBottom:8 }}>
          {fotos.map(f => (
            <div key={f.id} style={{ position:'relative', paddingTop:'75%', background:'var(--bg-card-dark-secondary)', borderRadius:8, overflow:'hidden' }}>
              <img src={f.data || f.url} alt={f.nombre||''} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              <button onClick={() => eliminar(f.id)} style={{ position:'absolute', top:3, right:3, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
      <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'var(--bg-card-dark)', border:`1px dashed ${color}55`, borderRadius:10, padding:'12px', cursor:uploading?'wait':'pointer', fontFamily:'inherit', fontSize:12, color:uploading?'#aaa':color, fontWeight:700 }}>
        {uploading ? `Comprimiendo ${progreso.done}/${progreso.total}…` : 'Subir fotos (se pueden seleccionar varias)'}
        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" multiple onChange={handleFiles} disabled={uploading} style={{ display:'none' }} />
      </label>
    </div>
  )
}

export default function LocacionesTab({ color, deptKey, projectId, project }) {
  const { items: locs, save: setLocs } = useDeptData(projectId, deptKey, 'locs', [])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [form, setForm] = useState({ nombre:'', url:'', escenas:[], notas:'', fotos:[], rating:0, comentarioReview:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const todasEscenas = project
    ? project.days.flatMap(d => d.scenes.map(s => ({ id:s.id, label:`${s.num} — ${s.title.slice(0,25)}`, day:d.label })))
    : []

  const toggleEscena = (scId) => {
    const curr = form.escenas || []
    set('escenas', curr.includes(scId) ? curr.filter(x => x!==scId) : [...curr, scId])
  }

  const openAdd = () => { setEditId(null); setForm({ nombre:'', url:'', escenas:[], notas:'', fotos:[], rating:0, comentarioReview:'' }); setShowForm(true) }
  const openEdit = (l) => {
    setEditId(l.id)
    const fotosBase = Array.isArray(l.fotos) ? l.fotos : []
    const fotosMigradas = (!fotosBase.length && l.foto) ? [{ id:'mig_'+l.id, data:l.foto, nombre:'foto.jpg' }] : fotosBase
    setForm({ nombre:l.nombre||'', url:l.url||'', escenas:l.escenas||[], notas:l.notas||'', fotos:fotosMigradas, rating:l.rating||0, comentarioReview:l.comentarioReview||'' })
    setShowForm(true)
  }
  const save = () => {
    if (!form.nombre) return
    if (editId) {
      setLocs(locs.map(l => { if (l.id!==editId) return l; const { foto, ...rest } = l; return { ...rest, ...form } }))
    } else {
      setLocs([...locs, { id:Date.now(), ...form, estado:'pendiente' }])
    }
    setShowForm(false); setEditId(null)
  }
  const del      = (id) => setLocs(locs.filter(l => l.id !== id))
  const toggleOk = (id) => setLocs(locs.map(l => l.id===id ? { ...l, estado:l.estado==='confirmada'?'pendiente':'confirmada' } : l))

  const getFotos = (l) => {
    const arr = Array.isArray(l.fotos) ? l.fotos : []
    if (!arr.length && l.foto) return [{ id:'mig_'+l.id, data:l.foto, nombre:'foto.jpg' }]
    return arr
  }

  return (
    <div>
      <SectionLabel>LOCACIONES — {locs.length} cargadas</SectionLabel>
      {locs.map(l => {
        const escenaLabels = (l.escenas||[]).map(scId => todasEscenas.find(x=>x.id===scId)?.label?.split('—')[0]?.trim()).filter(Boolean)
        const fotos = getFotos(l)
        return (
          <div key={l.id} style={{ background:'var(--bg-secondary)', borderRadius:14, border:`1px solid ${color}20`, marginBottom:12, overflow:'hidden' }}>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{l.nombre}</div>
                  {l.rating > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                      <div style={{ display:'flex', gap:1 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ fontSize:13, color:n<=l.rating?'#f5a623':'var(--border-light)', lineHeight:1 }}>★</span>)}</div>
                      <span style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit', fontWeight:700 }}>{l.rating}/5</span>
                    </div>
                  )}
                  {escenaLabels.length > 0 && (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:4 }}>
                      {escenaLabels.map((lb,i) => <span key={i} style={{ fontSize:10, padding:'2px 7px', borderRadius:8, background:color+'15', color, fontFamily:'inherit' }}>{lb}</span>)}
                    </div>
                  )}
                  {l.url && <a href={l.url} target="_blank" rel="noreferrer" style={{ fontSize:11, color, fontFamily:'inherit', display:'block', marginTop:4 }}>Ver en Maps</a>}
                  {l.notas && <div style={{ fontSize:12, color:'var(--text-tertiary)', fontFamily:'inherit', marginTop:4 }}>{l.notas}</div>}
                  {l.comentarioReview && <div style={{ fontSize:11, color:'#666', fontFamily:'inherit', marginTop:6, background:'var(--bg-card-dark)', borderRadius:8, padding:'7px 10px', border:'1px solid var(--border-light)', lineHeight:1.4, fontStyle:'italic' }}>"{l.comentarioReview}"</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
                  <div onClick={() => toggleOk(l.id)} style={{ fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', background:l.estado==='confirmada'?'#e8f8f0':'#fff8ec', color:l.estado==='confirmada'?'#0fa87e':'#d48c0e', border:`1px solid ${l.estado==='confirmada'?'#0fa87e44':'#d48c0e44'}` }}>{l.estado==='confirmada'?'✓ OK':'PEND.'}</div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(l)} style={{ background:'var(--bg-card-dark-secondary)', border:'none', borderRadius:8, color:'var(--text-tertiary)', fontSize:13, cursor:'pointer', padding:'4px 8px' }}>✎</button>
                    <button onClick={() => del(l.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:8, color:'var(--color-primary)', fontSize:13, cursor:'pointer', padding:'4px 8px' }}>✕</button>
                  </div>
                </div>
              </div>
              {fotos.length > 0 && (
                <div style={{ marginTop:12 }}>
                  <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit' }}>FOTOS ({fotos.length})</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
                    {fotos.map(f => (
                      <div key={f.id} style={{ position:'relative', paddingTop:'75%', background:'var(--bg-card-dark-secondary)', borderRadius:8, overflow:'hidden' }}>
                        <img src={f.data||f.url} alt={f.nombre||''} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
      {locs.length===0 && !showForm && <div style={{ textAlign:'center', padding:'28px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin locaciones cargadas todavía</div>}
      {!showForm
        ? <button onClick={openAdd} style={{ width:'100%', fontFamily:'inherit', fontSize:12, color, background:'none', border:`1px dashed ${color}55`, borderRadius:12, padding:'11px', cursor:'pointer', marginTop:4 }}>+ Agregar locación</button>
        : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30` }}>
            <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.08em', marginBottom:12, fontFamily:'inherit' }}>{editId ? '✎ EDITAR LOCACIÓN' : 'NUEVA LOCACIÓN'}</div>
            <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre del lugar *"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <input value={form.url} onChange={e => set('url', e.target.value)} placeholder="Link Google Maps"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <input value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Notas (acceso, permisos...)"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:10 }} />
            <div style={{ marginBottom:12 }}>
              <MultiPhotoUploader fotos={form.fotos||[]} setFotos={arr => set('fotos', arr)} color={color} label="Fotos del lugar" max={24} />
            </div>
            {todasEscenas.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit' }}>ESCENAS DE ESTA LOCACIÓN</div>
                <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:160, overflowY:'auto' }}>
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
            <div style={{ background:'var(--bg-card-dark)', borderRadius:12, padding:'12px 14px', border:'1px solid var(--border-light)', marginBottom:12 }}>
              <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit' }}>RESEÑA</div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
                <StarRating value={form.rating||0} onChange={n => set('rating', n)} />
                <span style={{ fontSize:12, color:'var(--text-tertiary)', fontFamily:'inherit' }}>{form.rating ? `${form.rating}/5` : 'Sin puntuar'}</span>
              </div>
              <textarea value={form.comentarioReview||''} onChange={e => set('comentarioReview', e.target.value)} placeholder="Comentarios sobre esta locación…" rows={3}
                style={{ width:'100%', fontFamily:'inherit', fontSize:12, background:'var(--bg-secondary)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', resize:'vertical', lineHeight:1.5 }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={save} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>{editId ? 'Guardar cambios' : 'Guardar locación'}</button>
            </div>
          </div>
      }
    </div>
  )
}
