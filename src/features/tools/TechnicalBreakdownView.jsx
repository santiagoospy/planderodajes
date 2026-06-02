import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { storage } from '../../services/storage'
import { Icon } from '../../components/ui/Icon'

const MOMENTO_LABEL = { mañana:'Mañana', tarde:'Tarde', noche:'Noche', 'sin definir':'' }

// Read a dept section preferring the server, falling back to the local
// offline cache so the guión técnico works (and prints) on set without wifi.
const readDept = async (projectId, deptKey, section) => {
  try {
    const fresh = await api.getDeptData(projectId, deptKey, section)
    if (fresh !== null && fresh !== undefined) return fresh
  } catch { /* offline — fall back to cache */ }
  return storage.getDeptData(projectId, deptKey, section)
}

function minToStr(min) {
  if (!min) return null
  return min >= 60 ? `${Math.floor(min/60)}h ${min%60}m` : `${min}m`
}

// ── Print + table styles injected while the view is mounted ──────────
// Clean black-on-white look, ready to print and use on set.
const TBV_CSS = `
.tbv-doc { color:#1a1a1a; }
.tbv-table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:4px; }
.tbv-table th {
  background:#e6e6e6; border:1px solid #888; padding:6px 8px; text-align:left;
  font-size:9px; letter-spacing:0.04em; text-transform:uppercase; color:#222; font-weight:700;
  vertical-align:bottom;
}
.tbv-table td { border:1px solid #b5b5b5; padding:6px 8px; vertical-align:top; line-height:1.4; color:#1a1a1a; }
.tbv-table td.num { text-align:center; font-weight:700; white-space:nowrap; }
.tbv-table td.nowrap { white-space:nowrap; }
.tbv-scene { break-inside: avoid; page-break-inside: avoid; }

@media print {
  .tbv-no-print { display: none !important; }
  .tbv-doc { background:#fff !important; padding:0 !important; }
  .tbv-sheet { max-width:none !important; padding:0 !important; margin:0 !important; }
  body { background:#fff !important; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page { margin: 14mm; }
}
`

