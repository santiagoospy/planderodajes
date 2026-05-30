/**
 * Loads a project by ID with offline-first caching.
 * Returns the project and a save() function.
 */

import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import { storage } from '../services/storage'
import { db } from '../services/db'

/**
 * @param {string|null} projectId
 * @returns {{
 *   project:  object|null,
 *   loading:  boolean,
 *   error:    string|null,
 *   save:     (data: object) => void,
 *   refresh:  () => void,
 * }}
 */
export function useProject(projectId) {
  const [project, setProject] = useState(() => storage.getProject(projectId))
  const [loading, setLoading] = useState(!storage.getProject(projectId))
  const [error, setError]     = useState(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.getProject(projectId)
      setProject(data)
      storage.setProject(projectId, data)
    } catch (e) {
      const cached = storage.getProject(projectId)
      if (cached) setProject(cached)
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { load() }, [load])

  const save = useCallback((data) => {
    setProject(data)
    db.saveProject(projectId, data)
  }, [projectId])

  return { project, loading, error, save, refresh: load }
}
