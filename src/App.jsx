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
import { setSyncNotifier } from './services/sync'
import { getProjectIdFromUrl, getProductoraIdFromUrl } from './utils/urls'

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

  if (projectId) {
    return (
      <Suspense fallback={<LoadingScreen text="Cargando proyecto..." />}>
        <ProjectShell projectId={projectId} />
      </Suspense>
    )
  }

  if (productoraId) {
    return (
      <Suspense fallback={<LoadingScreen text="Cargando espacio..." />}>
        <ProductoraShell productoraId={productoraId} />
      </Suspense>
    )
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <LandingPage />
    </Suspense>
  )
}
