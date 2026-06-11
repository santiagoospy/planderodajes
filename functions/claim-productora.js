/**
 * POST /claim-productora  { productoraId, password }
 *
 * Reclamo de una productora existente (Opción C — auto-reclamo seguro).
 * Requiere: sesión válida + la CONTRASEÑA de la productora (verificada contra
 * su passwordHash). El primero que reclama con la contraseña correcta queda
 * como owner; después nadie más puede reclamarla (los demás se invitan).
 */

import { getStore } from '@netlify/blobs'
import { json, error, parseBody, handleOptions, requireFields } from './_utils.js'
import { getUser, sbAdmin, sha256hex } from './_supabase.js'

export default async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  if (req.method !== 'POST') return error('Method not allowed', 405)

  const user = await getUser(req)
  if (!user) return error('No autenticado', 401)

  try {
    const body = await parseBody(req)
    requireFields(body, ['productoraId', 'password'])
    const productoraId = String(body.productoraId).trim()

    // 1. La productora tiene que existir.
    const prod = await getStore('productoras').get(productoraId, { type: 'json' })
    if (!prod) return error('No existe una productora con ese código', 404)

    // 2. Verificar la contraseña contra el hash guardado.
    if (!prod.passwordHash) {
      return error('Esta productora no tiene contraseña. Pedile al admin que te la asigne.', 409)
    }
    if (sha256hex(body.password) !== prod.passwordHash) {
      return error('Contraseña incorrecta', 403)
    }

    const sb = sbAdmin()

    // 3. ¿Ya tiene dueño?
    const { data: owner } = await sb
      .from('memberships')
      .select('user_id')
      .eq('productora_id', productoraId)
      .eq('role', 'owner')
      .maybeSingle()

    if (owner && owner.user_id !== user.id) {
      return error('Esta productora ya fue reclamada por otra persona.', 409)
    }

    // 4. Crear (o confirmar) la membresía owner. Idempotente.
    const { error: upErr } = await sb
      .from('memberships')
      .upsert(
        { user_id: user.id, productora_id: productoraId, role: 'owner' },
        { onConflict: 'user_id,productora_id' }
      )
    if (upErr) throw new Error(upErr.message)

    return json({ ok: true, productoraId, role: 'owner', name: prod.name || productoraId })
  } catch (err) {
    console.error('[claim-productora]', err.message)
    return error(err.message || 'Error interno', 500)
  }
}
