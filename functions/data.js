/**
 * Main CRUD function — reads and writes to Netlify Blobs.
 *
 * GET  /data?store=<s>&key=<k>        → read one item
 * GET  /data?store=<s>&list=true      → list all items in store
 * POST /data { store, key, value }    → write item
 * POST /data { store, key, delete:true } → delete item
 *
 * AUTORIZACIÓN (Capa 1):
 *   1. Usuario Supabase válido (Authorization: Bearer <token>).
 *   2. Membresía en la productora dueña del recurso (admin saltea todo).
 * El proyecto demo (proj_demo) es de LECTURA pública para usuarios logueados.
 */

import { getStore } from '@netlify/blobs'
import { json, error, parseBody, handleOptions, requireFields } from './_utils.js'
import { getUser, isAdmin, membershipRole } from './_supabase.js'

const MAX_SIZE_BYTES = 1024 * 1024 // 1 MB
const DEMO_PROJECT_ID = 'proj_demo'

/** projectId al que pertenece un store dept:<projectId>:<deptKey> */
function projectIdOfDeptStore(store) {
  const parts = store.split(':')
  return parts.length >= 2 ? parts[1] : null
}

export default async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()

  const user = await getUser(req)
  if (!user) return error('No autenticado', 401)
  const admin = isAdmin(user)

  try {
    const isWrite = req.method === 'POST'
    let store, key, value, isList, shouldDelete

    if (req.method === 'GET') {
      const url = new URL(req.url)
      store  = url.searchParams.get('store')
      key    = url.searchParams.get('key')
      isList = url.searchParams.get('list') === 'true'
    } else if (isWrite) {
      const body = await parseBody(req)
      requireFields(body, ['store', 'key'])
      ;({ store, key, value, delete: shouldDelete } = body)
    } else {
      return error('Method not allowed', 405)
    }

    if (!store) return error('Missing store param')

    // ── Autorización ────────────────────────────────────────
    if (!admin) {
      const denied = await authorize({ store, key, isList, isWrite, shouldDelete, value, userId: user.id })
      if (denied) return denied
    }

    // ── GET ─────────────────────────────────────────────────
    if (req.method === 'GET') {
      const blob = getStore(store)

      if (isList) {
        const { blobs } = await blob.list()
        const items = await Promise.all(
          blobs.map(async ({ key: k }) => {
            try { return await blob.get(k, { type: 'json' }) }
            catch { return null }
          })
        )
        return json({ items: items.filter(Boolean) })
      }

      if (!key) return error('Missing key param')
      const val = await blob.get(key, { type: 'json' })
      return json(val)
    }

    // ── POST ────────────────────────────────────────────────
    const blob = getStore(store)

    if (shouldDelete) {
      await blob.delete(key)
      return json({ ok: true })
    }

    if (value === undefined || value === null) return error('Missing value')

    const serialized = JSON.stringify(value)
    if (serialized.length > MAX_SIZE_BYTES) {
      return error(`Data too large (${Math.round(serialized.length / 1024)}KB, max 1MB)`, 413)
    }

    await blob.setJSON(key, value)
    return json({ ok: true, key })

  } catch (err) {
    console.error('[data]', err.message)
    return error(err.message || 'Internal server error', 500)
  }
}

/**
 * Devuelve una Response de error si el usuario NO está autorizado, o null si OK.
 * Resuelve a qué productora pertenece el recurso y exige membresía.
 */
async function authorize({ store, key, isList, isWrite, shouldDelete, value, userId }) {
  const need = async (productoraId) => {
    if (!productoraId) return error('Recurso sin productora asociada', 403)
    const role = await membershipRole(userId, productoraId)
    if (!role) return error('No tenés acceso a esta productora', 403)
    return null
  }

  // ── productoras ──
  if (store === 'productoras') {
    if (isList) return error('Solo admin', 403)            // listar todas = admin
    if (!isWrite) return null                               // leer metadata: cualquier logueado (se sanitiza el hash)
    // escritura
    const existing = await getStore('productoras').get(key, { type: 'json' }).catch(() => null)
    if (!existing) return null                              // crear productora nueva: permitido (luego reclama owner)
    const role = await membershipRole(userId, key)          // modificar/borrar existente: solo owner o admin
    if (role !== 'owner') return error('Solo el dueño puede modificar la productora', 403)
    return null
  }

  // ── projects ──
  if (store === 'projects') {
    if (key === DEMO_PROJECT_ID && !isWrite) return null   // demo: lectura pública
    if (isWrite) {
      const existing = await getStore('projects').get(key, { type: 'json' }).catch(() => null)
      const targetProd = value?.productoraId || existing?.productoraId
      const denied = await need(targetProd)
      if (denied) return denied
      // Si se intenta mover el proyecto a otra productora, exigir membresía en ambas.
      if (existing?.productoraId && value?.productoraId && existing.productoraId !== value.productoraId) {
        return await need(existing.productoraId)
      }
      return null
    }
    // lectura de un proyecto
    const proj = await getStore('projects').get(key, { type: 'json' }).catch(() => null)
    if (!proj) return null                                  // no existe → devolverá null igual
    return await need(proj.productoraId)
  }

  // ── dept:<projectId>:<deptKey> ──
  if (store.startsWith('dept:')) {
    const projectId = projectIdOfDeptStore(store)
    if (projectId === DEMO_PROJECT_ID && !isWrite) return null
    const proj = await getStore('projects').get(projectId, { type: 'json' }).catch(() => null)
    if (!proj) return isWrite ? error('Proyecto inexistente', 404) : null
    return await need(proj.productoraId)
  }

  // store desconocido → denegar por defecto (seguro)
  return error('Store no permitido', 403)
}
