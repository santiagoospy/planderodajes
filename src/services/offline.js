/**
 * Offline / "Descargar para set" utilities.
 *
 * The db layer (db.js) already caches every dept data fetch in localStorage,
 * so data that was viewed while online is automatically available offline.
 * This module pre-fetches EVERYTHING for a project proactively so the user
 * doesn't need to open each dept tab before leaving for set.
 */

import { api } from './api'
import { storage } from './storage'

const DL_KEY = 'offline-dl' // { [projectId]: timestamp }

// All section keys that might exist per department
const DEPT_SECTIONS = [
  'info', 'checklist', 'integrantes', 'citaciones', 'pedidos', 'gastos', 'mural',
  'adcomentarios', 'crew_total', 'rental', 'elenco', 'menu',
  'tarjetas', 'checklist_equipo', 'locaciones',
  'continuidad_notas', 'continuidad_fotos',
  'principais',  // casting alias used in some views
]

export function isDownloaded(projectId) {
  return !!(storage.get(DL_KEY, {})[projectId])
}

export function getDownloadedAt(projectId) {
  const ts = storage.get(DL_KEY, {})[projectId]
  return ts ? new Date(ts) : null
}

function markDownloaded(projectId) {
  const map = storage.get(DL_KEY, {})
  storage.set(DL_KEY, { ...map, [projectId]: Date.now() })
}

/**
 * Pre-fetch all project data and cache it locally.
 * @param {string} projectId
 * @param {object} project  - full project object (already loaded)
 * @param {(status:{done,total,label})=>void} onProgress
 */
export async function downloadProject(projectId, project, onProgress) {
  const deptKeys = Object.keys(project.depts || {})
  const scenes   = (project.days || []).flatMap(d => d.scenes || [])
  const images   = collectImages(project)

  const total = deptKeys.length * DEPT_SECTIONS.length + scenes.length * 2 + images.length + 2
  let done = 0
  const tick = (label) => { done++; onProgress?.({ done, total, label }) }

  // 1. Re-save the project itself into storage (it's already there, this is a no-op safeguard)
  storage.setProject(projectId, project)
  tick('Proyecto')

  // 2. Dept data
  for (const deptKey of deptKeys) {
    const deptLabel = project.depts[deptKey]?.label || deptKey
    for (const section of DEPT_SECTIONS) {
      try {
        const data = await api.getDeptData(projectId, deptKey, section)
        if (data != null) storage.setDeptData(projectId, deptKey, section, data)
      } catch {
        // section doesn't exist or network error — skip
      }
      tick(deptLabel)
    }
  }

  // 3. Scene planos + storyboard
  for (const scene of scenes) {
    for (const section of ['planos', 'storyboard']) {
      try {
        const data = await api.getDeptData(projectId, `scene_${scene.id}`, section)
        if (data != null) storage.setDeptData(projectId, `scene_${scene.id}`, section, data)
      } catch {}
      tick(scene.num || 'Escena')
    }
  }

  // 4. Pre-cache images via SW cache (best-effort)
  for (const url of images) {
    try { await fetch(url, { cache: 'force-cache' }) } catch {}
    tick('Imágenes')
  }

  // 5. PPM
  try {
    const ppm = await api.get(`ppm:${projectId}`, 'data')
    if (ppm != null) storage.setDeptData(projectId, 'ppm', 'data', ppm)
  } catch {}
  tick('PPM')

  markDownloaded(projectId)
}

function collectImages(project) {
  const urls = new Set()
  if (project.logo) urls.add(project.logo)
  Object.values(project.depts || {}).forEach(d => {
    if (d.photo) urls.add(d.photo)
  })
  return [...urls].filter(Boolean).slice(0, 30)
}
