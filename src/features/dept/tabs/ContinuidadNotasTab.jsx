import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'

export default function ContinuidadNotasTab({ color, deptKey, projectId }) {
  const { items: notas, save: setNotas } = useDeptData(projectId, deptKey, 'continuidad_notas', [])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm] = useState({ escena:'', descripcion:'', fecha:'', autor:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const save = () => {
    if (!form.escena) return
    const item = { id:editId||Date.now(), ...form }
    if (editId) setNotas(notas.map(n => n.id===editId ? item : n))
    else        setNotas([...notas, item])
    setForm({ escena:'', descripcion:'', fecha:'', autor:'' }); setEditId(null); setShowAdd(false)
  }
  const del = (id) => setNotas(notas.filter(n => n.id !== id))
  return (
    <div>
      <SectionLabel>NOTAS DE CONTINUIDAD — {notas.length} notas</SectionLabel>
      {notas.map(nota => (
        <div key={nota.id} style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'12px 14px', marginBottom:12, border:`1px solid ${color}20` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color, marginBottom:4, fontFamily:'inherit' }}>Escena {nota.escena}</div>
              <div style={{ fontSize:12, color:'var(--text-primary)', marginBottom:6, fontFamily:'inherit' }}>{nota.descripcion}</div>
              <div style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'inherit' }}>{nota.autor} · {nota.fecha}</div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => { setEditId(nota.id); setForm({ escena:nota.escena||'', descripcion:nota.descripcion||'', fecha:nota.fecha||'', autor:nota.autor||'' }); setShowAdd(true) }} style={{ background:'var(--bg-card-dark)', border:'none', borderRadius:8, color:'var(--text-secondary)', fontSize:12, cursor:'pointer', padding:'4px 8px' }}>✎</button>
              <button onClick={() => del(nota.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:8, color:'var(--color-primary)', fontSize:12, cursor:'pointer', padding:'4px 8px' }}>✕</button>
            </div>
          </div>
        </div>
      ))}
      {notas.length === 0 && !showAdd && <div style={{ textAlign:'center', padding:'28px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin notas todavía</div>}
      {!showAdd
        ? <button onClick={() => setShowAdd(true)} style={{ width:'100%', fontFamily:'inherit', fontSize:12, color, background:'none', border:`1px dashed ${color}55`, borderRadius:12, padding:'11px', cursor:'pointer', marginTop:4 }}>+ Agregar nota de continuidad</button>
        : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30` }}>
            <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.08em', marginBottom:12, fontWeight:700, fontFamily:'inherit' }}>{editId ? '✎ EDITAR' : 'NUEVA NOTA'}</div>
            <input value={form.escena} onChange={e => set('escena', e.target.value)} placeholder="Número de escena *"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <textarea value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción *"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8, minHeight:80, resize:'vertical' }} />
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input value={form.fecha} onChange={e => set('fecha', e.target.value)} placeholder="Fecha"
                style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
              <input value={form.autor} onChange={e => set('autor', e.target.value)} placeholder="Autor"
                style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setShowAdd(false); setEditId(null) }} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={save} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Guardar</button>
            </div>
          </div>
      }
    </div>
  )
}
