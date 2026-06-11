/**
 * Panel de admin (Opción C). Solo para emails en ADMIN_EMAILS.
 *
 * GET  /admin-memberships              → todas las productoras + sus membresías + invites
 * POST /admin-memberships { action: 'assign', productoraId, email, role }
 *        → asigna ownership/membership a un email (crea invite; si el user ya existe,
 *          crea la membresía al toque y consume la invite).
 * POST /admin-memberships { action: 'remove', productoraId, userId }
 *        → quita una membresía.
 */

import { getStore } from '@netlify/blobs'
import { json, error, parseBody, handleOptions, requireFields } from './_utils.js'
import { getUser, sbAdmin, isAdmin, findUserByEmail } from './_supabase.js'

export default async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()

  const user = await getUser(req)
  if (!user) return error('No autenticado', 401)
  if (!isAdmin(user)) return error('Solo admin', 403)

  const sb = sbAdmin()

  try {
    if (req.method === 'GET') {
      const { blobs } = await getStore('productoras').list()
      const productoras = await Promise.all(
        blobs.map(async ({ key }) => {
          const p = await getStore('productoras').get(key, { type: 'json' }).catch(() => null)
          return p ? { id: p.id || key, name: p.name || key } : null
        })
      )
      const { data: memberships } = await sb.from('memberships').select('user_id, productora_id, role')
      const { data: invites } = await sb.from('invites').select('productora_id, email, role')
      return json({
        productoras: productoras.filter(Boolean),
        memberships: memberships || [],
        invites: invites || [],
      })
    }

    if (req.method === 'POST') {
      const body = await parseBody(req)

      if (body.action === 'assign') {
        requireFields(body, ['productoraId', 'email'])
        const productoraId = String(body.productoraId).trim()
        const email = String(body.email).trim().toLowerCase()
        const role = body.role === 'owner' ? 'owner' : 'member'

        const target = await findUserByEmail(email)
        if (target) {
          const { error: e } = await sb.from('memberships')
            .upsert({ user_id: target.id, productora_id: productoraId, role }, { onConflict: 'user_id,productora_id' })
          if (e) throw new Error(e.message)
          await sb.from('invites').delete().eq('productora_id', productoraId).ilike('email', email)
          return json({ ok: true, applied: 'membership', email, role })
        }
        // El usuario aún no tiene cuenta → dejar invitación pendiente.
        const { error: e } = await sb.from('invites')
          .upsert({ productora_id: productoraId, email, role, invited_by: user.id }, { onConflict: 'productora_id,email' })
        if (e) throw new Error(e.message)
        return json({ ok: true, applied: 'invite', email, role })
      }

      if (body.action === 'remove') {
        requireFields(body, ['productoraId', 'userId'])
        const { error: e } = await sb.from('memberships')
          .delete().eq('productora_id', String(body.productoraId)).eq('user_id', String(body.userId))
        if (e) throw new Error(e.message)
        return json({ ok: true })
      }

      return error('Acción desconocida', 400)
    }

    return error('Method not allowed', 405)
  } catch (err) {
    console.error('[admin-memberships]', err.message)
    return error(err.message || 'Error interno', 500)
  }
}
