/**
 * Productora shell — manages a productora's project list.
 * Handles auth, project creation, and hub navigation.
 */

import { useState, useEffect } from 'react'
import { LoadingScreen } from '../components/ui/LoadingScreen'
import { api } from '../services/api'
import { storage } from '../services/storage'
import { db } from '../services/db'
import { buildProjectUrl } from '../utils/urls'

/** @param {{ productoraId: string }} props */
export default function ProductoraShell({ productoraId }) {
  const [productora, setProductora]   = useState(() => storage.getProductora(productoraId))
  const [projects, setProjects]       = useState([])
  const [loading, setLoading]         = useState(!storage.getProductora(productoraId))
  const [unlocked, setUnlocked]       = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.getProductora(productoraId)
      .then(data => {
        if (cancelled) return
        setProductora(data)
        storage.setProductora(productoraId, data)
        // Load project list
        return api.listProjects()
      })
      .then(list => {
        if (cancelled || !list) return
        const mine = (list || []).filter(p => p.productoraId === productoraId)
        setProjects(mine)
      })
      .catch(() => {
        // Use cached productora
        const cached = storage.getProductora(productoraId)
        if (!cancelled && cached) setProductora(cached)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [productoraId])

  const saveProductora = (data) => {
    setProductora(data)
    db.saveProductora(productoraId, data)
  }

  const openProject = (id) => {
    window.location.href = buildProjectUrl(id)
  }

  if (loading) return <LoadingScreen text="Cargando espacio..." />

  // Minimal hub UI — full implementation mirrors existing ProductoraHubView
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
      <div className="text-xl font-bold text-[var(--text-primary)] mb-2">
        {productora?.name || productoraId}
      </div>
      <div className="text-sm text-[var(--text-tertiary)] mb-8">
        {projects.length} proyecto{projects.length !== 1 ? 's' : ''}
      </div>
      {projects.map(p => (
        <button
          key={p.id}
          onClick={() => openProject(p.id)}
          className="tap w-full max-w-sm mb-3 px-4 py-3 rounded-card bg-[var(--bg-secondary)] border border-[var(--border-light)] text-left font-[Inter]"
        >
          <div className="font-bold text-[var(--text-primary)]">{p.title}</div>
          <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{p.dates}</div>
        </button>
      ))}
    </div>
  )
}
