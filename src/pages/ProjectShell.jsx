/**
 * Project shell — loads a project and manages navigation between views.
 * This is the top-level container for all project-scoped views.
 */

import { useState, lazy, Suspense } from 'react'
import { useProject } from '../hooks/useProject'
import { LoadingScreen, NotFoundScreen } from '../components/ui/LoadingScreen'
import { db } from '../services/db'
import { SEED_PROJECT } from '../constants/seed'

// Lazy-load heavy views
const HomeView         = lazy(() => import('../features/home/HomeView'))
const DayView          = lazy(() => import('../features/scenes/DayView'))
const SceneView        = lazy(() => import('../features/scenes/SceneView'))
const DeptDetailView   = lazy(() => import('../features/dept/DeptDetailView'))
const ExportView       = lazy(() => import('../features/export/ExportView'))
const ScoutingView     = lazy(() => import('../features/scouting/ScoutingView'))
const ToolsMenuView    = lazy(() => import('../features/tools/ToolsMenuView'))
const CitacionesView   = lazy(() => import('../features/citaciones/CitacionesGlobalesView'))
const MessagesView     = lazy(() => import('../features/messaging/MessagesView'))
const DropboxView      = lazy(() => import('../features/dropbox/DropboxView'))

/** @param {{ projectId: string }} props */
export default function ProjectShell({ projectId }) {
  const isDemo = projectId === 'proj_demo'
  const { project: loadedProject, loading, error, save: saveProject } = useProject(isDemo ? null : projectId)

  const project = isDemo ? SEED_PROJECT : loadedProject

  const [view, setView]           = useState('home')
  const [activeDayId, setDayId]   = useState(null)
  const [activeSceneId, setSceneId] = useState(null)
  const [activeDeptKey, setDeptKey] = useState(null)
  const [isAdmin, setIsAdmin]     = useState(false)
  const [theme, setTheme]         = useState(() => localStorage.getItem('pdr:theme') || 'light')

  const save = (data) => {
    if (!isDemo) saveProject(data)
  }

  const changeTheme = (t) => {
    setTheme(t)
    localStorage.setItem('pdr:theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  if (loading) return <LoadingScreen text="Cargando proyecto..." />
  if (error || !project) return <NotFoundScreen />

  const activeDay   = project.days?.find(d => d.id === activeDayId)
  const activeScene = activeDay?.scenes?.find(s => s.id === activeSceneId)
  const depts       = project.depts || {}

  const nav = {
    goHome:    () => setView('home'),
    goDay:     (id) => { setDayId(id);   setView('day') },
    goScene:   (id) => { setSceneId(id); setView('scene') },
    goDept:    (key) => { setDeptKey(key); setView('dept') },
    goExport:  () => setView('export'),
    goScouting: () => setView('scouting'),
    goTools:   () => setView('tools'),
    goCitaciones: () => setView('citaciones'),
    goMessages: () => setView('messages'),
    goDropbox: () => setView('dropbox'),
  }

  const commonProps = { project, isAdmin, save, depts, projectId }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]" data-theme={theme}>
      <Suspense fallback={<LoadingScreen />}>
        {view === 'home' && (
          <HomeView
            {...commonProps}
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
          <DayView
            {...commonProps}
            day={activeDay}
            dayIndex={project.days.indexOf(activeDay)}
            onBack={nav.goHome}
            onSelectScene={nav.goScene}
          />
        )}

        {view === 'scene' && activeScene && (
          <SceneView
            {...commonProps}
            scene={activeScene}
            onBack={() => setView('day')}
          />
        )}

        {view === 'dept' && activeDeptKey && (
          <DeptDetailView
            {...commonProps}
            deptKey={activeDeptKey}
            deptMeta={depts[activeDeptKey] || { label: activeDeptKey, icon: 'FolderOpen', color: '#888' }}
            onBack={nav.goHome}
          />
        )}

        {view === 'export'     && <ExportView    {...commonProps} onBack={nav.goHome} />}
        {view === 'scouting'   && <ScoutingView  {...commonProps} onBack={nav.goHome} />}
        {view === 'tools'      && <ToolsMenuView {...commonProps} onBack={nav.goHome} />}
        {view === 'citaciones' && <CitacionesView {...commonProps} onBack={nav.goHome} />}
        {view === 'messages'   && <MessagesView  {...commonProps} onBack={nav.goHome} />}
        {view === 'dropbox'    && <DropboxView   {...commonProps} onBack={nav.goHome} />}
      </Suspense>
    </div>
  )
}
