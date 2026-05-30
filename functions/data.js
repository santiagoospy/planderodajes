/**
 * Main CRUD function — reads and writes to Netlify Blobs.
 *
 * GET  /data?store=<s>&key=<k>        → read one item
 * GET  /data?store=<s>&list=true      → list all items in store
 * POST /data { store, key, value }    → write item
 * POST /data { store, key, delete:true } → delete item
 */

import { getStore } from '@netlify/blobs'
import { json, error, parseBody, handleOptions, requireFields } from './_utils.js'

const MAX_SIZE_BYTES = 1024 * 1024 // 1 MB

export default async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()

  try {
    // ── GET ───────────────────────────────────────────────────
    if (req.method === 'GET') {
      const url    = new URL(req.url)
      const store  = url.searchParams.get('store')
      const key    = url.searchParams.get('key')
      const isList = url.searchParams.get('list') === 'true'

      if (!store) return error('Missing store param')

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
      if (val === null) return error('Not found', 404)
      return json(val)
    }

    // ── POST ──────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = await parseBody(req)
      requireFields(body, ['store', 'key'])

      const { store: storeName, key, value, delete: shouldDelete } = body
      const blob = getStore(storeName)

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
    }

    return error('Method not allowed', 405)

  } catch (err) {
    console.error('[data]', err.message)
    return error(err.message || 'Internal server error', 500)
  }
}
