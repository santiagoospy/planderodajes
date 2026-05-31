import { useState, useEffect } from 'react'
import { db } from '../../../services/db'
import { Icon } from '../../../components/ui/Icon'

export default function CrewTotalTab({ color, projectId, project }) {
  const [allCrew, setAllCrew] = useState([])
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    if (!project) return
    const deptKeys = Object.keys(project.depts)
    Promise.all(
      deptKeys.map(dk =>
        db.getDeptData(projectId, dk, 'integrantes').then(d =>
          (d||[]).map(p => ({ ...p, deptKey:dk, deptLabel:project.depts[dk]?.label||dk, deptColor:project.depts[dk]?.color||'#888', deptIcon:project.depts[dk]?.icon||'Clapperboard' }))
        ).catch(() => [])
      )
    ).then(results => { setAllCrew(results.flat()); setLoaded(true) })
  }, [projectId, project])

  const exportarExcel = async () => {
    if (!window.XLSX) {
      await new Promise((res,rej) => { const s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload=res; s.onerror=rej; document.head.appendChild(s) })
    }
    const XL = window.XLSX
    const wb = XL.utils.book_new()
    const rows = [
      [`CREW COMPLETO — ${project?.title||''}`, '', '', '', ''],
      [`Exportado: ${new Date().toLocaleDateString('es-AR')} · ${allCrew.length} integrantes`, '', '', '', ''],
      ['', '', '', '', ''],
      ['N°', 'NOMBRE Y APELLIDO', 'ROL / CARGO', 'N° CÉDULA', 'DEPARTAMENTO'],
      ...allCrew.map((p,i) => [i+1, p.nombre||'', p.rol||'', p.cedula||'', p.deptLabel||'']),
    ]
    const ws = XL.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{wch:4},{wch:30},{wch:25},{wch:16},{wch:20}]
    ws['!merges'] = [{s:{r:0,c:0},e:{r:0,c:4}},{s:{r:1,c:0},e:{r:1,c:4}}]
    XL.utils.book_append_sheet(wb, ws, 'Crew Total')
    XL.writeFile(wb, `Crew_${(project?.title||'').replace(/\s+/g,'_')}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const byDept = {}
  allCrew.forEach(p => { (byDept[p.deptKey]=byDept[p.deptKey]||[]).push(p) })

  return (
    <div>
      <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'12px 16px', border:'1px solid var(--border-light)', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:11, color:'#aaa', fontFamily:'inherit' }}>CREW TOTAL DEL PROYECTO</div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{allCrew.length} personas</div>
        </div>
        <button onClick={exportarExcel} disabled={!loaded||allCrew.length===0} style={{ fontFamily:'inherit', fontSize:12, fontWeight:700, color:'#217346', background:'#e8f5ee', border:'1px solid #21734633', borderRadius:12, padding:'10px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="FileSpreadsheet" size={15} color="#217346" /> Exportar Excel
        </button>
      </div>
      {!loaded && <div style={{ textAlign:'center', padding:'32px', color:'#ccc', fontFamily:'inherit' }}>Cargando crew...</div>}
      {loaded && Object.entries(byDept).map(([dk, personas]) => {
        const dm = project?.depts?.[dk]
        if (!dm) return null
        return (
          <div key={dk} style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 0' }}>
              <Icon name={dm.icon||'Clapperboard'} size={16} color={dm.color} />
              <span style={{ fontSize:11, fontWeight:700, color:dm.color, letterSpacing:'0.08em', fontFamily:'inherit' }}>{dm.label.toUpperCase()}</span>
              <span style={{ fontSize:10, color:'#ccc', fontFamily:'inherit' }}>— {personas.length}</span>
            </div>
            {personas.map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:12, background:'var(--bg-secondary)', borderRadius:12, padding:'10px 14px', marginBottom:6, border:`1px solid ${dm.color}20` }}>
                <div style={{ width:32, height:32, borderRadius:8, background:dm.color+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon name="User" size={14} color="rgba(255,255,255,0.9)" />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{p.nombre}</div>
                  <div style={{ display:'flex', gap:8, marginTop:2 }}>
                    {p.rol    && <span style={{ fontSize:11, color:dm.color, fontFamily:'inherit' }}>{p.rol}</span>}
                    {p.cedula && <span style={{ fontSize:11, color:'#aaa', fontFamily:'inherit' }}>CI: {p.cedula}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      })}
      {loaded && allCrew.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px 20px', color:'#ccc', fontFamily:'inherit' }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}><Icon name="Users" size={36} color="var(--text-tertiary)" /></div>
          <div>Ningún departamento cargó integrantes todavía.</div>
        </div>
      )}
    </div>
  )
}
