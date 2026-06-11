/**
 * Servicio de membresías (Capa 1). Lee "mis productoras" vía RLS de Supabase y
 * llama a las Netlify Functions de reclamo/invitación adjuntando el token.
 */

import { supabase, Auth } from './auth'

const BASE = '/.netlify/functions'

async function authedFetch(path, options = {}) {
  const token = await Auth.getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.error || `Error ${res.status}`)
  return data
}

export const memberships = {
  /** Mis productoras (RLS: solo las propias). [{ productora_id, role }] */
  async mine() {
    const { data, error } = await supabase
      .from('memberships')
      .select('productora_id, role')
      .order('created_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  /** Reclamar una productora existente con su código + contraseña. */
  claim(productoraId, password) {
    return authedFetch('/claim-productora', {
      method: 'POST',
      body: JSON.stringify({ productoraId, password }),
    })
  },

  /** Convierte invitaciones pendientes de mi email en membresías. Llamar al loguear. */
  acceptInvites() {
    return authedFetch('/accept-invites', { method: 'POST' })
  },

  /** El owner invita a alguien por email. */
  invite(productoraId, email, role = 'member') {
    return authedFetch('/invite-member', {
      method: 'POST',
      body: JSON.stringify({ productoraId, email, role }),
    })
  },

  /** { email, isAdmin } del usuario logueado. */
  whoami() {
    return authedFetch('/whoami')
  },

  // ── Admin (Opción C) ──────────────────────────────────────
  adminOverview() {
    return authedFetch('/admin-memberships')
  },
  adminAssign(productoraId, email, role = 'owner') {
    return authedFetch('/admin-memberships', {
      method: 'POST',
      body: JSON.stringify({ action: 'assign', productoraId, email, role }),
    })
  },
  adminRemove(productoraId, userId) {
    return authedFetch('/admin-memberships', {
      method: 'POST',
      body: JSON.stringify({ action: 'remove', productoraId, userId }),
    })
  },
}
