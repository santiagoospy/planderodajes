import { useState, useEffect, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'
import { ProgressRing } from '../../components/ui/ProgressRing'
import { PinModal } from '../../components/ui/PinModal'
import { uid } from '../../utils/uid'
import { isPinnedProject, pinProject, unpinProject } from '../../utils/urls'
import { api } from '../../services/api'
import { getTheme } from '../../constants/themes'
import WeatherWidget from '../weather/WeatherWidget'
import IMessageChat from '../messaging/IMessageChat'
import { downloadProject, isDownloaded, getDownloadedAt } from '../../services/offline'

function CoverPositionPicker({ src, initial, onSave, onCancel }) {
  const parse = (s) => {
    if (!s) return { x: 50, y: 50 }
    const parts = s.split(' ')
    return { x: parseFloat(parts[0]) || 50, y: parseFloat(parts[1]) || 50 }
  }
  const [pos, setPos]   = useState(() => parse(initial))
  const dragging        = useRef(false)
  const lastPt          = useRef({ x: 0, y: 0 })

  const onDown = (e) => {
    dragging.current = true
    const p = e.touches ? e.touches[0] : e
    lastPt.current = { x: p.clientX, y: p.clientY }
  }
  const onMove = (e) => {
    if (!dragging.current) return
    e.preventDefault()
    const p = e.touches ? e.touches[0] : e
    const dx = p.clientX - lastPt.current.x
    const dy = p.clientY - lastPt.current.y
    lastPt.current = { x: p.clientX, y: p.clientY }
    setPos(prev => ({
      x: Math.max(0, Math.min(100, prev.x - dx * 0.25)),
      y: Math.max(0, Math.min(100, prev.y - dy * 0.25)),
    }))
  }
  const onUp = () => { dragging.current = false }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:600, background:'rgba(0,0,0,0.97)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 16px) 20px 16px', display:'flex', alignItems:'center' }}>
        <button onClick={onCancel}
          style={{ background:'none', border:'none', color:'rgba(255,255,255,0.55)', fontSize:13, cursor:'pointer', padding:0, fontFamily:'inherit' }}>
          Cancelar
        </button>
        <div style={{ flex:1, textAlign:'center', fontSize:14, fontWeight:700, color:'#fff', fontFamily:'inherit' }}>
          Ajustar encuadre
        </div>
        <button onClick={() => onSave(`${Math.round(pos.x)}% ${Math.round(pos.y)}%`)}
          style={{ background:'none', border:'none', color:'var(--color-primary)', fontSize:13, fontWeight:700, cursor:'pointer', padding:0, fontFamily:'inherit' }}>
          Guardar
        </button>
      </div>

      {/* Preview con misma altura que la portada real */}
      <div
        style={{ position:'relative', width:'100%', height:200, overflow:'hidden', cursor:'grab', touchAction:'none', userSelect:'none' }}
        onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
      >
        <img src={src} alt="" draggable={false}
          style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:`${pos.x}% ${pos.y}%`, pointerEvents:'none' }} />
        {/* Borde de encuadre */}
        <div style={{ position:'absolute', inset:0, border:'2px solid rgba(255,255,255,0.5)', pointerEvents:'none' }} />
        {/* Guías de tercios */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
          backgroundSize:'33.33% 33.33%' }} />
      </div>

      <div style={{ padding:'20px 20px 8px', textAlign:'center', color:'rgba(255,255,255,0.35)', fontSize:12, fontFamily:'inherit' }}>
        Arrastrá la imagen para elegir qué parte mostrar
      </div>
    </div>
  )
}

