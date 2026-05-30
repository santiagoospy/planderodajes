/**
 * Generic hook to subscribe to a department's data section
 * with offline-first caching and real-time updates.
 */

import { useState, useEffect, useCallback } from 'react'
import { db } from '../services/db'

/**
 * @param {string} projectId
 * @param {string} deptKey
 * @param {string} section
 * @param {any[]}  defaultItems
 * @returns {{ items: any[], ready: boolean, save: (items: any[]) => void }}
 */
export function useDeptData(projectId, deptKey, section, defaultItems = []) {
  const [items, setItems] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!projectId || !deptKey) return

    const unsub = db.onDeptData(projectId, deptKey, section, (data) => {
      setItems(data !== null && data !== undefined ? data : defaultItems)
      setReady(true)
    })

    return unsub
  }, [projectId, deptKey, section])

  const save = useCallback((newItems) => {
    setItems(newItems) // optimistic update
    db.saveDeptData(projectId, deptKey, section, newItems)
  }, [projectId, deptKey, section])

  return { items: items ?? defaultItems, ready, save }
}
