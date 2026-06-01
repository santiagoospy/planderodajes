import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { TabBar } from '../../components/ui/TabBar'
import { DeptAvatar } from '../../components/ui/DeptAvatar'
import { DAY_COLORS, DEPT_SECTION_OPTIONS, TABS_BY_DEPT, DEFAULT_TABS } from '../../constants/depts'

// Sub-tab imports
import InfoTab           from './tabs/InfoTab'
import ChecklistTab      from './tabs/ChecklistTab'
import GastosTab         from './tabs/GastosTab'
import GastosTabSimple   from './tabs/GastosTabSimple'
import CitacionesTab     from './tabs/CitacionesTab'
import DeptMuralTab      from './tabs/DeptMuralTab'
import IntegrantesTab    from './tabs/IntegrantesTab'
import CrewTotalTab      from './tabs/CrewTotalTab'
import RentalTab         from './tabs/RentalTab'
import TarjetasTab       from './tabs/TarjetasTab'
import ChecklistEquipoTab from './tabs/ChecklistEquipoTab'
import PedidosTab        from './tabs/PedidosTab'
import ADComentariosTab  from './tabs/ADComentariosTab'
import LocacionesTab     from './tabs/LocacionesTab'
import CastingTab        from './tabs/CastingTab'
import CateringTab       from './tabs/CateringTab'
import ContinuidadNotasTab from './tabs/ContinuidadNotasTab'
import ContinuidadFotosTab from './tabs/ContinuidadFotosTab'

// Tab key → section key mapping (for section filtering)
const TAB_TO_SECTION = {
  info:'info', checklist:'checklist', gastos:'gastos', citaciones:'citaciones',
  mural:'mural', integrantes:'integrantes', adcomentarios:'info',
  crew_total:'integrantes', rental:'info', elenco:'checklist',
  menu:'integrantes', tarjetas:'checklist', checklist_equipo:'checklist',
  locaciones:'info', continuidad_notas:'checklist', continuidad_fotos:'mural',
}

