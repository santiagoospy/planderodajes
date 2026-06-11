/**
 * GET /whoami → { email, isAdmin }  (según el token Supabase + ADMIN_EMAILS).
 * Reemplaza el PIN admin hardcodeado por el rol real.
 */

import { json, error, handleOptions } from './_utils.js'
import { getUser, isAdmin } from './_supabase.js'

export default async (req) => {
  if (req.method === 'OPTIONS') return handleOptions()
  const user = await getUser(req)
  if (!user) return error('No autenticado', 401)
  return json({ email: user.email || null, isAdmin: isAdmin(user) })
}
