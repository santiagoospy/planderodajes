import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'
import { ProgressBar } from '../../../components/ui/ProgressBar'

const DEFAULT_ITEMS = [
  'Maleta de cámara','Maleta de lentes','Trípode',
  'Maleta de filtros','Monitor de campo','Monitor de cámara',
]

export default function ChecklistEquipoTab({ color, deptKey, projectId }) {
  const { items: itemsRaw, save } = useDeptData(projectId, deptKey, 'checklist_equipo', null)
  const [texto, setTexto] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const items = itemsRaw && itemsRaw.length ? itemsRaw : DEFAULT_ITEMS.map((t, i) => ({ id:'eq'+i, texto:t, done:false }))
  const toggle = (id) => save(items.map(i => i.id===id ? { ...i, done:!i.done } : i))
  const del    = (id) => save(items.filter(i => i.id !== id))
  const add    = () => {
    if (!texto.trim()) return
    save([...items, { id:'eq'+Date.now(), texto:texto.trim(), done:false, ts:Date.now() }])
    setTexto(''); setShowAdd(false)
  }
  const fmtTs = (ts) => {
    if (!ts) return null
    const d = new Date(ts)
    return d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'}) + ' ' + d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})
  }
  const done = items.filter(i => i.done).length
  const pct  = items.length ? done/items.length : 0
  return (
    <div>
      <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'14px 16px', border:'1px solid var(--border-light)', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontFamily:'inherit', fontSize:13, color:'var(--text-primary)', fontWeight:700 }}>{done} / {items.length} ítems cargados</div>
          <div style={{ fontFamily:'inherit', fontSize:16, fontWeight:700, color }}>{Math.round(pct*100)}%</div>
        </div>
        <ProgressBar pct={pct} color={color} height={6} />
      </div>
      <SectionLabel>EQUIPO DE CÁMARA</SectionLabel>
      {items.map(item => (
        <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg-secondary)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:item.done?'1px solid #ede9e3':`1px solid ${color}25`, opacity:item.done?0.55:1 }}>
          <div onClick={() => toggle(item.id)} style={{ width:24, height:24, borderRadius:7, flexShrink:0, cursor:'pointer', background:item.done?color:'var(--bg-card-dark)', border:item.done?'none':`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {item.done && <span style={{ color:'#fff', fontSize:13, fontWeight:700 }}>✓</span>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:item.done?'var(--text-muted)':'var(--text-primary)', fontFamily:'inherit', textDecoration:item.done?'line-through':'none' }}>{item.texto}</div>
            {item.ts && <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit', marginTop:2 }}><Icon name="Clock" size={9} color="var(--text-muted)" /> {fmtTs(item.ts)}</div>}
          </div>
          <button onClick={() => del(item.id)} style={{ background:'none', border:'none', color:'#e5e2dd', cursor:'pointer', padding:0 }}>✕</button>
        </div>
      ))}
      {!showAdd
        ? <button onClick={() => setShowAdd(true)} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:4 }}>+ Agregar ítem de equipo</button>
        : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:14, border:`1px solid ${color}30`, marginTop:4 }}>
            <input autoFocus value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej: Slider, Follow focus..." onKeyDown={e => { if(e.key==='Enter') add() }}
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:10 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setShowAdd(false); setTexto('') }} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={add} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Agregar</button>
            </div>
          </div>
      }
    </div>
  )
}
