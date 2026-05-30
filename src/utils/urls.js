/** Extract project ID from URL (?p=xxx or /p/xxx) */
export function getProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('p') || null
}

/** Extract productora ID from URL (?org=xxx) */
export function getProductoraIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('org') || null
}

/** Build the shareable URL for a project */
export function buildProjectUrl(projectId) {
  return `${window.location.origin}/?p=${projectId}`
}

/** Build the URL for a productora hub */
export function buildProductoraUrl(productoraId) {
  return `${window.location.origin}/?org=${productoraId}`
}

/** Normalize a productora slug (lowercase, no spaces) */
export function productoraSlug(text) {
  return (text || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

/** Slugify any text for use as a key */
export function slugify(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

// ── Pinned projects (localStorage) ──────────────────────────

const PINNED_KEY = 'planderodajes:pinned'

export function getPinnedProjects() {
  try { return JSON.parse(localStorage.getItem(PINNED_KEY) || '[]') }
  catch { return [] }
}

export function setPinnedProjects(arr) {
  localStorage.setItem(PINNED_KEY, JSON.stringify(arr))
}

export function isPinnedProject(id) {
  return getPinnedProjects().some(p => p.id === id)
}

export function pinProject(proj) {
  const list = getPinnedProjects().filter(p => p.id !== proj.id)
  list.unshift({ id: proj.id, nombre: proj.title || proj.nombre, color: proj.color })
  setPinnedProjects(list.slice(0, 10))
  return getPinnedProjects()
}

export function unpinProject(id) {
  const list = getPinnedProjects().filter(p => p.id !== id)
  setPinnedProjects(list)
  return list
}