export default function DeptDetailView({
  deptKey, deptMeta, isAdmin, onBack,
  projectId, project, save,
  onSelectSceneFromDept,
}) {
  const color = deptMeta.color || '#888'
  const onUpdateProject = save

  // Determine tabs for this dept
  const labelClean = (deptMeta.label||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim()
  const isCamara   = deptKey === 'camara' || labelClean === 'camara'
  const defaultTabs = TABS_BY_DEPT[deptKey] || (isCamara ? TABS_BY_DEPT.camara : null) || DEFAULT_TABS

  const deptSections = deptMeta.sections || null
  const tabs = deptSections
    ? defaultTabs.filter(([k]) => { const s = TAB_TO_SECTION[k]; return !s || deptSections.includes(s) })
    : defaultTabs

  const [tab, setTab] = useState(tabs[0][0])
  const [showManageSections, setShowManageSections] = useState(false)

  const handleTabChange = (newTab) => setTab(newTab)

  // Scenes assigned to this dept
  const misEscenas = project
    ? project.days.flatMap((d, di) =>
        d.scenes
          .filter(s => (s.depts||[]).includes(deptKey))
          .map(s => ({ ...s, dayLabel:d.label, dayColor:DAY_COLORS[di % DAY_COLORS.length] }))
      )
    : []

  const updateDeptMeta = (updates) => {
    if (!onUpdateProject) return
    onUpdateProject({ ...project, depts: { ...project.depts, [deptKey]: { ...deptMeta, ...updates } } })
  }

  const tabProps = { color, deptKey, deptMeta, projectId, project, isAdmin, onUpdateProject }

  return (
    <div style={{ minHeight:'100dvh', background:'transparent', display:'flex', flexDirection:'column' }} className="slide-r">

      {/* Header */}
      <div className="theme-surface" style={{ padding:'calc(env(safe-area-inset-top,0px) + 14px) 20px 0', borderBottom:'1px solid var(--border-light)', position:'sticky', top:0, zIndex:10 }}>
        <button onClick={onBack} className="tap"
          style={{ background:'none', border:'none', fontSize:13, color:'var(--text-tertiary)', cursor:'pointer', fontFamily:'inherit', marginBottom:10, padding:0 }}>
          ‹ Volver
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
          <DeptAvatar
            photo={deptMeta.photo}
            icon={deptMeta.icon}
            color={color}
            size={48} borderRadius={14} fontSize={26}
            editable={!!onUpdateProject}
            onUpload={(photo) => updateDeptMeta({ photo })}
          />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit' }}>{deptMeta.label}</div>
            <div style={{ fontSize:11, color:'#aaa', fontFamily:'inherit', letterSpacing:'0.06em' }}>
              DEPARTAMENTO · {misEscenas.length} escenas asignadas
            </div>
          </div>
          {isAdmin && (
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <button onClick={() => setShowManageSections(true)}
                style={{ fontSize:10, color:'#aaa', background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:20, padding:'3px 10px', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
                <Icon name="Settings2" size={11} color="#aaa"/> Secciones
              </button>
              <div style={{ fontSize:11, color, fontFamily:'inherit', background:`${color}15`, borderRadius:20, padding:'4px 10px', border:`1px solid ${color}33` }}>
                ADMIN
              </div>
            </div>
          )}
        </div>

        <TabBar tabs={tabs} active={tab} onChange={handleTabChange} color={color}/>
      </div>

      {/* Manage sections modal */}
      {showManageSections && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:600, display:'flex', alignItems:'flex-end' }}
          onClick={() => setShowManageSections(false)}>
          <div style={{ background:'var(--bg-elevated)', borderRadius:'20px 20px 0 0', width:'100%', padding:'20px 20px 32px', maxHeight:'85vh', overflowY:'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
              <div style={{ width:36, height:4, background:'#e0ddd8', borderRadius:2 }}/>
            </div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text-primary)', fontFamily:'inherit', marginBottom:4 }}>
              Secciones de {deptMeta.label}
            </div>
            <div style={{ fontSize:12, color:'#aaa', fontFamily:'inherit', marginBottom:16 }}>
              Elegí qué secciones mostrar en este departamento
            </div>
            {DEPT_SECTION_OPTIONS.map(opt => {
              const current = deptMeta.sections || ['checklist','gastos','citaciones','mural','integrantes','info']
              const sel = current.includes(opt.key)
              return (
                <div key={opt.key}
                  onClick={() => {
                    const newSections = sel ? current.filter(k=>k!==opt.key) : [...current, opt.key]
                    if (newSections.length === 0) return
                    updateDeptMeta({ sections: newSections })
                  }}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12, cursor:'pointer', background:sel?`${color}12`:'var(--bg-card)', border:`1px solid ${sel?`${color}44`:'var(--border-light)'}`, marginBottom:8 }}>
                  <div style={{ width:24, height:24, borderRadius:7, background:sel?color:'transparent', border:sel?'none':`2px solid ${color}66`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {sel && <Icon name="Check" size={13} color="#fff" strokeWidth={3}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:700, color:sel?color:'var(--text-primary)', fontFamily:'inherit' }}>{opt.label}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)', fontFamily:'inherit' }}>{opt.desc}</div>
                  </div>
                </div>
              )
            })}
            <button onClick={() => setShowManageSections(false)}
              style={{ width:'100%', fontFamily:'inherit', fontSize:14, fontWeight:700, background:color, color:'#fff', border:'none', borderRadius:14, padding:'14px', cursor:'pointer', marginTop:8 }}>
              Listo
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      <div style={{ flex:1, padding:'20px 16px 80px' }}>

        {/* Info tab also shows assigned scenes */}
        {tab === 'info' && (
          <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
            <InfoTab {...tabProps}/>
            {misEscenas.length > 0 && (
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:12, fontFamily:'inherit' }}>
                  MIS ESCENAS ({misEscenas.length})
                </div>
                {misEscenas.map(scene => (
                  <button key={scene.id}
                    onClick={() => onSelectSceneFromDept && onSelectSceneFromDept(scene)}
                    className="tap"
                    style={{ display:'flex', alignItems:'center', gap:14, background:'var(--bg-secondary)', borderRadius:14, padding:'14px 16px', marginBottom:10, border:`1px solid ${scene.dayColor}25`, cursor:'pointer', fontFamily:'inherit', textAlign:'left', width:'100%', opacity:scene.done?0.6:1 }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:`${scene.dayColor}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:scene.dayColor, fontFamily:'inherit' }}>{scene.num}</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:11, color:scene.dayColor, fontWeight:700, letterSpacing:'0.06em', marginBottom:2 }}>{scene.dayLabel}</div>
                      <div style={{ fontSize:14, fontWeight:700, color:scene.done?'#aaa':'var(--text-primary)', lineHeight:1.3, textDecoration:scene.done?'line-through':'none' }}>{scene.title}</div>
                      {scene.notes && (
                        <div style={{ fontSize:11, color:'#aaa', marginTop:3, display:'flex', alignItems:'center', gap:4 }}>
                          <Icon name="FileText" size={11} color="#aaa"/> {scene.notes}
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
                      <Icon name={scene.done?'CheckCircle':'Circle'} size={22} color={scene.done?'#0fa87e':'#ccc'}/>
                      <span style={{ fontSize:18, color:'#ccc' }}>›</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'checklist'        && <ChecklistTab       {...tabProps}/>}
        {tab === 'gastos'           && deptKey === 'produccion' && <GastosTab {...tabProps} requirePin={true}/>}
        {tab === 'gastos'           && deptKey !== 'produccion' && <GastosTabSimple {...tabProps}/>}
        {tab === 'citaciones'       && <CitacionesTab      {...tabProps}/>}
        {tab === 'mural'            && <DeptMuralTab       {...tabProps}/>}
        {tab === 'integrantes'      && <IntegrantesTab     {...tabProps}/>}
        {tab === 'crew_total'       && <CrewTotalTab       {...tabProps}/>}
        {tab === 'rental'           && <RentalTab          {...tabProps}/>}
        {tab === 'tarjetas'         && <TarjetasTab        {...tabProps} isDrone={deptKey==='drone'}/>}
        {tab === 'checklist_equipo' && <ChecklistEquipoTab {...tabProps}/>}
        {tab === 'pedidos'          && <PedidosTab         {...tabProps}/>}
        {tab === 'adcomentarios'    && <ADComentariosTab   {...tabProps}/>}
        {tab === 'locaciones'       && <LocacionesTab      {...tabProps}/>}
        {tab === 'elenco'           && <CastingTab         {...tabProps}/>}
        {tab === 'menu'             && <CateringTab        {...tabProps}/>}
        {tab === 'continuidad_notas'&& <ContinuidadNotasTab {...tabProps}/>}
        {tab === 'continuidad_fotos'&& <ContinuidadFotosTab {...tabProps}/>}
      </div>

      {/* Bottom bar */}
      <div className="theme-surface" style={{ position:'sticky', bottom:0, borderTop:'1px solid var(--border-light)', padding:'8px 20px calc(env(safe-area-inset-bottom,0px) + 8px)', display:'flex', alignItems:'center', gap:12, zIndex:10 }}>
        <button onClick={onBack} className="tap"
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', padding:'4px 20px', borderRadius:12, color:'var(--text-secondary)', fontFamily:'inherit', minWidth:72 }}>
          <Icon name="ChevronLeft" size={20} color="var(--text-secondary)"/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em' }}>INICIO</span>
        </button>
        <div style={{ width:1, height:36, background:'var(--border-light)' }}/>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, padding:'4px 20px', color, fontFamily:'inherit', minWidth:72 }}>
          <Icon name={deptMeta.icon||'Clapperboard'} size={20} color={color}/>
          <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.04em', maxWidth:80, textAlign:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {deptMeta.label?.toUpperCase()?.slice(0,10)}
          </span>
        </div>
      </div>
    </div>
  )
}
