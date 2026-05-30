/**
 * Project shell — loads a project and manages navigation between views.
 */

import { useState, lazy, Suspense } from 'react'
import { useProject } from '../hooks/useProject'
import { LoadingScreen, NotFoundScreen } from '../components/ui/LoadingScreen'
import { SEED_PROJECT } from '../constants/seed'

const HomeView       = lazy(() => import('../features/home/HomeView'))
const DayView        = lazy(() => import('../features/scenes/DayView'))
const SceneView      = lazy(() => import('../features/scenes/SceneView'))
const DeptDetailView = lazy(() => import('../features/dept/DeptDetailView'))
const ExportView     = lazy(() => import('../features/export/ExportView'))
const ScoutingView   = lazy(() => import('../features/scouting/ScoutingView'))
const ToolsMenuView  = lazy(() => import('../features/tools/ToolsMenuView'))
const CitacionesView = lazy(() => import('../features/citaciones/CitacionesGlobalesView'))
const MessagesView   = lazy(() => import('../features/messaging/MessagesView'))
const DropboxView    = lazy(() => import('../features/dropbox/DropboxView'))

// Demo project — renders immediately with seed data, no API call
function DemoShell() {
  return <ProjectViews project={SEED_PROJECT} projectId="proj_demo" isAdmin={false} save={() => {}} />
}

// Real project — fetches from API
function LiveShell({ projectId }) {
  const { project, loading, error, save } = useProject(projectId)
  if (loading) return <LoadingScreen text="Cargando proyecto..." />
  if (error || !project) return <NotFoundScreen />
  return <ProjectViews project={project} projectId={projectId} isAdmin={false} save={save} />
}

/** @param {{ projectId: string }} props */
export default function ProjectShell({ projectId }) {
  if (projectId === 'proj_demo') return <DemoShell />
  return <LiveShell projectId={projectId} />
}

// ─── Shared view router ──────────────────────────────────────────
function ProjectViews({ project, projectId, save }) {
  const [view, setView]             = useState('home')
  const [activeDayId, setDayId]     = useState(null)
  const [activeSceneId, setSceneId] = useState(null)
  const [activeDeptKey, setDeptKey] = useState(null)
  const [isAdmin, setIsAdmin]       = useState(false)
  const [theme, setTheme]           = useState(() => localStorage.getItem('pdr:theme') || 'light')

  const changeTheme = (t) => {
    setTheme(t)
    localStorage.setItem('pdr:theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  const depts    = project.depts || {}
  const activeDay   = project.days?.find(d => d.id === activeDayId)
  const activeScene = activeDay?.scenes?.find(s => s.id === activeSceneId)

  const nav = {
    goHome:       () => setView('home'),
    goDay:        (id) => { setDayId(id);   setView('day') },
    goScene:      (id) => { setSceneId(id); setView('scene') },
    goDept:       (key) => { setDeptKey(key); setView('dept') },
    goExport:     () => setView('export'),
    goScouting:   () => setView('scouting'),
    goTools:      () => setView('tools'),
    goCitaciones: () => setView('citaciones'),
    goMessages:   () => setView('messages'),
    goDropbox:    () => setView('dropbox'),
  }

  const common = { project, isAdmin, save, depts, projectId }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" data-theme={theme}>
      <Suspense fallback={<LoadingScreen />}>
        {view === 'home' && (
          <HomeView
            {...common}
            theme={theme} setTheme={changeTheme}
            onSelectDay={nav.goDay}
            onSelectDept={nav.goDept}
            onExport={nav.goExport}
            onOpenScouting={nav.goScouting}
            onOpenTools={nav.goTools}
            onOpenCitaciones={nav.goCitaciones}
            onOpenMessages={nav.goMessages}
            onOpenDropbox={nav.goDropbox}
            onLock={() => setIsAdmin(false)}
            onUnlock={() => setIsAdmin(true)}
          />
        )}
        {view === 'day' && activeDay && (
          <DayView {...common} day={activeDay} dayIndex={project.days.indexOf(activeDay)}
            onBack={nav.goHome} onSelectScene={nav.goScene} />
        )}
        {view === 'scene' && activeScene && (
          <SceneView {...common} scene={activeScene} onBack={() => setView('day')} />
        )}
        {view === 'dept' && activeDeptKey && (
          <DeptDetailView {...common} deptKey={activeDeptKey}
            deptMeta={depts[activeDeptKey] || { label: activeDeptKey, icon: 'FolderOpen', color: '#888' }}
            onBack={nav.goHome} />
        )}
        {view === 'export'     && <ExportView    {...common} onBack={nav.goHome} />}
        {view === 'scouting'   && <ScoutingView  {...common} onBack={nav.goHome} />}
        {view === 'tools'      && <ToolsMenuView {...common} onBack={nav.goHome} />}
        {view === 'citaciones' && <CitacionesView {...common} onBack={nav.goHome} />}
        {view === 'messages'   && <MessagesView  {...common} onBack={nav.goHome} />}
        {view === 'dropbox'    && <DropboxView   {...common} onBack={nav.goHome} />}
      </Suspense>
    </div>
  )
}
