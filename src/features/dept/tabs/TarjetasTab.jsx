import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { SectionLabel } from '../../../components/ui/SectionLabel'

const DEFAULT_TARJETAS = [
  { id:'t1', nombre:'Tarjeta 1', grabada:false, backup1:false, backup2:false, escenas:[] },
  { id:'t2', nombre:'Tarjeta 2', grabada:false, backup1:false, backup2:false, escenas:[] },
  { id:'t3', nombre:'Tarjeta 3', grabada:false, backup1:false, backup2:false, escenas:[] },
]

function CheckBox({ checked, onChange, label, col }) {
  return (
    <div onClick={onChange} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, cursor:'pointer', minWidth:38 }}>
      <div style={{ width:22, height:22, borderRadius:6, background:checked?col:'transparent', border:checked?'none':`2px solid ${col}66`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        {checked && <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>✓</span>}
      </div>
      {label && <span style={{ fontSize:9, color:checked?col:'#aaa', fontWeight:700, fontFamily:'inherit', letterSpacing:'0.04em' }}>{label}</span>}
    </div>
  )
}

export default function TarjetasTab({ color, deptKey, projectId, project }) {
  const { items: tarjetasRaw, save } = useDeptData(projectId, deptKey || 'camara', 'tarjetas', null)
  const [editingName, setEditingName] = useState(null)
  const tarjetas = tarjetasRaw && tarjetasRaw.length ? tarjetasRaw : DEFAULT_TARJETAS
  const todasEscenas = project ? project.days.flatMap(d => d.scenes.map(s => ({ id:s.id, num:s.num, title:s.title }))) : []
  const addTarjeta = () => save([...tarjetas, { id:'t'+Date.now(), nombre:`Tarjeta ${tarjetas.length+1}`, grabada:false, backup1:false, backup2:false, escenas:[] }])
  const updateTarjeta = (id, patch) => save(tarjetas.map(t => t.id===id ? { ...t, ...patch } : t))
  const delTarjeta = (id) => save(tarjetas.filter(t => t.id !== id))
  const toggleEscena = (tId, scId) => {
    const t = tarjetas.find(x => x.id === tId)
    const next = (t.escenas||[]).includes(scId) ? (t.escenas||[]).filter(x=>x!==scId) : [...(t.escenas||[]), scId]
    updateTarjeta(tId, { escenas: next })
  }
  return (
    <div>
      <SectionLabel>TARJETAS DE CÁMARA ({tarjetas.length})</SectionLabel>
      <div style={{ fontSize:11, color:'#aaa', marginBottom:14, fontFamily:'inherit', fontStyle:'italic' }}>Tocá el nombre para renombrar.</div>
      {tarjetas.map(t => {
        const escenasCount = (t.escenas||[]).length
        return (
          <div key={t.id} style={{ background:'var(--bg-secondary)', borderRadius:14, marginBottom:12, border:`1px solid ${color}25`, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px 12px', borderBottom:'1px solid #f5f3f0' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20 }}>💾</div>
              <div style={{ flex:1, minWidth:0 }}>
                {editingName === t.id
                  ? <input autoFocus value={t.nombre} onChange={e => updateTarjeta(t.id, { nombre:e.target.value })} onBlur={() => setEditingName(null)} onKeyDown={e => { if(e.key==='Enter') setEditingName(null) }}
                      style={{ width:'100%', fontFamily:'inherit', fontSize:14, fontWeight:700, background:'var(--bg-card-dark)', border:`1px solid ${color}44`, borderRadius:8, padding:'4px 10px', color:'var(--text-primary)', outline:'none' }} />
                  : <div onClick={() => setEditingName(t.id)} style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit', cursor:'text' }}>
                      {t.nombre} <span style={{ color:'#ccc', fontSize:10, marginLeft:4 }}>✎</span>
                    </div>
                }
                <div style={{ fontSize:10, color:'#aaa', fontFamily:'inherit', marginTop:2 }}>
                  {escenasCount > 0 ? `${escenasCount} escena${escenasCount!==1?'s':''} asignada${escenasCount!==1?'s':''}` : 'Sin escenas asignadas'}
                </div>
              </div>
              <button onClick={() => delTarjeta(t.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:8, color:'var(--color-primary)', fontSize:12, cursor:'pointer', padding:'4px 8px' }}>✕</button>
            </div>
            <div style={{ display:'flex', justifyContent:'space-around', padding:'12px 16px', background:'var(--bg-card-dark)', borderBottom:'1px solid #f5f3f0' }}>
              <CheckBox checked={!!t.grabada} onChange={() => updateTarjeta(t.id, { grabada:!t.grabada })} label="GRABADA" col={color} />
              <CheckBox checked={!!t.backup1} onChange={() => updateTarjeta(t.id, { backup1:!t.backup1 })} label="BACKUP 1" col="#0fa87e" />
              <CheckBox checked={!!t.backup2} onChange={() => updateTarjeta(t.id, { backup2:!t.backup2 })} label="BACKUP 2" col="#0fa87e" />
            </div>
            <div style={{ padding:'12px 16px 14px' }}>
              <div style={{ fontSize:9, color:'#aaa', letterSpacing:'0.08em', marginBottom:8, fontFamily:'inherit' }}>ESCENAS GRABADAS EN ESTA TARJETA</div>
              {todasEscenas.length === 0
                ? <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'inherit', fontStyle:'italic' }}>Sin escenas en el proyecto todavía</div>
                : <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {todasEscenas.map(sc => {
                      const sel = (t.escenas||[]).includes(sc.id)
                      return (
                        <button key={sc.id} onClick={() => toggleEscena(t.id, sc.id)} title={sc.title}
                          style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:20, cursor:'pointer', border:'none', fontFamily:'inherit', fontSize:11, fontWeight:700, background:sel?color:'#f0ede8', color:sel?'#fff':'#888' }}>
                          {sel && <span style={{ fontSize:10 }}>✓</span>}
                          {sc.num}
                        </button>
                      )
                    })}
                  </div>
              }
            </div>
          </div>
        )
      })}
      <button onClick={addTarjeta} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:4 }}>+ Agregar tarjeta</button>
    </div>
  )
}
