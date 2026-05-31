import { useState, useEffect } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { db } from '../../../services/db'
import { Icon } from '../../../components/ui/Icon'
import { SectionLabel } from '../../../components/ui/SectionLabel'
import { PinModal } from '../../../components/ui/PinModal'

export default function GastosTab({ color, deptKey, projectId, project, isAdmin }) {
  const { items: expenses, save: setExpenses } = useDeptData(projectId, deptKey, 'gastos', [])
  const [presupGeneral, setPresupGeneralRaw] = useState(null)
  const [showAdd, setShowAdd]   = useState(false)
  const [editId, setEditId]     = useState(null)
  const [pinUnlocked, setPinUnlocked]   = useState(!!isAdmin)
  const [showPinModal, setShowPinModal] = useState(false)
  const [form, setForm] = useState({ desc:'', presupuestado:'', cerrado:'', pagado:'', fecha:'', estado:'pendiente' })
  const [gastosDepts, setGastosDepts] = useState({})
  const [dineroEntregado, setDineroEntregadoRaw] = useState(null)
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (deptKey !== 'produccion') return
    const DEPTS = ['direccion','fotografia','sonido','arte','locaciones','casting','catering']
    Promise.all(DEPTS.map(d =>
      db.getDeptData(projectId, d, 'gastos')
        .then(data => ({ dept: d, gastos: (data || []).map(g => ({ ...g, presupuestado: parseFloat(g.presupuestado) || 0 })) }))
        .catch(() => ({ dept: d, gastos: [] }))
    )).then(results => {
      const out = {}
      results.forEach(r => { out[r.dept] = r.gastos })
      setGastosDepts(out)
    })
  }, [projectId, deptKey])

  useEffect(() => {
    db.getDeptData(projectId, deptKey, 'presup_general')
      .then(d => setPresupGeneralRaw(d && d[0] ? d[0].valor : null))
      .catch(() => {})
  }, [projectId, deptKey])

  useEffect(() => {
    if (deptKey !== 'produccion') return
    db.getDeptData(projectId, deptKey, 'dinero_entregado')
      .then(d => setDineroEntregadoRaw(d && d[0] ? d[0].valor : null))
      .catch(() => {})
  }, [projectId, deptKey])

  const saveDineroEntregado = (val) => {
    setDineroEntregadoRaw(val)
    db.saveDeptData(projectId, deptKey, 'dinero_entregado', [{ valor: val }])
  }
  const savePresupGeneral = (val) => {
    setPresupGeneralRaw(val)
    db.saveDeptData(projectId, deptKey, 'presup_general', [{ valor: val }])
  }

  const totalPresup  = expenses.reduce((a, e) => a + (parseFloat(e.presupuestado) || 0), 0)
  const totalCerrado = expenses.reduce((a, e) => a + (parseFloat(e.cerrado) || 0), 0)
  const diferencia   = totalPresup - totalCerrado
  const gs = (n) => 'Gs. ' + Math.round(n || 0).toLocaleString('es-PY')

  const add = () => {
    if (!form.desc || !form.presupuestado) return
    const item = { id: editId || Date.now(), ...form, presupuestado: parseFloat(form.presupuestado), cerrado: form.cerrado ? parseFloat(form.cerrado) : null, pagado: form.pagado ? parseFloat(form.pagado) : null }
    if (editId) setExpenses(expenses.map(e => e.id === editId ? item : e))
    else        setExpenses([...expenses, item])
    setForm({ desc:'', presupuestado:'', cerrado:'', pagado:'', fecha:'', estado:'pendiente' })
    setEditId(null); setShowAdd(false)
  }
  const startEdit = (e) => {
    setForm({ desc: e.desc, presupuestado: String(e.presupuestado || ''), cerrado: e.cerrado != null ? String(e.cerrado) : '', pagado: e.pagado != null ? String(e.pagado) : '', fecha: e.fecha || '', estado: e.estado || 'pendiente' })
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
    const deptName = project && project.depts && project.depts[deptKey] ? project.depts[deptKey].label : deptKey
    const rows = [
      ['GASTOS — ' + deptName.toUpperCase(), '', '', '', '', '', ''],
      ['Proyecto: ' + (project ? project.title || '' : ''), '', '', '', '', '', ''],
      ['Fecha: ' + new Date().toLocaleDateString('es-AR'), '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['RESUMEN', '', '', '', '', '', ''],
      ['Presupuesto General', gs(presupGeneral || 0), '', '', '', '', ''],
      ['Total Presupuestado', gs(totalPresup), '', '', '', '', ''],
      ['Total Cerrado', gs(totalCerrado), '', '', '', '', ''],
      ['Saldo Final', gs(diferencia), '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['N', 'DESCRIPCION', 'FECHA', 'PRESUPUESTADO (Gs.)', 'CERRADO (Gs.)', 'DIFERENCIA (Gs.)', 'ESTADO'],
    ]
    expenses.forEach(function(e, i) {
      var pres = parseFloat(e.presupuestado) || 0
      var cerr = e.cerrado != null ? parseFloat(e.cerrado) : null
      var diff = cerr != null ? pres - cerr : ''
      rows.push([i + 1, e.desc || '', e.fecha || '', pres, cerr != null ? cerr : '', diff, e.estado === 'aprobado' ? 'OK' : 'PENDIENTE'])
    })
    const ws = XL.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 4 }, { wch: 38 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 12 }]
    XL.utils.book_append_sheet(wb, ws, 'Gastos')
    XL.writeFile(wb, 'Gastos_' + deptName.replace(/\s+/g,'_') + '_' + new Date().toISOString().slice(0,10) + '.xlsx')
  }

  if (!isAdmin && !pinUnlocked) {
    return (
      <div style={{ textAlign:'center', padding:'40px 20px' }}>
        <Icon name="Lock" size={36} color="var(--text-primary)" />
        <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit', marginBottom:8, marginTop:8 }}>Gastos protegidos</div>
        <div style={{ fontSize:12, color:'#aaa', fontFamily:'inherit', marginBottom:20 }}>Ingresa el PIN del proyecto para ver los gastos</div>
        <button onClick={() => setShowPinModal(true)} style={{ fontFamily:'inherit', fontSize:14, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:14, padding:'12px 28px', cursor:'pointer' }}>
          Ingresar PIN
        </button>
        {showPinModal && <PinModal title="Gastos" subtitle="PIN del proyecto" correctPin={project && project.pin} onSuccess={() => { setPinUnlocked(true); setShowPinModal(false) }} onCancel={() => setShowPinModal(false)} />}
      </div>
    )
  }

  return (
    <div>
      <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'14px 16px', border:'1px solid var(--border-light)', marginBottom:12 }}>
        <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit' }}>PRESUPUESTO GENERAL DEL PROYECTO</div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:12, color:'var(--text-tertiary)', fontFamily:'inherit' }}>Gs.</span>
          <input type="number" value={presupGeneral != null ? presupGeneral : ''} onChange={e => savePresupGeneral(e.target.value ? parseFloat(e.target.value) : null)} placeholder="0"
            style={{ flex:1, fontFamily:'inherit', fontSize:20, fontWeight:700, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'12px 14px', color:'var(--text-primary)', outline:'none' }} />
        </div>
      </div>

      {deptKey === 'produccion' && (
        <div style={{ background:'#e8f8f0', borderRadius:14, padding:'14px 16px', border:'1px solid #0fa87e33', marginBottom:12 }}>
          <div style={{ fontSize:11, color:'#0fa87e', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit', fontWeight:700 }}>DINERO ENTREGADO</div>
          <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:11, color:'#0fa87e', fontFamily:'inherit' }}>Gs.</span>
            <input type="number" value={dineroEntregado != null ? dineroEntregado : ''} onChange={e => saveDineroEntregado(e.target.value ? parseFloat(e.target.value) : null)} placeholder="0"
              style={{ flex:1, fontFamily:'inherit', fontSize:16, fontWeight:700, background:'#ffffff', border:'1px solid #0fa87e44', borderRadius:10, padding:'10px 12px', color:'#0fa87e', outline:'none' }} />
          </div>
          {presupGeneral != null && dineroEntregado != null && (function() {
            var faltaPorCobrar = Math.max(0, presupGeneral - dineroEntregado)
            var montoEnCaja = faltaPorCobrar - totalPresup
            var montoNeto = presupGeneral - totalPresup
            return (
              <div>
                <div style={{ background:'var(--bg-primary)', borderRadius:10, padding:'12px 14px', marginBottom:8, border:'1px solid #0fa87e22' }}>
                  <div style={{ fontSize:10, color:'#0fa87e', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>FALTA POR COBRAR</div>
                  <div style={{ fontSize:16, fontWeight:700, color:'#0fa87e', fontFamily:'inherit' }}>{gs(faltaPorCobrar)}</div>
                </div>
                <div style={{ background:montoEnCaja >= 0 ? '#e8f8f0' : '#fff0f0', borderRadius:10, padding:'12px 14px', marginBottom:8, border:'1px solid ' + (montoEnCaja >= 0 ? '#0fa87e33' : '#d94f2b33') }}>
                  <div style={{ fontSize:10, color:montoEnCaja >= 0 ? '#0fa87e' : '#d94f2b', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>{montoEnCaja >= 0 ? 'MONTO EN CAJA' : 'DEFICIT EN CAJA'}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:montoEnCaja >= 0 ? '#0fa87e' : '#d94f2b', fontFamily:'inherit' }}>{montoEnCaja >= 0 ? '+' : ''}{gs(montoEnCaja)}</div>
                </div>
                <div style={{ background:montoNeto >= 0 ? '#e8f8f0' : '#fff0f0', borderRadius:10, padding:'12px 14px', border:'1px solid ' + (montoNeto >= 0 ? '#0fa87e33' : '#d94f2b33') }}>
                  <div style={{ fontSize:10, color:montoNeto >= 0 ? '#0fa87e' : '#d94f2b', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>{montoNeto >= 0 ? 'MONTO NETO' : 'PERDIDA PROYECTADA'}</div>
                  <div style={{ fontSize:16, fontWeight:700, color:montoNeto >= 0 ? '#0fa87e' : '#d94f2b', fontFamily:'inherit' }}>{montoNeto >= 0 ? '+' : ''}{gs(montoNeto)}</div>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      <SectionLabel>GASTOS DE PRODUCCION ({expenses.length})</SectionLabel>
      {expenses.map(e => {
        var pres = parseFloat(e.presupuestado) || 0
        var cerr = e.cerrado != null ? parseFloat(e.cerrado) : null
        var diff = cerr != null ? pres - cerr : null
        var enRojo  = diff != null && diff < 0
        var enVerde = diff != null && diff > 0
        return (
          <div key={e.id} style={{ background:'var(--bg-secondary)', borderRadius:12, padding:'12px 14px', marginBottom:8, border:'1px solid ' + (enRojo ? '#d94f2b33' : enVerde ? '#0fa87e33' : '#ede9e3') }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', fontWeight:700 }}>{e.desc}</div>
                {e.fecha && <div style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit', marginTop:2 }}>{e.fecha}</div>}
              </div>
              <div style={{ display:'flex', gap:5, alignItems:'center', flexShrink:0 }}>
                <div onClick={() => toggleEstado(e.id)} style={{ fontSize:10, fontWeight:700, padding:'3px 7px', borderRadius:10, cursor:'pointer', fontFamily:'inherit', background:e.estado === 'aprobado' ? '#e8f8f0' : '#fff8ec', color:e.estado === 'aprobado' ? '#0fa87e' : '#d48c0e', border:'1px solid ' + (e.estado === 'aprobado' ? '#0fa87e44' : '#d48c0e44') }}>{e.estado === 'aprobado' ? 'OK' : 'PEND.'}</div>
                <button onClick={() => startEdit(e)} style={{ background:'var(--bg-card-dark-secondary)', border:'none', borderRadius:8, color:'var(--text-tertiary)', fontSize:13, cursor:'pointer', padding:'4px 7px' }}>E</button>
                <button onClick={() => del(e.id)} style={{ background:'var(--bg-error)', border:'none', borderRadius:8, color:'var(--color-primary)', fontSize:13, cursor:'pointer', padding:'4px 7px' }}>X</button>
              </div>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <div style={{ flex:1, background:'var(--bg-card-dark)', borderRadius:8, padding:'6px 10px' }}>
                <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'inherit' }}>PRESUP.</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', fontFamily:'inherit' }}>{gs(pres)}</div>
              </div>
              {cerr != null && <div style={{ flex:1, background:enRojo ? '#fff0f0' : enVerde ? '#e8f8f0' : '#faf8f5', borderRadius:8, padding:'6px 10px' }}>
                <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'inherit' }}>CERRADO</div>
                <div style={{ fontSize:12, fontWeight:700, color:enRojo ? '#d94f2b' : enVerde ? '#0fa87e' : '#555', fontFamily:'inherit' }}>{gs(cerr)}</div>
              </div>}
              {e.pagado != null && <div style={{ flex:1, background:'#e8f8f0', borderRadius:8, padding:'6px 10px', border:'1px solid #0fa87e22' }}>
                <div style={{ fontSize:9, color:'var(--color-success)', fontFamily:'inherit' }}>PAGADO</div>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--color-success)', fontFamily:'inherit' }}>{gs(parseFloat(e.pagado))}</div>
              </div>}
              {diff != null && <div style={{ flex:1, background:enRojo ? '#fff0f0' : '#e8f8f0', borderRadius:8, padding:'6px 10px' }}>
                <div style={{ fontSize:9, color:'var(--text-muted)', fontFamily:'inherit' }}>DIF.</div>
                <div style={{ fontSize:12, fontWeight:700, color:enRojo ? '#d94f2b' : '#0fa87e', fontFamily:'inherit' }}>{diff >= 0 ? '+' : ''}{gs(diff)}</div>
              </div>}
            </div>
          </div>
        )
      })}
      {expenses.length === 0 && !showAdd && <div style={{ textAlign:'center', padding:'20px', color:'#ccc', fontFamily:'inherit', fontSize:13 }}>Sin gastos todavia</div>}

      {!showAdd
        ? <button onClick={() => { setEditId(null); setForm({ desc:'', presupuestado:'', cerrado:'', pagado:'', fecha:'', estado:'pendiente' }); setShowAdd(true) }} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color:'#fff', background:color, border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:8 }}>+ Agregar gasto</button>
        : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:'1px solid ' + color + '30', marginTop:8 }}>
            <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.06em', marginBottom:10, fontFamily:'inherit' }}>{editId ? 'EDITAR GASTO' : 'NUEVO GASTO'}</div>
            <input value={form.desc} onChange={e => setF('desc', e.target.value)} placeholder="Descripcion *"
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }} />
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'#aaa', fontFamily:'inherit', marginBottom:4 }}>PRESUPUESTADO *</div>
                <input value={form.presupuestado} onChange={e => setF('presupuestado', e.target.value)} placeholder="0" type="number"
                  style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'#aaa', fontFamily:'inherit', marginBottom:4 }}>CERRADO</div>
                <input value={form.cerrado} onChange={e => setF('cerrado', e.target.value)} placeholder="0" type="number"
                  style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'var(--color-success)', fontFamily:'inherit', marginBottom:4, fontWeight:700 }}>PAGADO (adelanto)</div>
                <input value={form.pagado} onChange={e => setF('pagado', e.target.value)} placeholder="0" type="number"
                  style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'#e8f8f0', border:'1px solid #0fa87e33', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
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
          Exportar a Excel (.xlsx)
        </button>
      )}

      {deptKey === 'produccion' && Object.keys(gastosDepts).length > 0 && (function() {
        var gastosAllDepts = Object.values(gastosDepts).reduce(function(acc, g) { return acc + g.reduce(function(a, x) { return a + (x.presupuestado || 0) }, 0) }, 0)
        var depsConGastos = Object.entries(gastosDepts).filter(function(entry) { return entry[1].reduce(function(a, x) { return a + (x.presupuestado || 0) }, 0) > 0 })
        if (!depsConGastos.length) return null
        var gastosTotal = totalPresup + gastosAllDepts
        var ganancia = (dineroEntregado || 0) - gastosTotal
        var gananciaPct = presupGeneral > 0 ? ((ganancia / presupGeneral) * 100).toFixed(1) : 0
        return (
          <div style={{ marginTop:24 }}>
            <SectionLabel>GASTOS DE OTROS DEPARTAMENTOS</SectionLabel>
            <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:'1px solid var(--border-light)', marginBottom:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                {depsConGastos.map(function(entry) {
                  var dept = entry[0]; var gastos = entry[1]
                  var total = gastos.reduce(function(a, g) { return a + (g.presupuestado || 0) }, 0)
                  return (
                    <div key={dept} style={{ background:'var(--bg-primary)', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
                      <div style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'inherit', marginBottom:4, textTransform:'capitalize', fontWeight:600 }}>{dept}</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{gs(total)}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ background:'#fff8ec', borderRadius:10, padding:'12px 14px', border:'1px solid #d48c0e22', textAlign:'center' }}>
                <div style={{ fontSize:10, color:'#d48c0e', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>TOTAL OTROS DEPARTAMENTOS</div>
                <div style={{ fontSize:16, fontWeight:700, color:'#d48c0e', fontFamily:'inherit' }}>{gs(gastosAllDepts)}</div>
              </div>
            </div>
            {presupGeneral != null && (
              <div>
                <SectionLabel>RESUMEN FINANCIERO TOTAL</SectionLabel>
                <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:'1px solid var(--border-light)' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                    <div style={{ background:'var(--bg-primary)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>PRESUPUESTO</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{gs(presupGeneral)}</div>
                    </div>
                    <div style={{ background:'#e8f8f0', borderRadius:10, padding:'12px 14px', border:'1px solid #0fa87e22' }}>
                      <div style={{ fontSize:10, color:'#0fa87e', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>ENTREGADO</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#0fa87e', fontFamily:'inherit' }}>{gs(dineroEntregado || 0)}</div>
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                    <div style={{ background:'var(--bg-primary)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>GASTOS PRODUCCION</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{gs(totalPresup)}</div>
                    </div>
                    <div style={{ background:'var(--bg-primary)', borderRadius:10, padding:'12px 14px' }}>
                      <div style={{ fontSize:10, color:'var(--text-tertiary)', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>OTROS DEPTS</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{gs(gastosAllDepts)}</div>
                    </div>
                  </div>
                  {dineroEntregado != null && (
                    <div style={{ background:'#fff8ec', borderRadius:10, padding:'12px 14px', border:'1px solid #d48c0e22', marginBottom:12 }}>
                      <div style={{ fontSize:10, color:'#d48c0e', fontFamily:'inherit', marginBottom:4, fontWeight:600 }}>FALTA POR COBRAR</div>
                      <div style={{ fontSize:15, fontWeight:700, color:'#d48c0e', fontFamily:'inherit' }}>{gs(Math.max(0, presupGeneral - dineroEntregado))}</div>
                    </div>
                  )}
                  <div style={{ background:ganancia >= 0 ? '#e8f8f0' : '#fff0f0', borderRadius:10, padding:'14px 16px', border:'1px solid ' + (ganancia >= 0 ? '#0fa87e33' : '#d94f2b33'), textAlign:'center' }}>
                    <div style={{ fontSize:10, color:ganancia >= 0 ? '#0fa87e' : '#d94f2b', fontFamily:'inherit', marginBottom:6, fontWeight:700, textTransform:'uppercase' }}>{ganancia >= 0 ? 'GANANCIA TOTAL' : 'PERDIDA TOTAL'}</div>
                    <div style={{ fontSize:20, fontWeight:700, color:ganancia >= 0 ? '#0fa87e' : '#d94f2b', fontFamily:'inherit', marginBottom:4 }}>{ganancia >= 0 ? '+' : ''}{gs(ganancia)}</div>
                    <div style={{ fontSize:12, color:ganancia >= 0 ? '#0fa87e' : '#d94f2b', fontFamily:'inherit', fontWeight:600 }}>{gananciaPct}% del presupuesto</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
