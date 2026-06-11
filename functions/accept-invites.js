/**
 * POST /accept-invites   (sin body)
 *
 * Convierte todas las invitaciones pendientes del email del usuario logueado en
 * membresías reales. Se llama después de cada login. Idempotente.
 */

import { json, error, handleOptions } from './_utils.js'
import { getUser, sbAdmin } from './_supabase.js'

export default async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const user = await getUser(req)
  if (!user) return error('No autenticado', 401)
  if (!user.email) return json({ ok: true, joined: [] })

  try {
    const sb = sbAdmin()
    const email = user.email.toLowerCase()

    const { data: invites } = await sb
      .from('invites')
      .select('productora_id, role')
      .ilike('email', email)

    if (!invites?.length) return json({ ok: true, joined: [] })

    // Crear membresías (no pisa a un owner existente con un member).
    const rows = invites.map(i => ({
      user_id: user.id,
      productora_id: i.productora_id,
      role: i.role,
    }))
    const { error: upErr } = await sb
      .from('memberships')
      .upsert(rows, { onConflict: 'user_id,productora_id', ignoreDuplicates: true })
    if (upErr) throw new Error(upErr.message)

    // Borrar las invitaciones consumidas.
    await sb.from('invites').delete().ilike('email', email)

    return json({ ok: true, joined: invites.map(i => i.productora_id) })
  } catch (err) {
    console.error('[accept-invites]', err.message)
    return error(err.message || 'Error interno', 500)
  }
}
