import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { DAY_COLORS } from '../../constants/depts'
import { distanciaEnKm, extraerCoordsDeGoogleMaps, calcularTrasladoMinutos } from '../../utils/geo'

const ICON_MOMENTO  = { mañana:'Sunrise', tarde:'Cloud', noche:'Moon', 'sin definir':'Clapperboard' }
const COLOR_MOMENTO = { mañana:'#FBBF24', tarde:'#38BDF8', noche:'#818CF8', 'sin definir':'#94A3B8' }
const MOMENTOS      = ['mañana','tarde','noche','sin definir']

function SceneCard({ scene, momento, sceneIndex, dayScenes, depts, color, isAdmin, dayId, onSelectScene, onToggleScene, onDeleteScene, onEditSceneName, editingSceneId, setEditingSceneId, editingSceneName, setEditingSceneName }) {
  const tiempoMin = scene.tiempoTotal || 0
  const tiempoStr = tiempoMin > 0
    ? (tiempoMin >= 60 ? `${Math.floor(tiempoMin/60)}h ${tiempoMin%60}m` : `${tiempoMin}m`)
    : null

  const cardBg   = scene.done ? 'var(--bg-card-dark-secondary)' : 'var(--bg-secondary)'
  const cardBord = scene.done ? 'var(--border-light)' : `${color}25`
  const titleCol = scene.done ? 'var(--text-muted)' : 'var(--text-primary)'

  // Traslado estimate to next scene
  let trasladoInfo = null
  if (sceneIndex < dayScenes.length - 1) {
    const next = dayScenes[sceneIndex + 1]
    const c1 = extraerCoordsDeGoogleMaps(scene.locacion)
    const c2 = extraerCoordsDeGoogleMaps(next.locacion)
    if (c1 && c2) {
      const km = distanciaEnKm(c1.lat, c1.lon, c2.lat, c2.lon)
      trasladoInfo = { km: km.toFixed(1), minutos: calcularTrasladoMinutos(km) }
    }
  }

  return (
    <div style={{ display:'flex', alignItems:'stretch', background:cardBg, borderRadius:14, border:`1px solid ${cardBord}`, overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.05)', opacity:scene.done?0.6:1 }}>
      <div style={{ width:4, alignSelf:'stretch', background:scene.done?'#e0ddd8':color, flexShrink:0 }}/>
      <div style={{ flex:1, padding:'12px 14px', display:'flex', flexDirection:'column' }}>
        {/* Top row: number + edit + time */}
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
          {editingSceneId === scene.id ? (
            <input type="text" value={editingSceneName}
              onChange={e => setEditingSceneName(e.target.value)}
              onBlur={() => { if (editingSceneName.trim()) onEditSceneName(dayId, scene.id, editingSceneName); setEditingSceneId(null) }}
              onKeyDown={e => { if(e.key==='Enter') { if(editingSceneName.trim()) onEditSceneName(dayId, scene.id, editingSceneName); setEditingSceneId(null) } if(e.key==='Escape') setEditingSceneId(null) }}
              autoFocus onClick={e => e.stopPropagation()}
              style={{ fontSize:11, letterSpacing:'0.08em', color, fontFamily:'inherit', fontWeight:700, border:`1.5px solid ${color}`, background:'var(--bg-card-dark)', borderRadius:6, padding:'3px 8px', maxWidth:150, outline:'none' }}
            />
          ) : (
            <span style={{ fontSize:10, letterSpacing:'0.1em', color:scene.done?'var(--text-muted)':color, fontFamily:'inherit', fontWeight:700 }}>{scene.num}</span>
          )}
          {editingSceneId !== scene.id && (
            <button onClick={e => { e.stopPropagation(); setEditingSceneId(scene.id); setEditingSceneName(scene.num) }}
              style={{ background:'none', border:'none', cursor:'pointer', color, fontSize:12, padding:'2px 4px', lineHeight:1, borderRadius:4, opacity:0.6 }}>✎</button>
          )}
          {tiempoStr && (
            <span style={{ fontSize:10, color:'var(--text-secondary)', fontFamily:'inherit', opacity:0.7, display:'flex', alignItems:'center', gap:2 }}>
              · <Icon name="Timer" size={10} color="currentColor"/> {tiempoStr}
            </span>
          )}
        </div>

        {/* Body — tap opens scene */}
        <div onClick={() => onSelectScene(scene)} className="tap" style={{ cursor:'pointer' }}>
          <div style={{ fontSize:14, color:titleCol, fontFamily:'inherit', lineHeight:1.4, textDecoration:scene.done?'line-through':'none' }}>{scene.title}</div>
          {scene.descripcion && (
            <div style={{ fontSize:13, color:'var(--text-secondary)', fontFamily:'inherit', marginTop:3, lineHeight:1.4 }}>
              {scene.descripcion.slice(0,60)}{scene.descripcion.length>60?'…':''}
            </div>
          )}
          {trasladoInfo && (
            <div style={{ fontSize:10, color:'var(--color-secondary)', fontFamily:'inherit', marginTop:5, padding:'4px 8px', background:'rgba(47,126,216,0.08)', borderRadius:6, border:'1px solid rgba(47,126,216,0.2)', display:'flex', alignItems:'center', gap:4 }}>
              <Icon name="Car" size={11} color="currentColor"/> Traslado: {trasladoInfo.km} km (~{trasladoInfo.minutos} min)
            </div>
          )}
          {(scene.depts||[]).filter(k=>depts[k]).length > 0 && (
            <div style={{ display:'flex', gap:5, marginTop:8, flexWrap:'wrap' }}>
              {(scene.depts||[]).filter(k=>depts[k]).map(dk => {
                const m = depts[dk]
                return (
                  <span key={dk} style={{ fontSize:10, padding:'2px 8px', borderRadius:8, background:scene.done?'var(--bg-card-dark-secondary)':m.color+'14', color:scene.done?'var(--text-muted)':m.color, border:`1px solid ${scene.done?'var(--border-light)':m.color+'33'}`, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:3 }}>
                    <Icon name={m.icon||'Clapperboard'} size={10} color={scene.done?'var(--text-muted)':m.color}/> {m.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {isAdmin && (
        <button onClick={() => onDeleteScene(dayId, scene.id)}
          style={{ width:36, alignSelf:'stretch', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-error)', border:'none', borderLeft:'1px solid #ffe0e0', cursor:'pointer', color:'#ffb3b3', fontSize:14 }}>✕</button>
      )}
      <div onClick={() => onToggleScene(scene.id)} className="tap"
        style={{ width:50, alignSelf:'stretch', display:'flex', alignItems:'center', justifyContent:'center', background:scene.done?'#f5f3f0':'rgba(255,255,255,0.5)', borderLeft:'1px solid #f0ede8', cursor:'pointer', flexShrink:0 }}>
        <Icon name={scene.done ? 'CheckCircle' : 'Circle'} size={20} color={scene.done?'#4ADE80':'rgba(255,255,255,0.35)'}/>
      </div>
    </div>
  )
}

export default function DayView({ day, dayIndex, depts, isAdmin, onBack, onSelectScene, onToggleScene, onAddScene, onDeleteScene, onEditSceneName }) {
  const done  = day.scenes.filter(s => s.done).length
  const pct   = day.scenes.length ? done / day.scenes.length : 0
  const color = DAY_COLORS[dayIndex % DAY_COLORS.length]

  const [addTitle, setAddTitle]     = useState('')
  const [addNum, setAddNum]         = useState('')
  const [addMomento, setAddMomento] = useState('mañana')
  const [showAdd, setShowAdd]       = useState(false)
  const [editingSceneId, setEditingSceneId]     = useState(null)
  const [editingSceneName, setEditingSceneName] = useState('')

  const submitAdd = () => {
    if (!addTitle.trim()) return
    onAddScene(day.id, addTitle.trim(), addMomento, addNum.trim() || null)
    setAddTitle(''); setAddNum(''); setShowAdd(false)
  }

  // Group scenes by time of day
  const byMomento = {}
  MOMENTOS.forEach(m => { byMomento[m] = [] })
  day.scenes.forEach(s => {
    const m = s.momento || 'sin definir'
    if (!byMomento[m]) byMomento[m] = []
    byMomento[m].push(s)
  })

  const sceneCardProps = { color, isAdmin, dayId: day.id, depts, onSelectScene, onToggleScene, onDeleteScene, onEditSceneName, editingSceneId, setEditingSceneId, editingSceneName, setEditingSceneName }

  return (
    <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', flexDirection:'column' }} className="slide-r">
      {/* Header */}
      <div className="theme-surface" style={{ padding:'calc(env(safe-area-inset-top,0px) + 14px) 20px 18px', borderBottom:'1px solid var(--border-light)', position:'sticky', top:0, zIndex:10 }}>
        <button onClick={onBack} className="tap" style={{ background:'none', border:'none', fontSize:13, color:'var(--text-tertiary)', cursor:'pointer', fontFamily:'inherit', marginBottom:8, padding:0 }}>
          ‹ Inicio
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div>
            <div style={{ fontSize:22, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{day.label}</div>
            <div style={{ fontSize:13, color:'var(--text-tertiary)', fontFamily:'inherit' }}>{day.date}</div>
          </div>
          <div style={{ marginLeft:'auto', position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
            <ProgressRing pct={pct*100} size={52} stroke={4} color={color}/>
            <div style={{ position:'absolute', textAlign:'center' }}>
              <div style={{ fontSize:13, fontWeight:700, color:'var(--text-primary)', lineHeight:1 }}>{done}</div>
              <div style={{ fontSize:8, color:'var(--text-secondary)' }}>/{day.scenes.length}</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop:12 }}>
          <ProgressBar pct={pct*100} color={color} height={5}/>
          <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:4, fontFamily:'inherit' }}>{done} de {day.scenes.length} escenas completadas</div>
        </div>
      </div>

      {/* Scene list */}
      <div style={{ flex:1, padding:'16px 16px 80px' }}>
        {MOMENTOS.map(momento => {
          const sc = byMomento[momento] || []
          if (sc.length === 0) return null
          return (
            <div key={momento} style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Icon name={ICON_MOMENTO[momento]} size={18} color={COLOR_MOMENTO[momento]}/>
                <span style={{ fontSize:11, fontWeight:700, color:COLOR_MOMENTO[momento], letterSpacing:'0.1em', fontFamily:'inherit' }}>{momento.toUpperCase()}</span>
                <span style={{ fontSize:10, color:'var(--text-muted)', fontFamily:'inherit' }}>— {sc.length} escena{sc.length!==1?'s':''}</span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {sc.map(scene => (
                  <SceneCard key={scene.id} scene={scene} momento={momento}
                    sceneIndex={day.scenes.indexOf(scene)} dayScenes={day.scenes}
                    {...sceneCardProps}/>
                ))}
              </div>
            </div>
          )
        })}

        {isAdmin && !showAdd && (
          <button onClick={() => setShowAdd(true)} className="tap"
            style={{ width:'100%', fontFamily:'inherit', fontSize:13, color:'var(--text-primary)', background:`${color}14`, border:`1px dashed ${color}66`, borderRadius:12, padding:'12px', cursor:'pointer', marginTop:4 }}>
            + Agregar escena
          </button>
        )}
        {isAdmin && showAdd && (
          <div style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:`1px solid ${color}30`, marginTop:4 }}>
            <div style={{ fontSize:10, color:'var(--text-secondary)', letterSpacing:'0.08em', marginBottom:10, fontFamily:'inherit' }}>NUEVA ESCENA</div>
            <div style={{ display:'flex', gap:8, marginBottom:8 }}>
              <input value={addNum} onChange={e => setAddNum(e.target.value)} placeholder="ESC 01"
                style={{ width:'38%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:`1.5px solid ${color}55`, borderRadius:10, padding:'10px', color:'var(--text-primary)', outline:'none' }}/>
              <input value={addTitle} onChange={e => setAddTitle(e.target.value)} placeholder="Descripción de la escena..." autoFocus
                style={{ flex:1, fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}/>
            </div>
            <div style={{ fontSize:10, color:'var(--text-secondary)', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit' }}>MOMENTO DEL DÍA</div>
            <div style={{ display:'flex', gap:6, marginBottom:12 }}>
              {[['mañana','Sunrise'],['tarde','Cloud'],['noche','Moon']].map(([m,ic]) => (
                <button key={m} onClick={() => setAddMomento(m)}
                  style={{ flex:1, fontFamily:'inherit', fontSize:12, padding:'8px', borderRadius:10, border:'none', cursor:'pointer', background:addMomento===m?color:'var(--bg-card-dark)', color:addMomento===m?'#fff':'var(--text-secondary)', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                  <Icon name={ic} size={12} color={addMomento===m?'#fff':'var(--text-secondary)'}/> {m}
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
              <button onClick={submitAdd} style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Agregar escena</button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav bar */}
      <div className="theme-surface" style={{ position:'sticky', bottom:0, borderTop:'1px solid var(--border-light)', padding:'8px 20px calc(env(safe-area-inset-bottom,0px) + 8px)', display:'flex', alignItems:'center', gap:12, zIndex:10 }}>
        <button onClick={onBack} className="tap"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 20px', borderRadius:12, color:'var(--text-secondary)', fontFamily:'inherit', minWidth:72 }}>
          <Icon name="Home" size={20} color="var(--text-secondary)"/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em' }}>INICIO</span>
        </button>
        <div style={{ width:1, height:36, background:'var(--border-light)' }}/>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 20px', color, fontFamily:'inherit', minWidth:72 }}>
          <Icon name="Calendar" size={20} color={color}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em', maxWidth:80, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {day.label?.toUpperCase()?.slice(0,12)}
          </span>
        </div>
      </div>
    </div>
  )
}
