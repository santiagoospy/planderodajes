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

    // 2. Verificar la contraseña. Productoras nuevas guardan `passwordHash`
    //    (SHA-256); las viejas guardan `password` en texto plano (compat).
    let okPwd
    if (prod.passwordHash) {
      okPwd = sha256hex(body.password) === prod.passwordHash
    } else if (prod.password != null && prod.password !== '') {
      okPwd = String(body.password) === String(prod.password)
    } else {
      return error('Esta productora no tiene contraseña. Pedile al admin que te la asigne.', 409)
    }
    if (!okPwd) return error('Contraseña incorrecta', 403)

    const sb = sbAdmin()
    const name = prod.name || productoraId

    // 3. ¿Ya soy miembro? Idempotente: devuelvo mi rol actual.
    const { data: mine } = await sb
      .from('memberships')
      .select('role')
      .eq('productora_id', productoraId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (mine) return json({ ok: true, productoraId, role: mine.role, name })

    // 4. ¿Ya hay dueño? El PRIMERO que entra con la contraseña queda owner; el
    //    resto (con la misma contraseña) quedan member. Calza con el modelo de
    //    "contraseña compartida del equipo".
    const { data: owner } = await sb
      .from('memberships')
      .select('user_id')
      .eq('productora_id', productoraId)
      .eq('role', 'owner')
      .maybeSingle()
    const role = owner ? 'member' : 'owner'

    const { error: upErr } = await sb
      .from('memberships')
      .upsert(
        { user_id: user.id, productora_id: productoraId, role },
        { onConflict: 'user_id,productora_id' }
      )
    if (upErr) throw new Error(upErr.message)

    return json({ ok: true, productoraId, role, name })
  } catch (err) {
    console.error('[claim-productora]', err.message)
    return error(err.message || 'Error interno', 500)
  }
}
