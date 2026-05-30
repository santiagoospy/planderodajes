/**
 * localStorage helpers with JSON serialization and error safety.
 * All keys are namespaced under 'pdr:' to avoid collisions.
 */

const NS = 'pdr:'

export const storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(NS + key)
      return raw !== null ? JSON.parse(raw) : fallback
    } catch {
      return fallback
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value))
    } catch (e) {
      console.warn('[storage] set failed:', e.message)
    }
  },

  remove(key) {
    try { localStorage.removeItem(NS + key) } catch {}
  },

  /** Get a cached project by ID */
  getProject(id) {
    return this.get(`project:${id}`)
  },

  /** Cache a project locally */
  setProject(id, data) {
    this.set(`project:${id}`, data)
  },

  /** Get cached productora */
  getProductora(id) {
    return this.get(`productora:${id}`)
  },

  /** Cache a productora */
  setProductora(id, data) {
    this.set(`productora:${id}`, data)
  },

  /** Get department section data */
  getDeptData(projectId, deptKey, section) {
    return this.get(`dept:${projectId}:${deptKey}:${section}`)
  },

  /** Cache department section data */
  setDeptData(projectId, deptKey, section, data) {
    this.set(`dept:${projectId}:${deptKey}:${section}`, data)
  },
}
