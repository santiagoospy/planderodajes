/**
 * API client for Netlify Functions.
 * All requests go through /.netlify/functions/data (main CRUD)
 * or other function endpoints.
 */

const BASE = '/.netlify/functions'

/** Generic fetch with JSON and error handling */
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

// ── Main CRUD (Netlify Blobs) ────────────────────────────────

export const api = {
  /**
   * GET a stored value
   * @param {string} store  - blob store name
   * @param {string} key    - item key
   */
  async get(store, key) {
    return apiFetch(`/data?store=${encodeURIComponent(store)}&key=${encodeURIComponent(key)}`)
  },

  /**
   * POST / upsert a stored value
   * @param {string} store
   * @param {string} key
   * @param {any}    value
   */
  async set(store, key, value) {
    return apiFetch('/data', {
      method: 'POST',
      body: JSON.stringify({ store, key, value }),
    })
  },

  /**
   * DELETE a stored value
   */
  async delete(store, key) {
    return apiFetch('/data', {
      method: 'DELETE',
      body: JSON.stringify({ store, key }),
    })
  },

  // ── Project helpers ──────────────────────────────────────

  async getProject(id) {
    return this.get('projects', id)
  },

  async saveProject(id, data) {
    return this.set('projects', id, data)
  },

  async listProjects() {
    return apiFetch('/list-projects')
  },

  // ── Productora helpers ───────────────────────────────────

  async getProductora(id) {
    return this.get('productoras', id)
  },

  async saveProductora(id, data) {
    return this.set('productoras', id, data)
  },

  // ── Department data ──────────────────────────────────────

  async getDeptData(projectId, deptKey, section) {
    return this.get(`dept:${projectId}:${deptKey}`, section)
  },

  async saveDeptData(projectId, deptKey, section, data) {
    return this.set(`dept:${projectId}:${deptKey}`, section, data)
  },

  // ── File uploads (R2) ───────────────────────────────────

  async getUploadUrl(filename, contentType) {
    return apiFetch('/r2-presign', {
      method: 'POST',
      body: JSON.stringify({ filename, contentType }),
    })
  },

  async uploadFile(presignedUrl, file) {
    const res = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  },
}
