/**
 * API client for Netlify Functions.
 * Falls back silently in local dev (no functions running).
 */

const BASE = '/.netlify/functions'
const IS_DEV = import.meta.env.DEV

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body || res.statusText}`)
  }
  return res.json()
}

export const api = {
  async get(store, key) {
    return apiFetch(`/data?store=${encodeURIComponent(store)}&key=${encodeURIComponent(key)}`)
  },

  async set(store, key, value) {
    return apiFetch('/data', {
      method: 'POST',
      body: JSON.stringify({ store, key, value }),
    })
  },

  async getProject(id) {
    return this.get('projects', id)
  },

  async saveProject(id, data) {
    return this.set('projects', id, data)
  },

  async listProjects() {
    return apiFetch('/list-projects')
  },

  async listProductoras() {
    return apiFetch('/data?store=productoras&list=true')
  },

  async delete(store, key) {
    return apiFetch('/data', {
      method: 'POST',
      body: JSON.stringify({ store, key, delete: true }),
    })
  },

  async getProductora(id) {
    return this.get('productoras', id)
  },

  async saveProductora(id, data) {
    return this.set('productoras', id, data)
  },

  // NOTE: File uploads to R2 use uploadFileToR2() in services/s3-upload.js,
  // which calls /r2-presign with the correct { action, fileName, fileType } payload.

  // Dept data uses flattened store/key: store="dept:pid:deptKey" key=section
  async getDeptData(projectId, deptKey, section) {
    return this.get(`dept:${projectId}:${deptKey}`, section)
  },

  async saveDeptData(projectId, deptKey, section, data) {
    return this.set(`dept:${projectId}:${deptKey}`, section, data)
  },

  async deleteDeptData(projectId, deptKey, section) {
    return this.delete(`dept:${projectId}:${deptKey}`, section)
  },

  async getMsgArchive(projectId) {
    try {
      return await this.getDeptData(projectId, '_global', 'msg_archive')
    } catch {
      return []
    }
  },
}
