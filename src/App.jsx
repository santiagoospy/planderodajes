/**
 * App root — handles top-level routing based on URL params.
 *
 * Routing is intentionally URL-based (no React Router dependency)
 * to keep the bundle small and match the existing UX.
 *
 *   /?p=<id>   → ProjectShell
 *   /?org=<id> → ProductoraHub
 *   /          → LandingPage
 */

import { useState, useEffect, lazy, Suspense } from 'react'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { UpdateBanner } from './components/ui/UpdateBanner'
import { setSyncNotifier } from './services/sync'
import { getProjectIdFromUrl, getProductoraIdFromUrl } from './utils/urls'
import { Icon } from './components/ui/Icon'

// Route-level code splitting
const LandingPage     = lazy(() => import('./pages/LandingPage'))
const ProjectShell    = lazy(() => import('./pages/ProjectShell'))
const ProductoraShell = lazy(() => import('./pages/ProductoraShell'))

// Wire up sync toast notifications globally
setSyncNotifier((notification) => {
  // Dispatch to a global toast — the SyncToast component listens for this
  window.dispatchEvent(new CustomEvent('sync-notify', { detail: notification }))
})

export default function App() {
  const projectId   = getProjectIdFromUrl()
  const productoraId = getProductoraIdFromUrl()

  // Apply saved theme on mount
  useEffect(() => {
    const theme = localStorage.getItem('pdr:theme') || 'light'
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  let content
  if (projectId) {
    content = (
      <Suspense fallback={<LoadingScreen text="Cargando proyecto..." />}>
        <ProjectShell projectId={projectId} />
      </Suspense>
    )
  } else if (productoraId) {
    content = (
      <Suspense fallback={<LoadingScreen text="Cargando espacio..." />}>
        <ProductoraShell productoraId={productoraId} />
      </Suspense>
    )
  } else {
    content = (
      <Suspense fallback={<LoadingScreen />}>
        <LandingPage />
      </Suspense>
    )
  }

  return (
    <>
      {content}
      <UpdateBanner />
      <button
        onClick={() => window.location.reload()}
        title="Actualizar"
        style={{
          position: 'fixed',
          bottom: 18,
          left: 18,
          zIndex: 9999,
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.18)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: 0.45,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.45'}
        onTouchStart={e => e.currentTarget.style.opacity = '0.85'}
        onTouchEnd={e => e.currentTarget.style.opacity = '0.45'}
      >
        <Icon name="RotateCw" size={15} color="#fff" />
      </button>
    </>
  )
}