export default function HomeView({
  project, isAdmin, save, depts, projectId,
  theme, setTheme,
  onSelectDay, onSelectDept, onExport, onOpenMessages,
  onOpenCitaciones, onOpenScouting, onOpenTools, onOpenDropbox,
  onLock, onUnlock,
  onNewProject,
}) {
  const onUpdateProject = save

  const [showAddDept, setShowAddDept]   = useState(false)
  const [newDeptLabel, setNewDeptLabel] = useState('')
  const [newDeptIcon, setNewDeptIcon]   = useState('User')
  const [newDeptColor, setNewDeptColor] = useState('#FF5722')
  const [pinned, setPinned]             = useState(() => isPinnedProject(project.id))
  const [productoraGrad, setProductoraGrad] = useState(getTheme('celeste').grad)
  const [isLightTheme, setIsLightTheme] = useState(false)
  const [editingProjectName, setEditingProjectName] = useState(false)
  const [newProjectName, setNewProjectName] = useState(project.name || project.title || '')
  const [msg, setMsg]             = useState(null)
  const [showMsgForm, setShowMsgForm] = useState(false)
  const [msgDraft, setMsgDraft]   = useState('')
  const [editingDayId, setEditingDayId] = useState(null)
  const [editingDayLabel, setEditingDayLabel] = useState('')
  const [editingDayDate, setEditingDayDate]   = useState('')
  const [showPinModal, setShowPinModal]       = useState(false)
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [online, setOnline]                   = useState(navigator.onLine)
  const [downloading, setDownloading]         = useState(false)
  const [dlProgress, setDlProgress]           = useState(null)
  const [editingSections, setEditingSections] = useState(false)
  const [downloaded, setDownloaded]           = useState(() => isDownloaded(projectId))

  const allScenes = project.days.flatMap(d => d.scenes)
  const doneAll   = allScenes.filter(s => s.done).length
  const pct       = allScenes.length ? doneAll / allScenes.length : 0

  // Online / offline detection
  useEffect(() => {
    const up   = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online',  up)
    window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    setDlProgress({ done: 0, total: 1, label: 'Iniciando...' })
    try {
      await downloadProject(projectId, project, prog => setDlProgress(prog))
      setDownloaded(true)
    } catch {
      alert('Error al descargar. Intentá de nuevo con conexión.')
    } finally {
      setDownloading(false)
      setDlProgress(null)
    }
  }

  // Load productora theme
  useEffect(() => {
    if (!project.productoraId) return
    api.getProductora(project.productoraId).then(prod => {
      if (prod?.colorTheme) {
        const t = getTheme(prod.colorTheme)
        setProductoraGrad(t.grad)
        setIsLightTheme(t.light)
      }
    }).catch(() => {})
  }, [project.productoraId])

  // Load active message
  useEffect(() => {
    if (!projectId) return
    api.getDeptData(projectId, '_global', 'msg')
      .then(data => { if (data) setMsg(data) })
      .catch(() => {})
  }, [projectId])

  const togglePin = () => {
    if (pinned) { unpinProject(project.id); setPinned(false) }
    else { pinProject(project); setPinned(true) }
  }

  const postMsg = () => {
    if (!msgDraft.trim()) return
    const m = { id: Date.now(), text: msgDraft.trim(), ts: Date.now(), acks: [] }
    setMsg(m)
    api.saveDeptData(projectId, '_global', 'msg', m).catch(() => {})
    setMsgDraft('')
    setShowMsgForm(false)
  }

  const archiveMsg = async () => {
    if (!msg) return
    try {
      const archive = await api.getDeptData(projectId, '_global', 'msg_archive').catch(() => [])
      await api.saveDeptData(projectId, '_global', 'msg_archive', [...(archive||[]), msg])
      await api.deleteDeptData(projectId, '_global', 'msg')
    } catch {}
    setMsg(null)
  }

  const ackMsg = async (deptKey) => {
    if (!msg) return
    const acks = msg.acks.includes(deptKey) ? msg.acks : [...msg.acks, deptKey]
    const deptKeys = Object.keys(project.depts)
    if (deptKeys.every(k => acks.includes(k))) {
      await archiveMsg()
    } else {
      const updated = { ...msg, acks }
      setMsg(updated)
      api.saveDeptData(projectId, '_global', 'msg', updated).catch(() => {})
    }
  }

  const addDay = () => {
    const num = project.days.length + 1
    const newDay = { id: 'd_' + uid(), label: `Día ${num}`, date: new Date().toISOString().split('T')[0], scenes: [] }
    onUpdateProject({ ...project, days: [...project.days, newDay] })
  }

  const deleteDay = (dayId) =>
    onUpdateProject({ ...project, days: project.days.filter(d => d.id !== dayId) })

  const startEditDay = (day) => {
    setEditingDayId(day.id)
    setEditingDayLabel(day.label)
    setEditingDayDate(day.date)
  }

  const saveEditDay = () => {
    onUpdateProject({
      ...project,
      days: project.days.map(d =>
        d.id === editingDayId ? { ...d, label: editingDayLabel, date: editingDayDate } : d
      )
    })
    setEditingDayId(null)
  }

  const removeDept = (key) => {
    const newDepts = { ...project.depts }
    delete newDepts[key]
    onUpdateProject({ ...project, depts: newDepts })
  }

  const addDept = () => {
    if (!newDeptLabel.trim()) return
    const key = newDeptLabel.toLowerCase().replace(/\s+/g, '_')
    onUpdateProject({
      ...project,
      depts: { ...project.depts, [key]: { label: newDeptLabel, icon: newDeptIcon, color: newDeptColor } }
    })
    setNewDeptLabel(''); setNewDeptIcon('User'); setNewDeptColor('#FF5722')
    setShowAddDept(false)
  }

  const uploadCoverPhoto = async (file) => {
    if (!file) return
    try {
      const blob = await new Promise((res, rej) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let w = img.width, h = img.height, max = 1200
          if (w > max || h > max) { if (w > h) { h = Math.round(h*max/w); w = max } else { w = Math.round(w*max/h); h = max } }
          canvas.width = w; canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0, w, h)
          canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob failed')), 'image/jpeg', 0.75)
        }
        img.onerror = () => rej(new Error('No se pudo leer la imagen'))
        img.src = URL.createObjectURL(file)
      })
      const f2 = new File([blob], 'cover-' + Date.now() + '.jpg', { type: 'image/jpeg' })
      if (window.uploadFileToR2) {
        const { url } = await window.uploadFileToR2(f2)
        onUpdateProject({ ...project, logo: url })
      }
    } catch(err) {
      alert('Error al subir foto: ' + (err.message || err))
    }
  }

  // ── Add dept form ──────────────────────────────────────────────
  if (showAddDept) return (
    <div style={{ minHeight:'100dvh', background:'var(--bg-primary)', display:'flex', flexDirection:'column' }}>
      <div style={{ background:'var(--bg-secondary)', padding:'calc(env(safe-area-inset-top, 0px) + 14px) 20px 18px', borderBottom:'1px solid var(--border-light)', position:'sticky', top:0, zIndex:10 }}>
        <button onClick={() => setShowAddDept(false)} className="tap" style={{ background:'none', border:'none', fontSize:13, color:'var(--text-tertiary)', cursor:'pointer', fontFamily:'inherit', marginBottom:8, padding:0 }}>
          ‹ Volver
        </button>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>Crear espacio de trabajo</div>
      </div>
      <div style={{ flex:1, padding:'20px' }}>
        {[
          { label:'Nombre', value:newDeptLabel, set:setNewDeptLabel, placeholder:'Ej: Cámaras', type:'text' },
          { label:'Ícono Lucide (ej: Camera, Users, Mic)', value:newDeptIcon, set:setNewDeptIcon, placeholder:'User', type:'text' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom:16 }}>
            <label style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'inherit', display:'block', marginBottom:6 }}>{f.label}</label>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
              style={{ width:'100%', fontFamily:'inherit', fontSize:14, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }} />
          </div>
        ))}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12, color:'var(--text-secondary)', fontFamily:'inherit', display:'block', marginBottom:6 }}>Color</label>
          <select value={newDeptColor} onChange={e => setNewDeptColor(e.target.value)}
            style={{ width:'100%', fontFamily:'inherit', fontSize:14, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none' }}>
            {[['#FF5722','Naranja'],['#0052CC','Azul'],['#CCFF00','Lima'],['#FF0080','Rosa'],['#FFA500','Dorado'],['#00D084','Verde']].map(([v,l]) =>
              <option key={v} value={v}>{l}</option>
            )}
          </select>
        </div>
        <button onClick={addDept} style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:700, background:'var(--color-secondary)', color:'#fff', border:'none', borderRadius:10, padding:'12px', cursor:'pointer' }}>
          Crear espacio de trabajo
        </button>
      </div>
    </div>
  )

  // ── Main home view ─────────────────────────────────────────────
  const textColor = isLightTheme ? '#1a1714' : '#fff'
  const subColor  = isLightTheme ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.6)'
  const glass     = isLightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'
  const subGlass  = isLightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)'
  const dimBorder = isLightTheme ? 'rgba(0,0,0,0.1)'  : 'rgba(255,255,255,0.15)'

  return (
    <div style={{ minHeight:'100dvh', background:productoraGrad, display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, overflowY:'auto' }}>

        {/* Header */}
        <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 14px) 20px 14px', position:'sticky', top:0, zIndex:10, background:productoraGrad }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <h1 style={{ fontSize:24, fontWeight:800, color:textColor, fontFamily:'inherit', margin:0, letterSpacing:'-0.5px', flex:1, minWidth:0 }}>
              {editingProjectName ? (
                <input type="text" value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  onBlur={() => { setEditingProjectName(false); onUpdateProject({ ...project, name: newProjectName }) }}
                  onKeyDown={e => { if (e.key==='Enter') { setEditingProjectName(false); onUpdateProject({ ...project, name: newProjectName }) }}}
                  autoFocus
                  style={{ fontFamily:'inherit', fontSize:22, fontWeight:800, border:'none', borderBottom:`2px solid ${isLightTheme ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'}`, borderRadius:0, padding:'2px 0', background:'transparent', color:textColor, outline:'none', width:'100%' }}
                />
              ) : (
                <span onClick={() => isAdmin && setEditingProjectName(true)}
                  style={{ cursor: isAdmin ? 'pointer' : 'default', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>
                  {project.name || project.title || 'Sin nombre'}
                  {isAdmin && <span style={{ fontSize:14, opacity:0.5, marginLeft:6 }}>✏️</span>}
                </span>
              )}
            </h1>
            <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
              <button onClick={() => isAdmin ? onLock() : setShowPinModal(true)} className="tap"
                style={{ background:'rgba(0,0,0,0.2)', border:'none', cursor:'pointer', padding:'6px 8px', borderRadius:8 }}>
                <Icon name={isAdmin ? 'LockOpen' : 'Lock'} size={16} color={textColor}/>
              </button>
              {project.productoraId && (
                <button onClick={() => window.location.href = `/?org=${project.productoraId}`} className="tap"
                  style={{ background:'rgba(0,0,0,0.2)', border:'none', fontSize:11, color:subColor, cursor:'pointer', fontFamily:'inherit', padding:'6px 10px', borderRadius:8 }}>
                  ← Prod
                </button>
              )}
              <button onClick={() => window.location.href = '/'} className="tap"
                style={{ background:'rgba(0,0,0,0.2)', border:'none', cursor:'pointer', padding:'6px 8px', borderRadius:8 }}>
                <Icon name="Home" size={16} color={textColor}/>
              </button>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <div style={{ fontSize:12, color:subColor, fontFamily:'inherit' }}>
              {project.client || ''}{project.client ? ' · ' : ''}
              {project.days.length} días · {project.days.reduce((s,d) => s+d.scenes.length, 0)} escenas
            </div>
            {!online && (
              <span style={{ background:'rgba(255,160,0,0.25)', border:'1px solid rgba(255,160,0,0.5)', borderRadius:6, padding:'2px 7px', fontSize:10, fontWeight:700, color:'#ffb300', fontFamily:'inherit', letterSpacing:'0.04em' }}>
                SIN CONEXIÓN
              </span>
            )}
          </div>
        </div>

        <div style={{ padding:'16px 16px 48px' }}>

          {/* Cover photo */}
          {project.logo ? (
            <div style={{ position:'relative', width:'100%', marginBottom:16, height:200, overflow:'hidden', borderRadius:14 }}>
              <img src={project.logo} alt="Portada"
                style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition: project.logoPosition || 'center' }}/>
              {isAdmin && (
                <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:6 }}>
                  <button onClick={() => setShowCoverPicker(true)} className="tap"
                    style={{ background:'rgba(0,0,0,0.6)', border:'none', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:11, color:'#fff', fontWeight:600, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                    <Icon name="Crop" size={12} color="#fff"/> Ajustar
                  </button>
                  <label className="tap" style={{ background:'rgba(0,0,0,0.6)', borderRadius:8, padding:'5px 10px', cursor:'pointer', fontSize:11, color:'#fff', fontWeight:600, fontFamily:'inherit' }}>
                    <Icon name="Camera" size={12} color="#fff" style={{marginRight:4}}/> Cambiar
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadCoverPhoto(e.target.files[0])}/>
                  </label>
                  <button onClick={() => onUpdateProject({ ...project, logo: '' })}
                    style={{ background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', cursor:'pointer', fontWeight:700, borderRadius:8, padding:'5px 8px' }}>✕</button>
                </div>
              )}
            </div>
          ) : isAdmin ? (
            <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:subGlass, border:`1.5px dashed ${dimBorder}`, borderRadius:14, padding:'32px 20px', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:600, color:subColor, width:'100%', marginBottom:16, boxSizing:'border-box' }}>
              <Icon name="Camera" size={13} color={subColor} style={{marginRight:4}}/> SUBIR FOTO DE PORTADA
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => uploadCoverPhoto(e.target.files[0])}/>
            </label>
          ) : null}

          {/* Descargar para set */}
          <button
            onClick={handleDownload}
            disabled={downloading || !online}
            className="tap"
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', boxSizing:'border-box', background:subGlass, border:`1px solid ${dimBorder}`, borderRadius:12, padding:'11px 14px', cursor: (downloading || !online) ? 'default' : 'pointer', marginBottom:16, opacity: (!online && !downloaded) ? 0.5 : 1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Icon name={downloaded ? 'WifiOff' : 'Download'} size={15} color={subColor} />
              <div style={{ textAlign:'left' }}>
                <div style={{ fontSize:13, fontWeight:700, color:textColor, fontFamily:'inherit' }}>
                  {downloading ? 'Descargando para set...' : downloaded ? 'Disponible sin conexión' : 'Descargar para set'}
                </div>
                <div style={{ fontSize:11, color:subColor, fontFamily:'inherit', marginTop:1 }}>
                  {downloading && dlProgress
                    ? `${dlProgress.label} (${dlProgress.done}/${dlProgress.total})`
                    : downloaded
                      ? `Actualizado ${getDownloadedAt(projectId)?.toLocaleDateString('es-AR') || ''} · Tocá para re-descargar`
                      : 'Guardá el proyecto para usar sin wifi'
                  }
                </div>
              </div>
            </div>
            {downloading && dlProgress ? (
              <div style={{ fontSize:12, fontWeight:700, color:subColor, fontFamily:'inherit', flexShrink:0 }}>
                {Math.round((dlProgress.done / dlProgress.total) * 100)}%
              </div>
            ) : (
              <Icon name="ChevronRight" size={14} color={subColor} />
            )}
          </button>

          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, padding:'0 4px' }}>
            <div style={{ position:'relative', width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <ProgressRing pct={pct*100} size={44} stroke={4} color={isLightTheme ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)'}/>
              <div style={{ position:'absolute', textAlign:'center' }}>
                <div style={{ fontSize:11, fontWeight:700, color:textColor, lineHeight:1 }}>{doneAll}</div>
                <div style={{ fontSize:6, color:subColor }}>/{allScenes.length}</div>
              </div>
            </div>
            <div style={{ fontSize:22, fontWeight:800, color:textColor, lineHeight:1 }}>
              {Math.round(pct*100)}%
              <span style={{ fontSize:10, fontWeight:600, color:subColor, marginLeft:6 }}>completado</span>
            </div>
          </div>

          {/* Chat */}
          <IMessageChat project={project} isAdmin={isAdmin} projectId={projectId}/>

          {/* Broadcast message */}
          {msg ? (
            <div style={{ background:glass, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                <Icon name="Megaphone" size={18} color="rgba(255,255,255,0.9)"/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:10, color:subColor, letterSpacing:'0.08em', marginBottom:3, fontWeight:600 }}>MENSAJE GENERAL</div>
                  <div style={{ fontSize:13, color:textColor, lineHeight:1.5 }}>{msg.text}</div>
                  <div style={{ fontSize:10, color:subColor, marginTop:4 }}>
                    {new Date(msg.ts).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'})}
                  </div>
                </div>
                {isAdmin && (
                  <button onClick={archiveMsg} style={{ background:'none', border:'none', color:subColor, fontSize:16, cursor:'pointer', padding:0 }}>✕</button>
                )}
              </div>
              {Object.keys(project.depts).length > 0 && (
                <div style={{ borderTop:`1px solid ${dimBorder}`, paddingTop:10 }}>
                  <div style={{ fontSize:9, color:subColor, letterSpacing:'0.08em', marginBottom:7, fontWeight:600 }}>ACUSE DE LECTURA</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                    {Object.entries(project.depts).map(([k,m]) => {
                      const acked = msg.acks.includes(k)
                      return (
                        <button key={k} onClick={() => ackMsg(k)}
                          style={{ fontFamily:'inherit', fontSize:10, fontWeight:700, padding:'4px 10px', cursor:'pointer', border:'none', borderRadius:20, background: acked ? 'rgba(255,255,255,0.9)' : subGlass, color: acked ? '#0B7285' : subColor }}>
                          {acked ? '✓ ' : ''}{m.label}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize:10, color:subColor, marginTop:7 }}>
                    {msg.acks.length}/{Object.keys(project.depts).length} departamentos confirmaron
                  </div>
                </div>
              )}
            </div>
          ) : (isAdmin && !showMsgForm && (
            <button onClick={() => setShowMsgForm(true)}
              style={{ width:'100%', fontFamily:'inherit', fontSize:13, fontWeight:600, color:subColor, background:glass, border:`1px dashed ${dimBorder}`, borderRadius:14, padding:'13px 16px', cursor:'pointer', marginBottom:16, textAlign:'left', display:'flex', alignItems:'center', gap:6 }}>
              <Icon name="Megaphone" size={13} color={subColor}/> Escribir mensaje general
            </button>
          ))}
          {isAdmin && showMsgForm && (
            <div style={{ background:'rgba(0,0,0,0.18)', borderRadius:14, padding:16, marginBottom:16 }}>
              <textarea value={msgDraft} onChange={e => setMsgDraft(e.target.value)} placeholder="Mensaje para el equipo..." rows={3} autoFocus
                style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:subGlass, border:`1px solid ${dimBorder}`, borderRadius:10, padding:'10px 12px', color:textColor, outline:'none', resize:'none', marginBottom:10, boxSizing:'border-box' }}/>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => { setShowMsgForm(false); setMsgDraft('') }}
                  style={{ flex:1, fontFamily:'inherit', fontSize:12, fontWeight:600, background:subGlass, color:subColor, border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Cancelar</button>
                <button onClick={postMsg}
                  style={{ flex:2, fontFamily:'inherit', fontSize:12, fontWeight:700, background:'rgba(255,255,255,0.9)', color:'#0B7285', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Publicar</button>
              </div>
            </div>
          )}

          {/* Weather */}
          <div style={{ marginBottom:24 }}>
            <WeatherWidget project={project} isAdmin={isAdmin} onUpdateProject={onUpdateProject} projectId={projectId}/>
          </div>

          {/* Departments */}
          {Object.keys(project.depts).length > 0 && (
            <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontSize:10, color:subColor, letterSpacing:'0.12em', fontFamily:'inherit', fontWeight:600 }}>DEPARTAMENTOS</div>
                {isAdmin && (
                  <button onClick={() => setShowAddDept(true)} className="tap"
                    style={{ fontFamily:'inherit', fontSize:11, color:subColor, background:glass, border:'none', borderRadius:20, padding:'4px 12px', cursor:'pointer', fontWeight:600 }}>
                    + Agregar
                  </button>
                )}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(72px, 1fr))', gap:16 }}>
                {Object.entries(project.depts)
                  .map(([k,m]) => {
                    const ORDER = ['produccion','direccion','locaciones','arte','fotografia','camara','drone','sonido']
                    const idx = ORDER.indexOf(k)
                    return { key:k, meta:m, sortIdx: idx >= 0 ? idx : 999 + Object.keys(project.depts).indexOf(k) }
                  })
                  .sort((a,b) => a.sortIdx - b.sortIdx)
                  .map(({ key:k, meta:m }) => (
                    <div key={k} style={{ cursor:'pointer', position:'relative' }}>
                      <svg viewBox="0 0 120 100" style={{ height:60, width:'100%', marginBottom:5 }} onClick={() => onSelectDept(k)}>
                        <path d="M 10 30 L 35 30 L 40 18 L 10 18 Z" fill={m.color||'#F97316'} stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
                        <path d="M 10 28 L 10 85 Q 10 90 15 90 L 105 90 Q 110 90 110 85 L 110 35 Q 110 30 105 30 L 40 30 L 35 18 Q 35 15 30 15 L 15 15 Q 10 15 10 18 Z" fill={m.color||'#F97316'} stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
                        <path d="M 10 30 L 110 30 L 110 38 Q 60 44 10 38 Z" fill="rgba(255,255,255,0.15)" stroke="none"/>
                        <foreignObject x="35" y="42" width="50" height="50">
                          <div xmlns="http://www.w3.org/1999/xhtml" style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%' }}>
                            <Icon name={m.icon||'Clapperboard'} size={26} color="rgba(255,255,255,0.9)"/>
                          </div>
                        </foreignObject>
                      </svg>
                      <div style={{ fontSize:9, fontWeight:700, color:textColor, textAlign:'center', letterSpacing:'0.01em', lineHeight:1.2 }}>{m.label}</div>
                      {isAdmin && (
                        <button onClick={() => removeDept(k)}
                          style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'1.5px solid rgba(255,255,255,0.4)', color:'#fff', fontSize:10, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5 }}>
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Days */}
          <div style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ fontSize:10, color:subColor, letterSpacing:'0.12em', fontFamily:'inherit', fontWeight:600 }}>DÍAS DE RODAJE</div>
                {isAdmin && (
                  <button onClick={addDay} className="tap"
                    style={{ fontFamily:'inherit', fontSize:11, color:subColor, background:glass, border:'none', borderRadius:20, padding:'4px 12px', cursor:'pointer', fontWeight:600 }}>
                    + Agregar día
                  </button>
                )}
              </div>
              {project.days.length === 0 && (
                <div style={{ textAlign:'center', padding:'28px 20px', background:glass, borderRadius:14, border:`1px dashed ${dimBorder}` }}>
                  <div style={{ fontSize:13, color:subColor, fontFamily:'inherit', marginBottom:12 }}>No hay días de rodaje aún</div>
                  {isAdmin && (
                    <button onClick={addDay} className="tap"
                      style={{ fontFamily:'inherit', fontSize:13, fontWeight:700, background:'rgba(255,255,255,0.2)', color:textColor, border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer' }}>
                      + Crear primer día
                    </button>
                  )}
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column' }}>
                {project.days.map((day, i) => {
                  const d = day.scenes.filter(s=>s.done).length
                  const p = day.scenes.length ? d/day.scenes.length : 0
                  const isEditing = editingDayId === day.id
                  const total = project.days.length
                  const radius = i===0 ? '12px 12px 0 0' : i===total-1 ? '0 0 12px 12px' : '0'

                  if (isEditing && isAdmin) return (
                    <div key={day.id} style={{ background:'var(--bg-secondary)', borderRadius:14, padding:16, border:'2px solid rgba(255,255,255,0.3)', marginBottom:8 }}>
                      <div style={{ fontSize:11, color:'var(--text-secondary)', letterSpacing:'0.08em', marginBottom:12, fontWeight:700 }}>EDITAR DÍA</div>
                      <input value={editingDayLabel} onChange={e => setEditingDayLabel(e.target.value)} placeholder="Nombre del día"
                        style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:8 }}/>
                      <input type="date" value={editingDayDate} onChange={e => setEditingDayDate(e.target.value)}
                        style={{ width:'100%', fontFamily:'inherit', fontSize:13, background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:10, padding:'10px 12px', color:'var(--text-primary)', outline:'none', marginBottom:12 }}/>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => setEditingDayId(null)} style={{ flex:1, fontFamily:'inherit', fontSize:12, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:10, padding:'10px', cursor:'pointer', fontWeight:700 }}>Cancelar</button>
                        <button onClick={saveEditDay} style={{ flex:1, fontFamily:'inherit', fontSize:12, fontWeight:700, background:'rgba(255,255,255,0.9)', color:'#0B7285', border:'none', borderRadius:10, padding:'10px', cursor:'pointer' }}>Guardar</button>
                      </div>
                    </div>
                  )

                  return (
                    <div key={day.id} style={{ position:'relative' }}>
                      <button onClick={() => onSelectDay(day.id)} className="tap"
                        style={{ display:'flex', alignItems:'center', gap:12, background:glass, padding:'13px 14px', border:'none', borderBottom:`1px solid ${dimBorder}`, cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', borderRadius:radius }}>
                        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(0,0,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <span style={{ fontSize:15, fontWeight:700, color:'#fff' }}>{i+1}</span>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:14, fontWeight:700, color:textColor }}>{day.label}</div>
                          <div style={{ fontSize:11, color:subColor, marginBottom:5 }}>{day.date} · {day.scenes.length} escenas</div>
                          <div style={{ background:subGlass, height:3, borderRadius:3, overflow:'hidden' }}>
                            <div style={{ background: isLightTheme ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.85)', height:'100%', width:`${p*100}%`, borderRadius:3 }}/>
                          </div>
                        </div>
                        <span style={{ fontSize:18, color:subColor, fontWeight:300 }}>›</span>
                      </button>
                      {isAdmin && (
                        <div style={{ position:'absolute', top:-6, right:-6, display:'flex', gap:4, zIndex:5 }}>
                          <button onClick={() => startEditDay(day)} style={{ width:22, height:22, borderRadius:'50%', background:subGlass, border:`1.5px solid ${dimBorder}`, color:textColor, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✎</button>
                          <button onClick={() => deleteDay(day.id)} style={{ width:22, height:22, borderRadius:'50%', background:subGlass, border:`1.5px solid ${dimBorder}`, color:textColor, fontSize:11, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          {/* Action grid */}
          {(() => {
            const hiddenSections = project.hiddenSections || []
            const toggleSection = (key) => {
              const curr = project.hiddenSections || []
              const next = curr.includes(key) ? curr.filter(k => k !== key) : [...curr, key]
              onUpdateProject({ ...project, hiddenSections: next })
            }
            const allSections = [
              { key:'dropbox',     onClick:onOpenDropbox,    icon:'FolderOpen', label:'Dropbox',      sub:'Archivos del proyecto' },
              { key:'citaciones',  onClick:onOpenCitaciones, icon:'Clock',      label:'Citaciones',   sub:'Horarios de los deptos' },
              { key:'mensajes',    onClick:onOpenMessages,   icon:'Mail',       label:'Mensajes',     sub:'Comunicaciones' },
              { key:'scouting',    onClick:onOpenScouting,   icon:'Map',        label:'Scouting',     sub:'Locaciones y fotos' },
              { key:'herramientas',onClick:onOpenTools,      icon:'Wrench',     label:'Herramientas', sub:'Sun AR, Color Temp' },
            ]
            const visibleSections = editingSections ? allSections : allSections.filter(s => !hiddenSections.includes(s.key))
            return (
              <>
                {isAdmin && (
                  <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
                    <button onClick={() => setEditingSections(e => !e)}
                      style={{ background: editingSections ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)', border:'none', borderRadius:10, padding:'5px 12px', fontSize:11, fontWeight:700, color:textColor, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
                      <Icon name={editingSections ? 'Check' : 'Settings2'} size={12} color={textColor} />
                      {editingSections ? 'Listo' : 'Secciones'}
                    </button>
                  </div>
                )}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                  {visibleSections.map(a => {
                    const isHidden = hiddenSections.includes(a.key)
                    return (
                      <button key={a.key}
                        onClick={editingSections ? () => toggleSection(a.key) : a.onClick}
                        className="tap"
                        style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, background: isHidden && editingSections ? 'rgba(0,0,0,0.15)' : glass, borderRadius:14, padding:'18px 8px', border: editingSections ? `2px solid ${isHidden ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.35)'}` : 'none', cursor:'pointer', fontFamily:'inherit', textAlign:'center', opacity: isHidden && editingSections ? 0.5 : 1 }}>
                        <Icon name={a.icon} size={22} color={textColor}/>
                        <div style={{ fontSize:12, fontWeight:600, color:textColor }}>{a.label}</div>
                        <div style={{ fontSize:10, color:subColor }}>{a.sub}</div>
                        {editingSections && (
                          <div style={{ position:'absolute', top:6, right:6, width:18, height:18, borderRadius:'50%', background: isHidden ? 'rgba(255,255,255,0.15)' : 'rgba(80,200,120,0.85)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <Icon name={isHidden ? 'EyeOff' : 'Eye'} size={10} color="#fff" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                  <button onClick={togglePin} className="tap"
                    style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, background: pinned ? subGlass : glass, borderRadius:14, padding:'18px 8px', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
                    <Icon name={pinned?'PinOff':'Pin'} size={22} color={textColor}/>
                    <div style={{ fontSize:12, fontWeight:600, color:textColor }}>{pinned?'Pineado':'Pinear'}</div>
                    <div style={{ fontSize:10, color:subColor }}>{pinned?'Quitar del inicio':'Acceso directo'}</div>
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={onExport} className="tap" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, background:glass, borderRadius:14, padding:'18px 8px', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
                        <Icon name="FileText" size={22} color={textColor}/>
                        <div style={{ fontSize:12, fontWeight:600, color:textColor }}>Exportar PDF</div>
                        <div style={{ fontSize:10, color:subColor }}>Resumen completo</div>
                      </button>
                      {onNewProject && (
                        <button onClick={onNewProject} className="tap" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6, background:glass, borderRadius:14, padding:'18px 8px', border:'none', cursor:'pointer', fontFamily:'inherit', textAlign:'center' }}>
                          <Icon name="PlusCircle" size={22} color={textColor}/>
                          <div style={{ fontSize:12, fontWeight:600, color:textColor }}>Nuevo proyecto</div>
                          <div style={{ fontSize:10, color:subColor }}>Crear rodaje</div>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )
          })()}

        </div>
      </div>

      {showPinModal && (
        <PinModal
          title="Desbloquear edición"
          subtitle="Ingresá la contraseña del proyecto"
          correctPin={project.pin || '1234'}
          pinHash={project.pinHash}
          onSuccess={() => {
            setShowPinModal(false)
            onUnlock()
          }}
          onCancel={() => setShowPinModal(false)}
        />
      )}

      {showCoverPicker && (
        <CoverPositionPicker
          src={project.logo}
          initial={project.logoPosition}
          onSave={(pos) => {
            onUpdateProject({ ...project, logoPosition: pos })
            setShowCoverPicker(false)
          }}
          onCancel={() => setShowCoverPicker(false)}
        />
      )}
    </div>
  )
}
