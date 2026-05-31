/**
 * In-memory database + real-time listeners layer.
 *
 * This service wraps the Netlify Functions API with:
 * - Local cache (optimistic reads)
 * - Real-time polling (SSE not available, so we poll on focus)
 * - Offline queue via syncQueue
 */

import { api } from './api'
import { storage } from './storage'
import { syncQueue } from './sync'

/** Subscriber map: key → Set<callback> */
const subscribers = new Map()
/** In-memory cache */
const cache = new Map()

function cacheKey(projectId, deptKey, section) {
  return `${projectId}:${deptKey}:${section}`
}

function notify(key, data) {
  subscribers.get(key)?.forEach(cb => cb(data))
}

/**
 * Subscribe to a department data section.
 * Calls `callback` immediately with cached/stored data, then
 * whenever the data changes locally.
 *
 * @returns {() => void} unsubscribe function
 */
export function onDeptData(projectId, deptKey, section, callback) {
  const key = cacheKey(projectId, deptKey, section)

  if (!subscribers.has(key)) subscribers.set(key, new Set())
  subscribers.get(key).add(callback)

  // Serve from cache immediately
  const cached = cache.get(key) ?? storage.getDeptData(projectId, deptKey, section)
  if (cached !== null && cached !== undefined) {
    callback(cached)
  }

  // Fetch fresh from server in background
  api.getDeptData(projectId, deptKey, section)
    .then(data => {
      cache.set(key, data)
      storage.setDeptData(projectId, deptKey, section, data)
      notify(key, data)
    })
    .catch(() => {
      // Offline — cached value already served
    })

  return () => {
    subscribers.get(key)?.delete(callback)
  }
}

/**
 * Write department data and sync to server.
 */
export function saveDeptData(projectId, deptKey, section, data) {
  const key = cacheKey(projectId, deptKey, section)
  cache.set(key, data)
  storage.setDeptData(projectId, deptKey, section, data)
  notify(key, data)

  syncQueue.enqueue({
    name: `dept:${key}`,
    fn: () => api.saveDeptData(projectId, deptKey, section, data),
  })
}

/**
 * Save an entire project.
 */
export function saveProject(id, data) {
  storage.setProject(id, data)
  syncQueue.enqueue({
    name: `project:${id}`,
    fn: () => api.saveProject(id, data),
  })
}

/**
 * Save a productora.
 */
export function saveProductora(id, data) {
  storage.setProductora(id, data)
  syncQueue.enqueue({
    name: `productora:${id}`,
    fn: () => api.saveProductora(id, data),
  })
}

/**
 * Get message archive for a project.
 */
export async function getMsgArchive(projectId) {
  try {
    const data = await api.getMsgArchive(projectId)
    return data || []
  } catch {
    return []
  }
}

export const db = {
  onDeptData,
  saveDeptData,
  saveProject,
  saveProductora,
  getMsgArchive,
}
