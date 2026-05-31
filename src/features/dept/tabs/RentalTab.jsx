import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'

export default function RentalTab({ color, projectId }) {
  const { items, save: setItems } = useDeptData(projectId, 'produccion', 'rental', [])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm] = useState({ desc:'', proveedor:'', fechaDesde:'', fechaHasta:'', monto:'', estado:'pendiente', notas:'' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = () => {
    if (!form.desc.trim()) return
    const item = { id: editId || Date.now(), ...form, monto: form.monto ? parseFloat(form.monto) : null }
    if (editId) setItems(items.map(i => i.id === editId ? item : i))
    else        setItems([...items, item])
    setForm({ desc:'', proveedor:'', fechaDesde:'', fechaHasta:'', monto:'', estado:'pendiente', notas:'' })
    setEditId(null); setShowAdd(false)
  }
  const startEdit = (i) => {
    setForm({ desc:i.desc||'', proveedor:i.proveedor||'', fechaDesde:i.fechaDesde||'', fechaHasta:i.fechaHasta||'', monto:i.monto!=null?String(i.monto):'', estado:i.estado||'pendiente', notas:i.notas||'' })
    setEditId(i.id); setShowAdd(true)
  }
  const toggleEstado = (id) => setItems(items.map(i => i.id === id ? { ...i, estado: i.estado==='confirmado'?'pendiente':i.estado==='pendiente'?'devuelto':'confirmado' } : i))
  const del = (id) => setItems(items.filter(i => i.id !== id))

  const gs = (n) => `Gs. ${Math.round(n || 0).toLocaleString('es-PY')}`
  const total = items.reduce((a, i) => a + (parseFloat(i.monto) || 0), 0)
  const estadoColor = (e) => e==='confirmado'?'#0fa87e':e==='devuelto'?'#888':'#d48c0e'
  const estadoBg    = (e) => e==='confirmado'?'#e8f8f0':e==='devuelto'?'#f0ede8':'#fff8ec'
  const estadoLabel = (e) => e==='confirmado'?'✓ CONFIRMADO':e==='devuelto'?'↩ DEVUELTO':'⌛ PENDIENTE'

  return (
    <div>
      <SectionLabel>EQUIPOS RENTADOS ({items.length})</SectionLabel>
      {items.length > 0 && (
        <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'12px 14px', border:'1px solid var(--border-light)', marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:11, color:'#aaa', fontFamily:'inherit' }}>TOTAL ESTIMADO</div>
          <div style={{ fontSize:18, fontWeight:700, color, fontFamily:'inherit' }}>{gs(total)}</div>
        </div>
      )}
      {items.map(i => (
        <div key={i.id} style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border-light)' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Icon name="Package" size={18} color="rgba(255,255,255,0.9)" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{i.desc}</div>
              {i.proveedor && <div style={{ fontSize:11, color:'var(--text-tertiary)', fontFamily:'inherit', marginTop:2 }}>{i.proveedor}</div>}
              {(i.fechaDesde || i.fechaHasta) && <div style={{ fontSize:11, color:'#aaa', fontFamily:'inherit', marginTop:2 }}>{i.fechaDesde||'—'} → {i.fechaHasta||'—'}</div>}
              {i.notas && <div style={{ fontSize:11, color:'#aaa', fontFamily:'inherit', fontStyle:'italic', marginTop:3 }}>{i.notas}</div>}
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                <button onClick={() => toggleEstado(i.id)} style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:10, border:'none', cursor:'pointer', color:estadoColor(i.estado), background:estadoBg(i.estado), fontFamily:'inherit' }}>
                  {estadoLabel(i.estado)}
                </button>
                {i.monto != null && <span style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{gs(i.monto)}</span>}
              </div>
            </div>
            <button onClick={() => startEdit(i)} style={{ background:'var(--bg-card-dark-secondary)', border:'none', borderRadius:8, color:'var(--text-tertiary)', fontSize:12, cursor:'pointer', padding:'4px 7px' }}>✎</button>
            <button onClick={() => del(i.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:8, color:'var(--color-primary)', fontSize:12, cursor:'pointer', padding:'4px 7px' }}>✕</button>
          </div>
        </div>
      ))}
      {items.length === 0 && !showAdd && <div style={{ textAlign:'center', padding:'28px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin equipos rentados todavía</div>}
      {!showAdd
        ? <button onClick={() => { setEditId(null); setForm({ desc:'', proveedor:'', fechaDesde:'', fechaHasta:'', monto:'', estado:'pendiente', notas:'' }); setShowAdd(true) }} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:4 }}>+ Agregar equipo rentado</button>
        : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginTop:4 }}>
            <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.06em', marginBottom:10, fontFamily:'inherit' }}>{editId ? '✎ EDITAR' : 'NUEVO ÍTEM DE RENTAL'}</div>
            <input value={form.desc} onChange={e => set('desc', e.target.value)} placeholder="Descripción *"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <input value={form.proveedor} onChange={e => set('proveedor', e.target.value)} placeholder="Proveedor (empresa)"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input value={form.fechaDesde} onChange={e => set('fechaDesde', e.target.value)} placeholder="Desde"
                style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
              <input value={form.fechaHasta} onChange={e => set('fechaHasta', e.target.value)} placeholder="Hasta"
                style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
            </div>
            <input value={form.monto} onChange={e => set('monto', e.target.value)} placeholder="Monto (Gs.)" type="number"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)} placeholder="Notas (opcional)" rows={2}
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', resize:'none', marginBottom:10 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setShowAdd(false); setEditId(null) }} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={save} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>{editId ? 'Guardar cambios' : 'Agregar'}</button>
            </div>
          </div>
      }
    </div>
  )
}
