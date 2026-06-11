/**
 * Helpers de Supabase para el backend (Capa 1 — Identidad / autorización).
 *
 * CRÍTICO: el access_token del cliente está firmado con el secreto de Supabase,
 * no con uno nuestro. Se valida con supabase.auth.getUser(token) — nunca con un
 * JWT_SECRET propio (ese es un bug clásico que falla siempre, ver pitfalls.md).
 *
 * La service key NUNCA lleva prefijo VITE_: vive solo acá, en runtime.
 */

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

let _admin = null
/** Cliente con service role: saltea RLS. Solo backend. */
export function sbAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error('Supabase no configurado (falta SUPABASE_URL o SUPABASE_SERVICE_KEY)')
  }
  if (!_admin) {
    _admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _admin
}

/** Extrae y valida el usuario del header Authorization. null si no hay token válido. */
export async function getUser(req) {
  const header = req.headers.get('authorization') || ''
  const token = header.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const { data, error } = await sbAdmin().auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}

/** ¿El usuario es admin global? (lista de emails en ADMIN_EMAILS, separados por coma) */
export function isAdmin(user) {
  if (!user?.email) return false
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  return list.includes(user.email.toLowerCase())
}

/** ¿El usuario es miembro de la productora? Devuelve el rol ('owner'|'member') o null. */
export async function membershipRole(userId, productoraId) {
  const { data } = await sbAdmin()
    .from('memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('productora_id', productoraId)
    .maybeSingle()
  return data?.role || null
}

/** Set de productora_ids a las que pertenece el usuario. */
export async function userProductoraIds(userId) {
  const { data } = await sbAdmin()
    .from('memberships')
    .select('productora_id')
    .eq('user_id', userId)
  return new Set((data || []).map(r => r.productora_id))
}

/** SHA-256 hex puro — debe coincidir EXACTO con src/utils/hash.js hashPin(). */
export function sha256hex(str) {
  return createHash('sha256').update(String(str), 'utf8').digest('hex')
}

/** Busca un usuario por email (admin API, paginado). null si no tiene cuenta aún. */
export async function findUserByEmail(email) {
  const target = String(email).toLowerCase()
  const sb = sbAdmin()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    const found = data?.users?.find(u => u.email?.toLowerCase() === target)
    if (found) return found
    if (!data?.users?.length || data.users.length < 200) break
  }
  return null
}
