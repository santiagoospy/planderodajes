/**
 * Supabase Auth client + helpers (Capa 1 — Identidad).
 *
 * Las claves acá son PÚBLICAS (publishable/anon): viajan al navegador a
 * propósito. El secreto de verdad (service key) vive solo en el backend.
 *
 * Diseño offline-first: persistSession guarda la sesión en localStorage y
 * autoRefreshToken la renueva sola cuando vuelve la red. En set sin conexión,
 * getSession() devuelve la sesión cacheada y la cola de sync adjunta el token
 * al hacer flush.
 */

import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!URL || !ANON) {
  // No reventamos la app, pero dejamos rastro claro (no lo tragamos en silencio).
  console.error('[auth] Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(URL, ANON, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // procesa el ?code=... del callback OAuth y limpia la URL
    flowType: 'pkce',
  },
})

export const Auth = {
  /** Login con Google (OAuth). Vuelve a la raíz; el SDK canjea el code solo. */
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/' },
    })
    if (error) throw error
    return data
  },

  /** Login con email + contraseña. */
  async signInWithPassword(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  /** Registro con email + contraseña. */
  async signUpWithPassword(email, password) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + '/' },
    })
    if (error) throw error
    return data
  },

  /** Mandar email de reseteo de contraseña. */
  async resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/',
    })
    if (error) throw error
  },

  /** Usuario actual (de la sesión cacheada). null si no hay sesión. */
  async getUser() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.user ?? null
  },

  /**
   * El JWT a mandar al backend ES el access_token de Supabase.
   * getSession() refresca el token si está por vencer (cuando hay red).
   */
  async getToken() {
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token ?? null
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  /** Suscribirse a cambios de sesión. Devuelve unsubscribe. */
  onChange(cb) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null))
    return () => data?.subscription?.unsubscribe?.()
  },
}