export default function TechnicalBreakdownView({ project, projectId, depts, onBack }) {
  const [sceneData, setSceneData] = useState({})   // sceneId → { planos, deptChecklists }
  const [deptData, setDeptData]   = useState({})   // deptKey → { integrantes, elenco, equipos }
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'tbv-print'
    style.textContent = TBV_CSS
    document.head.appendChild(style)
    return () => document.getElementById('tbv-print')?.remove()
  }, [])

  useEffect(() => {
    if (!projectId || !project) return
    loadAll()
  }, [projectId])

  const loadAll = async () => {
    setLoading(true)
    const allScenes = project.days?.flatMap(d => d.scenes) || []

    const sceneResults = await Promise.all(
      allScenes.map(async (scene) => {
        const [planos, deptChecklists] = await Promise.all([
          readDept(projectId, 'scenes', `${scene.id}__planos`).catch(() => []),
          readDept(projectId, 'scenes', `${scene.id}__deptchecklists`).catch(() => ({})),
        ])
        return [scene.id, {
          planos:        Array.isArray(planos) ? planos : [],
          deptChecklists: (deptChecklists && typeof deptChecklists === 'object') ? deptChecklists : {},
        }]
      })
    )

    const deptKeys = Object.keys(depts || {})
    const deptResults = await Promise.all(
      deptKeys.map(async (dk) => {
        const [integrantes, principales, extras, equipos] = await Promise.all([
          readDept(projectId, dk, 'integrantes').catch(() => []),
          dk === 'casting' ? readDept(projectId, dk, 'principales').catch(() => []) : Promise.resolve([]),
          dk === 'casting' ? readDept(projectId, dk, 'extras').catch(() => []) : Promise.resolve([]),
          readDept(projectId, dk, 'checklist_equipo').catch(() => []),
        ])
        return [dk, {
          integrantes: Array.isArray(integrantes) ? integrantes : [],
          elenco:      [...(Array.isArray(principales) ? principales : []), ...(Array.isArray(extras) ? extras : [])],
          equipos:     Array.isArray(equipos) ? equipos : [],
        }]
      })
    )

    setSceneData(Object.fromEntries(sceneResults))
    setDeptData(Object.fromEntries(deptResults))
    setLoading(false)
  }

  // Totals
  const allScenes = project?.days?.flatMap(d => d.scenes) || []
  const totalMin  = allScenes.reduce((a, s) => a + (s.tiempoTotal || 0), 0)
  const crew = Object.entries(depts || {}).filter(([dk]) => (deptData[dk]?.integrantes || []).length > 0)
  const elenco = deptData['casting']?.elenco || []
  const equipoDepts = Object.entries(depts || {}).filter(([dk]) => (deptData[dk]?.equipos || []).length > 0)

  if (loading) {
    return (
      <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ width:40, height:40, border:'3px solid #ddd', borderTopColor:'#555', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <div style={{ fontSize:14, color:'var(--text-secondary)', fontFamily:'inherit' }}>Cargando datos…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  const sceneMeta = (scene, day) => {
    const bits = [day.label]
    if (scene.momento && MOMENTO_LABEL[scene.momento]) bits.push(MOMENTO_LABEL[scene.momento])
    const t = minToStr(scene.tiempoTotal)
    if (t) bits.push(t)
    return bits.filter(Boolean).join(' · ')
  }

  return (
    <div className="tbv-doc" style={{ background:'#fff', minHeight:'100dvh', fontFamily:'inherit' }}>

      {/* ── Toolbar (no print) ───────────────────────────────── */}
      <div className="tbv-no-print" style={{ position:'sticky', top:0, zIndex:20, background:'var(--bg-elevated)', borderBottom:'1px solid var(--border-light)', padding:'calc(env(safe-area-inset-top, 0px) + 12px) 20px 12px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="tap"
          style={{ background:'none', border:'none', fontSize:14, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, padding:'6px 4px' }}>
          <Icon name="ChevronLeft" size={16} color="currentColor"/> Volver
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>Guión técnico</span>
          <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:8 }}>{project?.title}</span>
        </div>
        <button onClick={() => window.print()}
          style={{ fontFamily:'inherit', fontSize:13, fontWeight:700, background:'#1a1a1a', color:'#fff', border:'none', borderRadius:8, padding:'9px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="Printer" size={14} color="#fff"/> Imprimir / PDF
        </button>
      </div>

      {/* ── Document ─────────────────────────────────────────── */}
      <div className="tbv-sheet" style={{ maxWidth:920, margin:'0 auto', padding:'28px 24px 80px' }}>

        {/* Header */}
        <div style={{ borderBottom:'2px solid #1a1a1a', paddingBottom:12, marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'flex-end', gap:14 }}>
            {project?.logo && <img src={project.logo} alt="" style={{ maxHeight:54, maxWidth:120, objectFit:'contain' }}/>}
            <div>
              <div style={{ fontSize:10, letterSpacing:'0.18em', color:'#777', fontWeight:700 }}>GUIÓN TÉCNICO</div>
              <h1 style={{ fontSize:24, fontWeight:800, color:'#111', lineHeight:1.1, margin:'4px 0 0' }}>{project?.title || 'Sin título'}</h1>
              {project?.client && <div style={{ fontSize:13, color:'#555', marginTop:2 }}>{project.client}</div>}
            </div>
          </div>
          <div style={{ textAlign:'right', fontSize:11, color:'#666', lineHeight:1.6 }}>
            {allScenes.length} escena{allScenes.length!==1?'s':''}{totalMin ? ` · ${minToStr(totalMin)}` : ''}<br/>
            {new Date().toLocaleDateString('es-AR')}
          </div>
        </div>

        {/* Shot list per scene */}
        {allScenes.length === 0 && (
          <div style={{ fontSize:13, color:'#999', fontStyle:'italic', textAlign:'center', padding:'40px 0' }}>No hay escenas cargadas.</div>
        )}

        {project?.days?.map(day =>
          day.scenes.map(scene => {
            const planos = sceneData[scene.id]?.planos || []
            return (
              <div key={scene.id} className="tbv-scene" style={{ marginBottom:22 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                  <span style={{ fontSize:13, fontWeight:800, color:'#111' }}>{scene.num}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#111' }}>{scene.title}</span>
                  <span style={{ fontSize:11, color:'#777' }}>{sceneMeta(scene, day)}</span>
                </div>
                {scene.descripcion && <div style={{ fontSize:11, color:'#555', marginBottom:6, lineHeight:1.5 }}>{scene.descripcion}</div>}

                {planos.length === 0 ? (
                  <div style={{ fontSize:11, color:'#999', fontStyle:'italic', padding:'2px 0 6px' }}>Sin tomas cargadas.</div>
                ) : (
                  <table className="tbv-table">
                    <thead>
                      <tr>
                        <th style={{ width:'6%' }}>Plano</th>
                        <th style={{ width:'17%' }}>Tipo de plano</th>
                        <th style={{ width:'11%' }}>Lente</th>
                        <th style={{ width:'10%' }}>Duración</th>
                        <th>Descripción / movimiento</th>
                        <th style={{ width:'22%' }}>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planos.map((p, pi) => (
                        <tr key={p.id}>
                          <td className="num">{p.numero || pi + 1}</td>
                          <td>{p.tipo || '—'}</td>
                          <td className="nowrap">{p.lente || '—'}</td>
                          <td className="nowrap">{p.duracion || '—'}</td>
                          <td>{p.descripcion || '—'}</td>
                          <td>{p.comentario || ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })
        )}

        {/* Crew */}
        {crew.length > 0 && (
          <div className="tbv-scene" style={{ marginTop:28 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#111', borderBottom:'1.5px solid #1a1a1a', paddingBottom:4, marginBottom:8 }}>EQUIPO TÉCNICO</div>
            <table className="tbv-table">
              <thead>
                <tr>
                  <th style={{ width:'28%' }}>Departamento</th>
                  <th style={{ width:'40%' }}>Nombre</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {crew.flatMap(([dk, m]) =>
                  (deptData[dk]?.integrantes || []).map((p, i) => (
                    <tr key={dk + i}>
                      <td>{i === 0 ? m.label : ''}</td>
                      <td>{p.nombre || p.name || '—'}</td>
                      <td>{p.rol || p.role || ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Elenco */}
        {elenco.length > 0 && (
          <div className="tbv-scene" style={{ marginTop:24 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#111', borderBottom:'1.5px solid #1a1a1a', paddingBottom:4, marginBottom:8 }}>ELENCO</div>
            <table className="tbv-table">
              <thead>
                <tr>
                  <th style={{ width:'45%' }}>Actor / actriz</th>
                  <th>Personaje</th>
                </tr>
              </thead>
              <tbody>
                {elenco.map((p, i) => (
                  <tr key={i}>
                    <td>{p.nombre || p.name || '—'}</td>
                    <td>{p.personaje || p.character || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Equipos / rental */}
        {equipoDepts.length > 0 && (
          <div className="tbv-scene" style={{ marginTop:24 }}>
            <div style={{ fontSize:13, fontWeight:800, color:'#111', borderBottom:'1.5px solid #1a1a1a', paddingBottom:4, marginBottom:8 }}>EQUIPOS / RENTAL</div>
            <table className="tbv-table">
              <thead>
                <tr>
                  <th style={{ width:'28%' }}>Departamento</th>
                  <th>Equipo</th>
                </tr>
              </thead>
              <tbody>
                {equipoDepts.flatMap(([dk, m]) =>
                  (deptData[dk]?.equipos || []).map((eq, i) => (
                    <tr key={dk + i}>
                      <td>{i === 0 ? m.label : ''}</td>
                      <td>{eq.text || eq.nombre || eq.item || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  )
}
