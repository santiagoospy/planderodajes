import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { Icon } from '../../components/ui/Icon'

const MOMENTO_LABEL = { mañana:'Mañana', tarde:'Tarde', noche:'Noche', 'sin definir':'Sin definir' }
const MOMENTO_ICON  = { mañana:'Sunrise', tarde:'Cloud', noche:'Moon', 'sin definir':'Clapperboard' }

function minToStr(min) {
  if (!min) return null
  return min >= 60 ? `${Math.floor(min/60)}h ${min%60}m` : `${min}m`
}

// ── Print styles injected while the view is mounted ──────────
const PRINT_CSS = `
@media print {
  .tbv-no-print { display: none !important; }
  .tbv-doc { background: white !important; color: #111 !important; padding: 0 !important; }
  .tbv-page { page-break-after: always; padding: 20mm 18mm; }
  .tbv-scene { page-break-inside: avoid; }
  body { background: white !important; }
}
@media screen {
  .tbv-page { padding: 0; }
}
`

export default function TechnicalBreakdownView({ project, projectId, depts, onBack, accentColor }) {
  const [sceneData, setSceneData] = useState({})   // sceneId → { planos, deptChecklists }
  const [deptData, setDeptData]   = useState({})   // deptKey → { integrantes, elenco, equipos }
  const [loading, setLoading]     = useState(true)
  const accent = accentColor || '#0B7285'

  useEffect(() => {
    // Inject print styles
    const style = document.createElement('style')
    style.id = 'tbv-print'
    style.textContent = PRINT_CSS
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

    // Load scene-level data: planos + deptchecklists per scene
    const sceneResults = await Promise.all(
      allScenes.map(async (scene) => {
        const [planos, deptChecklists] = await Promise.all([
          api.getDeptData(projectId, 'scenes', `${scene.id}__planos`).catch(() => []),
          api.getDeptData(projectId, 'scenes', `${scene.id}__deptchecklists`).catch(() => ({})),
        ])
        return [scene.id, {
          planos:        Array.isArray(planos) ? planos : [],
          deptChecklists: (deptChecklists && typeof deptChecklists === 'object') ? deptChecklists : {},
        }]
      })
    )

    // Load dept-level data
    const deptKeys = Object.keys(depts || {})
    const deptResults = await Promise.all(
      deptKeys.map(async (dk) => {
        const [integrantes, elenco, equipos, citaciones] = await Promise.all([
          api.getDeptData(projectId, dk, 'integrantes').catch(() => []),
          dk === 'casting' ? api.getDeptData(projectId, dk, 'elenco').catch(() => []) : Promise.resolve([]),
          api.getDeptData(projectId, dk, 'checklist_equipo').catch(() => []),
          api.getDeptData(projectId, dk, 'citaciones').catch(() => []),
        ])
        return [dk, {
          integrantes: Array.isArray(integrantes) ? integrantes : [],
          elenco:      Array.isArray(elenco)      ? elenco      : [],
          equipos:     Array.isArray(equipos)      ? equipos     : [],
          citaciones:  Array.isArray(citaciones)   ? citaciones  : [],
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
  const totalDepts = Object.keys(depts || {}).length
  const crew = Object.entries(depts || {}).flatMap(([dk]) =>
    (deptData[dk]?.integrantes || []).map(p => ({ ...p, deptKey: dk }))
  )

  if (loading) {
    return (
      <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
        <div style={{ width:40, height:40, border:`3px solid ${accent}33`, borderTopColor:accent, borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <div style={{ fontSize:14, color:'var(--text-secondary)', fontFamily:'inherit' }}>Cargando datos de escenas y departamentos…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div className="tbv-doc" style={{ background:'#f5f4f2', minHeight:'100dvh', fontFamily:'inherit' }}>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="tbv-no-print" style={{ position:'sticky', top:0, zIndex:20, background:'var(--bg-elevated)', borderBottom:'1px solid var(--border-light)', padding:'12px 20px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={onBack} className="tap"
          style={{ background:'none', border:'none', fontSize:14, color:'var(--text-secondary)', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4, padding:0 }}>
          <Icon name="ChevronLeft" size={16} color="currentColor"/> Volver
        </button>
        <div style={{ flex:1 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>Desglose Técnico</span>
          <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:8 }}>{project?.title}</span>
        </div>
        <button onClick={() => window.print()}
          style={{ fontFamily:'inherit', fontSize:13, fontWeight:700, background:accent, color:'#fff', border:'none', borderRadius:12, padding:'10px 20px', cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Icon name="Printer" size={14} color="#fff"/> Imprimir / PDF
        </button>
      </div>

      {/* ── Document ──────────────────────────────────────────── */}
      <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 16px 80px' }}>

        {/* PORTADA ─────────────────────────────────────────── */}
        <div className="tbv-page" style={{ background:'#fff', borderRadius:16, padding:'32px 36px', marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.07)', pageBreakAfter:'always' }}>
          <div style={{ borderBottom:`4px solid ${accent}`, paddingBottom:20, marginBottom:24, display:'flex', alignItems:'flex-start', gap:20 }}>
            {project?.logo
              ? <img src={project.logo} alt="Logo" style={{ maxHeight:80, maxWidth:140, objectFit:'contain' }}/>
              : <div style={{ width:64, height:64, borderRadius:14, background:accent+'22', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="Film" size={32} color={accent}/>
                </div>
            }
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, letterSpacing:'0.14em', color:'#999', marginBottom:6, fontWeight:700 }}>DESGLOSE TÉCNICO POR ESCENA</div>
              <h1 style={{ fontSize:28, fontWeight:800, color:'#111', lineHeight:1.1, marginBottom:6 }}>{project?.title || 'Sin título'}</h1>
              {project?.client && <div style={{ fontSize:14, color:'#555' }}>{project.client}</div>}
              <div style={{ fontSize:11, color:'#aaa', marginTop:8 }}>
                Generado el {new Date().toLocaleDateString('es-AR')} · {new Date().toLocaleTimeString('es-AR', { hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:28 }}>
            {[
              { label:'Días de rodaje', value: project?.days?.length || 0, icon:'Calendar' },
              { label:'Total escenas',  value: allScenes.length, icon:'Clapperboard' },
              { label:'Tiempo estimado',value: minToStr(totalMin) || '—', icon:'Timer' },
              { label:'Departamentos',  value: totalDepts, icon:'Users' },
            ].map((s,i) => (
              <div key={i} style={{ border:`1.5px solid ${accent}22`, borderRadius:10, padding:'14px 16px', background:accent+'06' }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <Icon name={s.icon} size={14} color={accent}/>
                  <span style={{ fontSize:9, color:'#999', letterSpacing:'0.08em', fontWeight:700 }}>{s.label.toUpperCase()}</span>
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:accent }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Departamentos */}
          <div style={{ fontSize:9, color:'#aaa', letterSpacing:'0.1em', fontWeight:700, marginBottom:10 }}>DEPARTAMENTOS INVOLUCRADOS</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:20 }}>
            {Object.entries(depts || {}).map(([dk, m]) => (
              <div key={dk} style={{ display:'inline-flex', alignItems:'center', gap:6, border:`1px solid ${m.color}44`, borderRadius:8, padding:'6px 12px', background:m.color+'0E' }}>
                <Icon name={m.icon || 'Clapperboard'} size={13} color={m.color}/>
                <span style={{ fontSize:12, fontWeight:700, color:m.color }}>{m.label}</span>
                {deptData[dk]?.integrantes?.length > 0 && (
                  <span style={{ fontSize:10, color:'#aaa' }}>({deptData[dk].integrantes.length})</span>
                )}
              </div>
            ))}
          </div>

          {/* Tabla resumen de escenas */}
          <div style={{ fontSize:9, color:'#aaa', letterSpacing:'0.1em', fontWeight:700, marginBottom:10 }}>ÍNDICE DE ESCENAS</div>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ background:accent+'10', borderBottom:`2px solid ${accent}33` }}>
                {['Esc','Día','Título','Momento','Tomas','Tiempo','Depts'].map(h => (
                  <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontSize:9, letterSpacing:'0.08em', color:'#777', fontWeight:700 }}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {project?.days?.flatMap((day, di) =>
                day.scenes.map((scene, si) => {
                  const sd = sceneData[scene.id] || {}
                  return (
                    <tr key={scene.id} style={{ borderBottom:'1px solid #eee', background: si%2===0 ? '#fff' : '#fafaf8' }}>
                      <td style={{ padding:'7px 10px', fontWeight:700, color:accent }}>{scene.num}</td>
                      <td style={{ padding:'7px 10px', color:'#555' }}>{day.label}</td>
                      <td style={{ padding:'7px 10px', color:'#111', fontWeight:500 }}>{scene.title}</td>
                      <td style={{ padding:'7px 10px', color:'#777' }}>{MOMENTO_LABEL[scene.momento] || '—'}</td>
                      <td style={{ padding:'7px 10px', color:'#555', textAlign:'center' }}>{sd.planos?.length || '—'}</td>
                      <td style={{ padding:'7px 10px', color:'#555' }}>{minToStr(scene.tiempoTotal) || '—'}</td>
                      <td style={{ padding:'7px 10px' }}>
                        <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                          {(scene.depts || []).filter(k => depts[k]).map(dk => (
                            <span key={dk} style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:depts[dk].color }} title={depts[dk].label}/>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* DESGLOSE POR DÍA ──────────────────────────────────── */}
        {project?.days?.map((day, dayIdx) => (
          <div key={day.id} className="tbv-page" style={{ marginBottom:20 }}>

            {/* Cabecera del día */}
            <div style={{ background:accent, borderRadius:'14px 14px 0 0', padding:'16px 24px', display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>{dayIdx+1}</span>
              </div>
              <div>
                <div style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{day.label}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.75)' }}>
                  {day.date} · {day.scenes.length} escena{day.scenes.length!==1?'s':''} · {minToStr(day.scenes.reduce((a,s) => a+(s.tiempoTotal||0), 0)) || 'sin tiempo'}
                </div>
              </div>
            </div>

            {/* Escenas del día */}
            <div style={{ background:'#fff', borderRadius:'0 0 14px 14px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
              {day.scenes.map((scene, sceneIdx) => {
                const sd = sceneData[scene.id] || {}
                const planos = sd.planos || []
                const deptCL = sd.deptChecklists || {}
                const assignedDepts = (scene.depts || []).filter(k => depts[k])
                const totalSceneMin = scene.tiempoTotal || 0

                return (
                  <div key={scene.id} className="tbv-scene"
                    style={{ borderTop: sceneIdx > 0 ? '2px solid #f0ede8' : 'none' }}>

                    {/* Encabezado de escena */}
                    <div style={{ padding:'16px 24px 12px', borderLeft:`4px solid ${accent}`, background:accent+'06' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                            <span style={{ fontSize:11, fontWeight:800, color:accent, letterSpacing:'0.1em' }}>{scene.num}</span>
                            {scene.momento && scene.momento !== 'sin definir' && (
                              <span style={{ fontSize:10, color:'#888', display:'inline-flex', alignItems:'center', gap:3 }}>
                                <Icon name={MOMENTO_ICON[scene.momento]} size={11} color="#aaa"/> {MOMENTO_LABEL[scene.momento]}
                              </span>
                            )}
                            {totalSceneMin > 0 && (
                              <span style={{ fontSize:10, color:'#888', display:'inline-flex', alignItems:'center', gap:3 }}>
                                <Icon name="Timer" size={11} color="#aaa"/> {minToStr(totalSceneMin)}
                              </span>
                            )}
                            <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, padding:'2px 9px', borderRadius:20, border:`1px solid ${scene.done ? '#4ADE8055' : '#d48c0e44'}`, color: scene.done ? '#4ADE80' : '#d48c0e', background: scene.done ? '#f0fff8' : '#fffbf0' }}>
                              {scene.done ? '✓ COMPLETADA' : 'PENDIENTE'}
                            </span>
                          </div>
                          <div style={{ fontSize:16, fontWeight:700, color:'#111', lineHeight:1.3 }}>{scene.title}</div>
                          {scene.descripcion && (
                            <div style={{ fontSize:12, color:'#555', marginTop:5, lineHeight:1.5 }}>{scene.descripcion}</div>
                          )}
                          {scene.notes && (
                            <div style={{ fontSize:11, color:'#888', marginTop:5, fontStyle:'italic', display:'flex', alignItems:'flex-start', gap:4 }}>
                              <Icon name="FileText" size={11} color="#ccc"/> {scene.notes}
                            </div>
                          )}
                          {scene.locacion && (
                            <div style={{ fontSize:11, color:'#888', marginTop:5, display:'flex', alignItems:'center', gap:4 }}>
                              <Icon name="MapPin" size={11} color="#ccc"/> {scene.locacion.length > 60 ? scene.locacion.slice(0,60)+'…' : scene.locacion}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Dept badges */}
                      {assignedDepts.length > 0 && (
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
                          {assignedDepts.map(dk => {
                            const m = depts[dk]
                            return (
                              <span key={dk} style={{ fontSize:10, fontWeight:700, padding:'3px 9px', borderRadius:6, border:`1px solid ${m.color}44`, color:m.color, background:m.color+'0E', display:'inline-flex', alignItems:'center', gap:4 }}>
                                <Icon name={m.icon||'Clapperboard'} size={10} color={m.color}/> {m.label}
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Tomas / Planos */}
                    {planos.length > 0 && (
                      <div style={{ padding:'12px 24px', borderTop:'1px solid #f5f3f0' }}>
                        <div style={{ fontSize:9, color:'#aaa', letterSpacing:'0.1em', fontWeight:700, marginBottom:8 }}>TOMAS ({planos.length})</div>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
                          <thead>
                            <tr style={{ background:'#fafaf8' }}>
                              {['#','Tipo','Lente','Duración','Descripción','Deptos'].map(h => (
                                <th key={h} style={{ padding:'6px 8px', textAlign:'left', fontSize:9, letterSpacing:'0.06em', color:'#aaa', fontWeight:700, borderBottom:'1px solid #eee' }}>{h.toUpperCase()}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {planos.map((p, pi) => (
                              <tr key={p.id} style={{ borderBottom:'1px solid #f5f3f0', background: pi%2===0 ? '#fff' : '#fafaf8' }}>
                                <td style={{ padding:'6px 8px', fontWeight:800, color:accent, whiteSpace:'nowrap' }}>{p.numero || p.num || `T${pi+1}`}</td>
                                <td style={{ padding:'6px 8px', color:'#555' }}>{p.tipo || '—'}</td>
                                <td style={{ padding:'6px 8px', color:'#555', whiteSpace:'nowrap' }}>{p.lente || '—'}</td>
                                <td style={{ padding:'6px 8px', color:'#555', whiteSpace:'nowrap' }}>{p.duracion || '—'}</td>
                                <td style={{ padding:'6px 8px', color:'#444', lineHeight:1.4 }}>{p.descripcion || '—'}</td>
                                <td style={{ padding:'6px 8px' }}>
                                  <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                                    {(p.depts || []).filter(k => depts[k]).map(dk => (
                                      <span key={dk} style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:4, background:depts[dk].color+'18', color:depts[dk].color, border:`1px solid ${depts[dk].color}33` }}>
                                        {depts[dk].label}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Checklists por departamento */}
                    {assignedDepts.some(dk => (deptCL[dk] || []).length > 0) && (
                      <div style={{ padding:'12px 24px', borderTop:'1px solid #f5f3f0' }}>
                        <div style={{ fontSize:9, color:'#aaa', letterSpacing:'0.1em', fontWeight:700, marginBottom:10 }}>CHECKLIST POR DEPARTAMENTO</div>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
                          {assignedDepts.filter(dk => (deptCL[dk] || []).length > 0).map(dk => {
                            const m = depts[dk]
                            const items = deptCL[dk] || []
                            const done = items.filter(i => i.done).length
                            return (
                              <div key={dk} style={{ border:`1px solid ${m.color}33`, borderRadius:8, overflow:'hidden' }}>
                                <div style={{ padding:'7px 10px', background:m.color+'0E', borderBottom:`1px solid ${m.color}22`, display:'flex', alignItems:'center', gap:6 }}>
                                  <Icon name={m.icon||'Clapperboard'} size={12} color={m.color}/>
                                  <span style={{ fontSize:11, fontWeight:700, color:m.color, flex:1 }}>{m.label}</span>
                                  <span style={{ fontSize:9, color:'#aaa' }}>{done}/{items.length}</span>
                                </div>
                                <div style={{ padding:'6px 10px' }}>
                                  {items.map(it => (
                                    <div key={it.id} style={{ display:'flex', alignItems:'flex-start', gap:6, marginBottom:3 }}>
                                      <span style={{ marginTop:1, fontSize:11, color: it.done ? m.color : '#ccc', flexShrink:0 }}>{it.done ? '✓' : '○'}</span>
                                      <span style={{ fontSize:11, color: it.done ? '#aaa' : '#444', textDecoration: it.done ? 'line-through' : 'none', lineHeight:1.4 }}>{it.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* CREW Y ELENCO ─────────────────────────────────────── */}
        {(crew.length > 0 || deptData['casting']?.elenco?.length > 0) && (
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:20 }}>
            <div style={{ padding:'16px 24px', background:accent, display:'flex', alignItems:'center', gap:10 }}>
              <Icon name="Users" size={20} color="#fff"/>
              <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Crew & Elenco</span>
            </div>

            {/* Crew por departamento */}
            {Object.entries(depts || {}).filter(([dk]) => (deptData[dk]?.integrantes || []).length > 0).map(([dk, m]) => (
              <div key={dk} style={{ borderTop:'1px solid #f0ede8', padding:'14px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <Icon name={m.icon||'Clapperboard'} size={14} color={m.color}/>
                  <span style={{ fontSize:12, fontWeight:700, color:m.color, letterSpacing:'0.04em' }}>{m.label.toUpperCase()}</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:6 }}>
                  {(deptData[dk]?.integrantes || []).map((p, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:'#fafaf8', borderRadius:8, border:'1px solid #eee' }}>
                      <div style={{ width:28, height:28, borderRadius:'50%', background:m.color+'22', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:700, color:m.color }}>
                        {(p.nombre || p.name || '?').slice(0,1).toUpperCase()}
                      </div>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:'#111', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.nombre || p.name || '—'}</div>
                        {(p.rol || p.role) && <div style={{ fontSize:10, color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.rol || p.role}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Elenco (Casting) */}
            {deptData['casting']?.elenco?.length > 0 && (
              <div style={{ borderTop:'1px solid #f0ede8', padding:'14px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <Icon name="Drama" size={14} color={depts['casting']?.color || '#E879F9'}/>
                  <span style={{ fontSize:12, fontWeight:700, color: depts['casting']?.color || '#E879F9', letterSpacing:'0.04em' }}>ELENCO</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:6 }}>
                  {(deptData['casting']?.elenco || []).map((p, i) => (
                    <div key={i} style={{ padding:'8px 12px', background:'#fafaf8', borderRadius:8, border:'1px solid #eee' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#111' }}>{p.nombre || p.name || p.actor || '—'}</div>
                      {(p.personaje || p.character || p.rol) && (
                        <div style={{ fontSize:10, color:'#888', marginTop:2 }}>
                          como <em>{p.personaje || p.character || p.rol}</em>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EQUIPOS (rental) ────────────────────────────────────── */}
        {Object.entries(depts || {}).some(([dk]) => (deptData[dk]?.equipos || []).length > 0) && (
          <div style={{ background:'#fff', borderRadius:14, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)', marginBottom:20 }}>
            <div style={{ padding:'16px 24px', background:'#2d2d2d', display:'flex', alignItems:'center', gap:10 }}>
              <Icon name="Package" size={20} color="#fff"/>
              <span style={{ fontSize:16, fontWeight:800, color:'#fff' }}>Equipos & Rental</span>
            </div>
            {Object.entries(depts || {}).filter(([dk]) => (deptData[dk]?.equipos || []).length > 0).map(([dk, m]) => (
              <div key={dk} style={{ borderTop:'1px solid #f0ede8', padding:'14px 24px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                  <Icon name={m.icon||'Clapperboard'} size={14} color={m.color}/>
                  <span style={{ fontSize:12, fontWeight:700, color:m.color, letterSpacing:'0.04em' }}>{m.label.toUpperCase()}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  {(deptData[dk]?.equipos || []).map((eq, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background: eq.done ? '#f0fff8' : '#fafaf8', borderRadius:7, border:'1px solid #eee' }}>
                      <span style={{ fontSize:12, color: eq.done ? '#4ADE80' : '#ccc' }}>{eq.done ? '✓' : '○'}</span>
                      <span style={{ fontSize:12, color: eq.done ? '#888' : '#333', flex:1, textDecoration: eq.done ? 'line-through' : 'none' }}>{eq.text || eq.nombre || eq.item || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
