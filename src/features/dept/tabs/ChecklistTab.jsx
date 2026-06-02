import { useState } from 'react'
import { Icon } from '../../../components/ui/Icon'
import { useDeptData } from '../../../hooks/useDeptData'

const fmtTs = (ts) => {
  if (!ts) return null
  const d = new Date(ts)
  return d.toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'}) + ' ' + d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})
}

export default function ChecklistTab({ color, deptKey, projectId }) {
  const { items, save: saveItems } = useDeptData(projectId, deptKey, 'checklist', [])
  const [texto, setTexto]    = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [filterEstado, setFilterEstado] = useState('todos')

  const add = () => {
    if (!texto.trim()) return
    saveItems([{ id:Date.now(), texto:texto.trim(), done:false, ts:Date.now() }, ...items])
    setTexto(''); setShowAdd(false)
  }
  const toggle = (id) => saveItems(items.map(i => i.id===id ? {...i, done:!i.done} : i))
  const del    = (id) => saveItems(items.filter(i => i.id!==id))

  const done = items.filter(i => i.done).length
  const pct  = items.length ? done/items.length : 0

  const visible = items.filter(i => {
    return filterEstado==='pendientes' ? !i.done : filterEstado==='listos' ? i.done : true
  })

  return (
    <div>
      {/* Progress bar */}
      <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'14px 16px', border:'1px solid var(--border-light)', marginBottom:14 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <div style={{ fontSize:13, color:'var(--text-primary)', fontWeight:700, fontFamily:'inherit' }}>{done} / {items.length} completados</div>
          <div style={{ fontSize:16, fontWeight:700, color, fontFamily:'inherit' }}>{Math.round(pct*100)}%</div>
        </div>
        <div style={{ height:6, background:'var(--bg-card)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ width:`${pct*100}%`, height:'100%', background:color, borderRadius:3, transition:'width 0.4s' }}/>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[['todos','TODOS'],['pendientes','PEND.'],['listos','LISTOS']].map(([k,l]) => (
          <button key={k} onClick={() => setFilterEstado(k)}
            style={{ fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:'0.05em', padding:'5px 12px', borderRadius:20, cursor:'pointer', border:'none', background:filterEstado===k?color:'var(--bg-card-dark)', color:filterEstado===k?'#fff':'#999' }}>
            {l}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div style={{ textAlign:'center', padding:'24px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>
          {filterEstado==='pendientes' ? '¡Todo listo!' : 'Sin ítems.'}
        </div>
      )}

      {visible.map(item => (
        <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:12, background:'var(--bg-secondary)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:item.done?'1px solid var(--border-light)':`1px solid ${color}25`, opacity:item.done?0.55:1 }}>
          <div onClick={() => toggle(item.id)}
            style={{ width:24, height:24, borderRadius:7, flexShrink:0, cursor:'pointer', marginTop:1, background:item.done?color:'var(--bg-card)', border:item.done?'none':`2px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            {item.done && <Icon name="Check" size={13} color="#fff" strokeWidth={3}/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, color:item.done?'var(--text-muted)':'var(--text-primary)', fontFamily:'inherit', textDecoration:item.done?'line-through':'none' }}>{item.texto}</div>
            {item.ts && (
              <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit', marginTop:3, display:'flex', alignItems:'center', gap:3 }}>
                <Icon name="Clock" size={9} color="var(--text-muted)"/> {fmtTs(item.ts)}
              </div>
            )}
          </div>
          <button onClick={() => del(item.id)} style={{ background:'none', border:'none', color:'var(--border-light)', fontSize:16, cursor:'pointer', padding:0, flexShrink:0 }}>✕</button>
        </div>
      ))}

      {!showAdd ? (
        <button onClick={() => setShowAdd(true)}
          style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:4 }}>
          + Agregar ítem
        </button>
      ) : (
        <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginTop:4 }}>
          <textarea value={texto} onChange={e => setTexto(e.target.value)} placeholder="Descripción del ítem..." rows={2} autoFocus
            style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', resize:'none', marginBottom:10 }}/>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => { setShowAdd(false); setTexto('') }}
              style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
            <button onClick={add}
              style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Agregar</button>
          </div>
        </div>
      )}
    </div>
  )
}
