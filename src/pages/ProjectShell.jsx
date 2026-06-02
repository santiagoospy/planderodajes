import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useProject } from '../hooks/useProject'
import { LoadingScreen, NotFoundScreen } from '../components/ui/LoadingScreen'
import { SEED_PROJECT } from '../constants/seed'
import { getTheme, getThemeVars } from '../constants/themes'
import { api } from '../services/api'
import { uid } from '../utils/uid'

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

// DemoShell loads from API (recovers saved user data), falls back to SEED_PROJECT
function DemoShell() {
  const { project, loading, save } = useProject('proj_demo')
  if (loading) return <LoadingScreen text="Cargando proyecto..." />
  return <ProjectViews project={project || SEED_PROJECT} projectId="proj_demo" save={save} />
}

function LiveShell({ projectId }) {
  const { project, loading, error, save } = useProject(projectId)
  if (loading) return <LoadingScreen text="Cargando proyecto..." />
  if (error || !project) return <NotFoundScreen />
  return <ProjectViews project={project} projectId={projectId} save={save} />
}

export default function ProjectShell({ projectId }) {
  if (projectId === 'proj_demo') return <DemoShell />
  return <LiveShell projectId={projectId} />
}

function ProjectViews({ project, projectId, save }) {
  const [view, setView]             = useState('home')
  const [activeDayId, setDayId]     = useState(null)
  const [activeSceneId, setSceneId] = useState(null)
  const [activeDeptKey, setDeptKey] = useState(null)
  const [isAdmin, setIsAdmin]       = useState(false)
  const [theme, setTheme]           = useState(() => localStorage.getItem('pdr:theme') || 'light')
  const [localProject, setLocalProject] = useState(project)
  const [themeKey, setThemeKey]         = useState('celeste')

  // Load the productora's chosen color theme so the WHOLE project
  // (home, depts, scenes, scouting, citaciones, messages, tools…)
  // shares the same gradient background and palette. Changing the
  // productora color re-skins everything from here.
  useEffect(() => {
    if (!project.productoraId) return
    api.getProductora(project.productoraId)
      .then(prod => { if (prod?.colorTheme) setThemeKey(prod.colorTheme) })
      .catch(() => {})
  }, [project.productoraId])

  const themeObj   = getTheme(themeKey)
  const themeGrad  = themeObj.grad
  const themeLight = themeObj.light
  const accentColor = themeObj.accent
  const themeVars  = getThemeVars(themeKey)

  // Track whether admin has made changes this session.
  // Once true, we stop auto-syncing from the server prop so stale API
  // responses don't revert the user's edits on lock.
  const adminChangedRef = useRef(false)

  // Sync localProject when the server/parent project prop changes,
  // but only if the admin hasn't made local edits yet.
  useEffect(() => {
    if (!adminChangedRef.current) {
      setLocalProject(project)
    }
  }, [project])

  const updateProject = (updated) => {
    adminChangedRef.current = true
    setLocalProject(updated)
    save(updated)
  }

  const changeTheme = (t) => {
    setTheme(t)
    localStorage.setItem('pdr:theme', t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }

  const depts    = localProject.depts || {}
  const activeDay   = localProject.days?.find(d => d.id === activeDayId)
  const activeScene = activeDay?.scenes?.find(s => s.id === activeSceneId)

  // ── Scene mutations ──────────────────────────────────────────
  const onToggleScene = (sceneId) => {
    const updated = {
      ...localProject,
      days: localProject.days.map(d => ({
        ...d,
        scenes: d.scenes.map(s => s.id === sceneId ? { ...s, done: !s.done } : s)
      }))
    }
    updateProject(updated)
  }

  const onAddScene = (dayId, title, momento, num) => {
    const newScene = {
      id: 's_' + uid(),
      num: num || `ESC ${(localProject.days.find(d=>d.id===dayId)?.scenes.length||0)+1}`,
      title,
      momento: momento || 'mañana',
      done: false,
      depts: [],
    }
    const updated = {
      ...localProject,
      days: localProject.days.map(d =>
        d.id === dayId ? { ...d, scenes: [...d.scenes, newScene] } : d
      )
    }
    updateProject(updated)
  }

  const onDeleteScene = (dayId, sceneId) => {
    const updated = {
      ...localProject,
      days: localProject.days.map(d =>
        d.id === dayId ? { ...d, scenes: d.scenes.filter(s => s.id !== sceneId) } : d
      )
    }
    updateProject(updated)
  }

  const onEditSceneName = (dayId, sceneId, newNum) => {
    const updated = {
      ...localProject,
      days: localProject.days.map(d =>
        d.id === dayId
          ? { ...d, scenes: d.scenes.map(s => s.id === sceneId ? { ...s, num: newNum } : s) }
          : d
      )
    }
    updateProject(updated)
  }

  const onUpdateScene = (updatedScene) => {
    const updated = {
      ...localProject,
      days: localProject.days.map(d => ({
        ...d,
        scenes: d.scenes.map(s => s.id === updatedScene.id ? updatedScene : s),
      }))
    }
    updateProject(updated)
  }

  // ── Navigation ───────────────────────────────────────────────
  const nav = {
    goHome:       () => setView('home'),
    goDay:        (id) => { setDayId(id);   setView('day') },
    goScene:      (scene) => { setSceneId(scene.id || scene); setView('scene') },
    goDept:       (key) => { setDeptKey(key); setView('dept') },
    goExport:     () => setView('export'),
    goScouting:   () => setView('scouting'),
    goTools:      () => setView('tools'),
    goCitaciones: () => setView('citaciones'),
    goMessages:   () => setView('messages'),
    goDropbox:    () => setView('dropbox'),
  }

  const common = { project: localProject, isAdmin, save: updateProject, depts, projectId, accentColor, themeGrad, themeLight }

  return (
    <div
      data-theme={theme}
      style={{
        ...themeVars,
        background: themeGrad,
        backgroundAttachment: 'fixed',
        minHeight: '100dvh',
      }}
    >
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
            onUpdateProject={updateProject}
          />
        )}
        {view === 'day' && activeDay && (
          <DayView
            {...common}
            day={activeDay}
            dayIndex={localProject.days.indexOf(activeDay)}
            onBack={nav.goHome}
            onSelectScene={nav.goScene}
            onToggleScene={onToggleScene}
            onAddScene={onAddScene}
            onDeleteScene={onDeleteScene}
            onEditSceneName={onEditSceneName}
          />
        )}
        {view === 'scene' && activeScene && (
          <SceneView
            {...common}
            scene={activeScene}
            onBack={() => setView('day')}
            onUpdateScene={onUpdateScene}
            onLock={() => setIsAdmin(false)}
            onUnlock={() => setIsAdmin(true)}
          />
        )}
        {view === 'dept' && activeDeptKey && (
          <DeptDetailView
            {...common}
            deptKey={activeDeptKey}
            deptMeta={depts[activeDeptKey] || { label: activeDeptKey, icon: 'FolderOpen', color: '#888' }}
            onBack={nav.goHome}
            onSelectSceneFromDept={(scene) => {
              const day = localProject.days.find(d => d.scenes.some(s => s.id === scene.id))
              if (day) { setDayId(day.id); setSceneId(scene.id); setView('scene') }
            }}
          />
        )}
        {view === 'export'     && <ExportView    {...common} onBack={nav.goHome} />}
        {view === 'scouting'   && <ScoutingView  {...common} onBack={nav.goHome} onGoToLocaciones={() => nav.goDept('locaciones')} />}
        {view === 'tools'      && <ToolsMenuView {...common} onBack={nav.goHome} />}
        {view === 'citaciones' && <CitacionesView {...common} color={accentColor} onBack={nav.goHome} />}
        {view === 'messages'   && <MessagesView  {...common} onBack={nav.goHome} />}
        {view === 'dropbox'    && <DropboxView   {...common} onBack={nav.goHome} />}
      </Suspense>
    </div>
  )
}
