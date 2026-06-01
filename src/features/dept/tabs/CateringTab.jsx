import { useState, useEffect } from 'react'
import { useDeptData } from '../../../hooks/useDeptData'
import { db } from '../../../services/db'
import { Icon } from '../../../components/ui/Icon'

const CONDICIONES_PRESET = ['Sin restricciones','Vegetariano','Vegano','Celíaco','Sin gluten','Sin lactosa','Sin mariscos','Kosher','Halal','Diabético']

const iconoCondicion = (c) => {
  if (c==='Vegano')      return 'Leaf'
  if (c==='Vegetariano') return 'Salad'
  if (c==='Celíaco'||c==='Sin gluten') return 'WheatOff'
  if (c==='Sin lactosa') return 'MilkOff'
  if (c==='Kosher')      return 'Star'
  if (c==='Halal')       return 'Moon'
  if (c==='Diabético')   return 'Syringe'
  return 'UtensilsCrossed'
}

export default function CateringTab({ color, projectId, project }) {
  const { items: condicionesRaw, save: setCondicionesRaw } = useDeptData(projectId, 'catering', 'condiciones', [])
  const { items: extras, save: setExtrasRaw } = useDeptData(projectId, 'catering', 'personas', [])
  const [allCrew, setAllCrew] = useState([])
  const [loaded, setLoaded]   = useState(false)
  const [openId, setOpenId]   = useState(null)
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [extraForm, setExtraForm] = useState({ nombre:'', condicion:'Sin restricciones' })

  useEffect(() => {
    if (!project) return
    const deptKeys = Object.keys(project.depts)
    Promise.all(
      deptKeys.map(dk =>
        db.getDeptData(projectId, dk, 'integrantes').then(d =>
          (d||[]).map(p => ({
            id:`${dk}__${p.id}`, nombre:p.nombre||'', apodo:p.apodo||'', rol:p.rol||'',
            condicionOriginal:p.condicionAlimentaria||'',
            deptKey:dk, deptLabel:project.depts[dk]?.label||dk, deptColor:project.depts[dk]?.color||'#888', deptIcon:project.depts[dk]?.icon||'Clapperboard',
          }))
        ).catch(()=>[])
      )
    ).then(results => { setAllCrew(results.flat()); setLoaded(true) })
  }, [projectId, project])

  const overrideMap = {}
  ;(condicionesRaw||[]).forEach(c => { overrideMap[c.personId] = c.condicion })

  const condEfectiva = (p) => overrideMap[p.id] !== undefined ? overrideMap[p.id] : (p.condicionOriginal||'')
  const setOverride  = (personId, condicion) => setCondicionesRaw([...(condicionesRaw||[]).filter(c=>c.personId!==personId), { personId, condicion }])
  const clearOverride = (personId) => setCondicionesRaw((condicionesRaw||[]).filter(c=>c.personId!==personId))

  const addExtra = () => {
    if (!extraForm.nombre) return
    const id = 'extra__'+Date.now()
    setExtrasRaw([...(extras||[]), { id, nombre:extraForm.nombre }])
    setOverride(id, extraForm.condicion)
    setExtraForm({ nombre:'', condicion:'Sin restricciones' })
    setShowExtraForm(false)
  }
  const delExtra = (id) => { setExtrasRaw((extras||[]).filter(e=>e.id!==id)); setCondicionesRaw((condicionesRaw||[]).filter(c=>c.personId!==id)) }

  const extrasItems = (extras||[]).map(e => ({ id:e.id, nombre:e.nombre, apodo:'', rol:'', condicionOriginal:'', deptKey:'_extra', deptLabel:'Invitados / Extras', deptColor:'#888', deptIcon:'Plus' }))
  const todos = [...allCrew, ...extrasItems]

  const resumen = {}; let asignados = 0
  todos.forEach(p => { const c = condEfectiva(p); if (c) { resumen[c]=(resumen[c]||0)+1; asignados++ } })
  const conRestricciones = Object.entries(resumen).filter(([c])=>c!=='Sin restricciones').reduce((a,[,n])=>a+n,0)

  const byDept = {}
  todos.forEach(p => { (byDept[p.deptKey]=byDept[p.deptKey]||[]).push(p) })

  return (
    <div>
      {todos.length > 0 && (
        <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:'14px 16px', border:'1px solid var(--border-light)', marginBottom:20 }}>
          <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.08em', marginBottom:12, fontFamily:'inherit' }}>RESUMEN ALIMENTARIO</div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <div style={{ flex:1, background:'var(--bg-card-dark)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{todos.length}</div>
              <div style={{ fontSize:10, color:'#aaa', fontFamily:'inherit' }}>TOTAL</div>
            </div>
            <div style={{ flex:1, background:'#fff8ec', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid #f5e8c0' }}>
              <div style={{ fontSize:22, fontWeight:700, color:'#d48c0e', fontFamily:'inherit' }}>{conRestricciones}</div>
              <div style={{ fontSize:10, color:'#d48c0e', fontFamily:'inherit' }}>CON RESTRICCIÓN</div>
            </div>
            <div style={{ flex:1, background:'#e8f8f0', borderRadius:10, padding:'10px 12px', textAlign:'center', border:'1px solid #0fa87e33' }}>
              <div style={{ fontSize:22, fontWeight:700, color:'#0fa87e', fontFamily:'inherit' }}>{resumen['Sin restricciones']||0}</div>
              <div style={{ fontSize:10, color:'#0fa87e', fontFamily:'inherit' }}>SIN RESTRICCIÓN</div>
            </div>
          </div>
          {Object.entries(resumen).map(([cond,cant]) => (
            <div key={cond} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f5f3f0' }}>
              <span style={{ fontSize:13, color:'var(--text-primary)', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}><Icon name={iconoCondicion(cond)} size={13} color="var(--text-secondary)" /> {cond}</span>
              <span style={{ fontSize:13, fontWeight:700, color:cond==='Sin restricciones'?'#0fa87e':'#d48c0e', fontFamily:'inherit', background:cond==='Sin restricciones'?'#e8f8f0':'#fff8ec', borderRadius:20, padding:'2px 10px' }}>{cant} {cant===1?'persona':'personas'}</span>
            </div>
          ))}
          {asignados < todos.length && <div style={{ marginTop:8, fontSize:11, color:'#aaa', fontFamily:'inherit', fontStyle:'italic' }}>{todos.length-asignados} personas no cargaron su condición.</div>}
        </div>
      )}
      {!loaded && <div style={{ textAlign:'center', padding:'32px', color:'#ccc', fontFamily:'inherit' }}>Cargando crew...</div>}
      {loaded && todos.length===0 && <div style={{ textAlign:'center', padding:'40px 20px', color:'#ccc', fontFamily:'inherit' }}>Ningún departamento cargó integrantes todavía.</div>}
      {loaded && Object.entries(byDept).map(([dk, personas]) => {
        const isExtra = dk==='_extra'
        const dmColor = isExtra?'#888':(project?.depts?.[dk]?.color||'#888')
        const dmIcon  = isExtra?'Plus':(project?.depts?.[dk]?.icon||'Clapperboard')
        const dmLabel = isExtra?'INVITADOS / EXTRAS':(project?.depts?.[dk]?.label||dk).toUpperCase()
        return (
          <div key={dk} style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, padding:'6px 0' }}>
              <Icon name={dmIcon} size={16} color={dmColor} />
              <span style={{ fontSize:11, fontWeight:700, color:dmColor, letterSpacing:'0.08em', fontFamily:'inherit' }}>{dmLabel}</span>
              <span style={{ fontSize:10, color:'#ccc', fontFamily:'inherit' }}>— {personas.length}</span>
            </div>
            {personas.map(p => {
              const cond = condEfectiva(p)
              const override = overrideMap[p.id] !== undefined
              const isOpen = openId===p.id
              return (
                <div key={p.id} style={{ background:'var(--bg-secondary)', borderRadius:12, marginBottom:6, border:`1px solid ${cond?color+'30':'var(--border-light)'}`, overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px' }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:(cond?color:dmColor)+'18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon name={cond?iconoCondicion(cond):'User'} size={15} color={cond?color:dmColor} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{p.apodo||p.nombre}</div>
                      {cond
                        ? <div style={{ fontSize:11, color:cond==='Sin restricciones'?'#0fa87e':color, fontFamily:'inherit', marginTop:2 }}>
                            {cond}{override&&!isExtra&&p.condicionOriginal&&<span style={{ fontSize:9, color:'#aaa', marginLeft:6, fontStyle:'italic' }}>(editado)</span>}
                          </div>
                        : <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'inherit', fontStyle:'italic', marginTop:2 }}>Sin cargar</div>
                      }
                    </div>
                    <button onClick={() => setOpenId(isOpen?null:p.id)} style={{ fontFamily:'inherit', fontSize:11, fontWeight:700, background:cond?'var(--bg-card-dark)':color, color:cond?'#888':'#fff', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer' }}>{cond?'✎':'Elegir'}</button>
                    {isExtra && <button onClick={() => delExtra(p.id)} style={{ background:'none', border:'none', color:'var(--border-light)', cursor:'pointer', padding:0, marginLeft:4 }}>✕</button>}
                  </div>
                  {isOpen && (
                    <div style={{ padding:'0 14px 12px', borderTop:'1px solid #f5f3f0', paddingTop:10 }}>
                      <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit' }}>CONDICIÓN ALIMENTARIA</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:8 }}>
                        {CONDICIONES_PRESET.map(c => (
                          <button key={c} onClick={() => { setOverride(p.id, c); setOpenId(null) }} style={{ fontFamily:'inherit', fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:20, cursor:'pointer', border:'none', background:cond===c?color:'var(--bg-card-dark)', color:cond===c?'#fff':'#888' }}>{c}</button>
                        ))}
                      </div>
                      {override&&!isExtra&&p.condicionOriginal&&(
                        <button onClick={() => { clearOverride(p.id); setOpenId(null) }} style={{ fontFamily:'inherit', fontSize:10, background:'none', color:'#aaa', border:'1px solid #e5e2dd', borderRadius:8, padding:'5px 10px', cursor:'pointer' }}>
                          ↺ Restaurar ({p.condicionOriginal})
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
      {loaded && (
        !showExtraForm
          ? <button onClick={() => setShowExtraForm(true)} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, color, background:'none', border:`1px dashed ${color}55`, borderRadius:14, padding:'12px', cursor:'pointer', marginTop:4 }}>+ Agregar invitado / externo</button>
          : <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginTop:4 }}>
              <div style={{ fontSize:11, color:'#aaa', letterSpacing:'0.06em', marginBottom:10, fontFamily:'inherit' }}>INVITADO / EXTERNO</div>
              <input value={extraForm.nombre} onChange={e => setExtraForm(f=>({...f,nombre:e.target.value}))} placeholder="Nombre (ej: Cliente, Chofer externo)"
                style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card-dark)', border:'1px solid #e5e2dd', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:10 }} />
              <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:8, fontFamily:'inherit' }}>CONDICIÓN ALIMENTARIA</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {CONDICIONES_PRESET.map(c => (
                  <button key={c} onClick={() => setExtraForm(f=>({...f,condicion:c}))} style={{ fontFamily:'inherit', fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:20, cursor:'pointer', border:'none', background:extraForm.condicion===c?color:'var(--bg-card-dark)', color:extraForm.condicion===c?'#fff':'#888' }}>{c}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => setShowExtraForm(false)} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card-dark-secondary)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
                <button onClick={addExtra} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Agregar</button>
              </div>
            </div>
      )}
    </div>
  )
}
