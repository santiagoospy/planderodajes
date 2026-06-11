/**
 * POST /invite-member  { productoraId, email, role? }
 *
 * El owner de la productora (o un admin) invita a alguien por email. Queda como
 * invitación pendiente; cuando esa persona se loguea con ese email, /accept-invites
 * la convierte en membresía real.
 */

import { json, error, parseBody, handleOptions, requireFields } from './_utils.js'
import { getUser, sbAdmin, isAdmin, membershipRole } from './_supabase.js'

export default async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const user = await getUser(req)
  if (!user) return error('No autenticado', 401)

  try {
    const body = await parseBody(req)
    requireFields(body, ['productoraId', 'email'])
    const productoraId = String(body.productoraId).trim()
    const email = String(body.email).trim().toLowerCase()
    const role = body.role === 'owner' ? 'owner' : 'member'

    // Autorización: solo el owner de esa productora o un admin global.
    const role_ = await membershipRole(user.id, productoraId)
    if (role_ !== 'owner' && !isAdmin(user)) {
      return error('Solo el dueño puede invitar.', 403)
    }

    const { error: upErr } = await sbAdmin()
      .from('invites')
      .upsert(
        { productora_id: productoraId, email, role, invited_by: user.id },
        { onConflict: 'productora_id,email' }
      )
    if (upErr) throw new Error(upErr.message)

    return json({ ok: true, email, productoraId, role })
  } catch (err) {
    console.error('[invite-member]', err.message)
    return error(err.message || 'Error interno', 500)
  }
}
