import { useState } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'

export default function GastosTabSimple({ color, deptKey, projectId, project }) {
  const { items: expenses, save: setExpenses } = useDeptData(projectId, deptKey, 'gastos', [])
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm] = useState({ desc:'', monto:'', fecha:'', estado:'pendiente' })
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const gs = (n) => `Gs. ${Math.round(n || 0).toLocaleString('es-PY')}`
  const total = expenses.reduce((a, e) => a + (parseFloat(e.monto) || 0), 0)

  const add = () => {
    if (!form.desc || !form.monto) return
    const item = { id: editId || Date.now(), ...form, monto: parseFloat(form.monto) }
    if (editId) setExpenses(expenses.map(e => e.id === editId ? item : e))
    else        setExpenses([...expenses, item])
    setForm({ desc:'', monto:'', fecha:'', estado:'pendiente' })
    setEditId(null); setShowAdd(false)
  }
  const startEdit = (e) => {
    setForm({ desc: e.desc || '', monto: String(e.monto || ''), fecha: e.fecha || '', estado: e.estado || 'pendiente' })
    setEditId(e.id); setShowAdd(true)
  }
  const toggleEstado = (id) => setExpenses(expenses.map(e => e.id === id ? { ...e, estado: e.estado === 'aprobado' ? 'pendiente' : 'aprobado' } : e))
  const del = (id) => setExpenses(expenses.filter(e => e.id !== id))

  const exportarExcel = async () => {
    if (!window.XLSX) {
      await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s) })
    }
    const XL = window.XLSX
    const wb = XL.utils.book_new()
    const deptName = project?.depts?.[deptKey]?.label || deptKey
    const rows = [
      [`GASTOS — ${deptName.toUpperCase()}`, '', '', '', ''],
      [`Proyecto: ${project?.title || ''}  ·  Total: ${gs(total)}`, '', '', '', ''],
      [`Exportado: ${new Date().toLocaleDateString('es-AR')}`, '', '', '', ''],
      ['', '', '', '', ''],
      ['N°', 'DESCRIPCIÓN', 'FECHA', 'MONTO (Gs.)', 'ESTADO'],
      ...expenses.map((e, i) => [i + 1, e.desc || '', e.fecha || '', parseFloat(e.monto) || 0, e.estado === 'aprobado' ? '✓ OK' : 'PENDIENTE']),
      ['', '', '', '', ''],
      ['', '', 'TOTAL', total, ''],
    ]
    const ws = XL.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch:4 }, { wch:38 }, { wch:14 }, { wch:20 }, { wch:12 }]
    ws['!merges'] = [{ s:{r:0,c:0}, e:{r:0,c:4} }, { s:{r:1,c:0}, e:{r:1,c:4} }, { s:{r:2,c:0}, e:{r:2,c:4} }]
    XL.utils.book_append_sheet(wb, ws, 'Gastos')
    XL.writeFile(wb, `Gastos_${deptName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div>
      <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'12px 16px', border:'1px solid var(--border-light)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11, color:'#aaa', fontFamily:'inherit' }}>TOTAL GASTADO</div>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{gs(total)}</div>
      </div>
      <SectionLabel>GASTOS ({expenses.length})</SectionLabel>
      {expenses.map(e => (
        <div key={e.id} style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid var(--border-light)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', fontWeight:700 }}>{e.desc}</div>
              <div style={{ display:'flex', gap:8, marginTop:2, alignItems:'center' }}>
                <span style={{ fontSize:13, fontWeight:700, color, fontFamily:'inherit' }}>{gs(parseFloat(e.monto) || 0)}</span>
                {e.fecha && <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit' }}>{e.fecha}</span>}
              </div>
            </div>
            <div style={{ display:'flex', gap:5, alignItems:'center', flexShrink:0 }}>
              <div onClick={() => toggleEstado(e.id)} style={{ fontSize:10, fontWeight:700, padding:'3px 7px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', background:e.estado === 'aprobado' ? '#e8f8f0' : '#fff8ec', color:e.estado === 'aprobado' ? '#0fa87e' : '#d48c0e', border:`1px solid ${e.estado === 'aprobado' ? '#0fa87e44' : '#d48c0e44'}` }}>{e.estado === 'aprobado' ? '✓' : 'PEND.'}</div>
              <button onClick={() => startEdit(e)} style={{ background:'var(--bg-card-dark-secondary)', border:'none', borderRadius:8, color:'var(--text-tertiary)', fontSize:13, cursor:'pointer', padding:'4px 7px' }}>✎</button>
              <button onClick={() => del(e.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:8, color:'var(--color-primary)', fontSize:13, cursor:'pointer', padding:'4px 7px' }}>✕</button>
            </div>
          </div>
        </div>
      ))}
      {expenses.length === 0 && !showAdd && <div style={{ textAlign:'center', padding:'20px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin gastos cargados todavía</div>}
      {!showAdd
        ? <button onClick={() => { setEditId(null); setForm({ desc:'', monto:'', fecha:'', estado:'pendiente' }); setShowAdd(true) }} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:8 }}>+ Agregar gasto</button>
        : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginTop:8 }}>
            <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.06em', marginBottom:10, fontFamily:'inherit' }}>{editId ? '✎ EDITAR' : 'NUEVO GASTO'}</div>
            <input value={form.desc} onChange={e => setF('desc', e.target.value)} placeholder="Descripción *"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'#aaa', fontFamily:'inherit', marginBottom:4 }}>MONTO (Gs.) *</div>
                <input value={form.monto} onChange={e => setF('monto', e.target.value)} placeholder="0" type="number"
                  style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'#aaa', fontFamily:'inherit', marginBottom:4 }}>FECHA</div>
                <input value={form.fecha} onChange={e => setF('fecha', e.target.value)} placeholder="Fecha"
                  style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setShowAdd(false); setEditId(null) }} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={add} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>{editId ? 'Guardar cambios' : 'Agregar'}</button>
            </div>
          </div>
      }
      {expenses.length > 0 && (
        <button onClick={exportarExcel} style={{ width:'100%', fontFamily:'inherit', fontSize:12, fontWeight:700, color:'#217346', background:'#e8f5ee', border:'1px solid #21734633', borderRadius:14, padding:'13px', cursor:'pointer', marginTop:10, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          <Icon name="FileSpreadsheet" size={16} color="#217346" /> Exportar a Excel (.xlsx)
        </button>
      )}
    </div>
  )
}
