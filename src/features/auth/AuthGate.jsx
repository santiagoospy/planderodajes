/**
 * AuthGate — exige sesión para usar la app (Capa 1).
 *
 * - Mientras resuelve la sesión inicial: pantalla de carga (no parpadea login).
 * - Sin sesión: LoginScreen.
 * - Con sesión: la app.
 *
 * Offline-first: getUser() lee la sesión cacheada en localStorage, así que en
 * set sin conexión la app entra igual con la última sesión válida.
 */

import { useState, useEffect, lazy, Suspense } from 'react'
import { Auth } from '../../services/auth'
import { memberships } from '../../services/memberships'
import { LoadingScreen } from '../../components/ui/LoadingScreen'

const LoginScreen = lazy(() => import('./LoginScreen'))

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined) // undefined = cargando, null = sin sesión

  useEffect(() => {
    let alive = true
    const onUser = (u) => {
      if (!alive) return
      setUser(u)
      // Al loguear: convertir invitaciones pendientes en membresías (best-effort).
      if (u) memberships.acceptInvites().catch(() => {})
    }
    Auth.getUser().then(onUser)
    const unsub = Auth.onChange(onUser)
    return () => { alive = false; unsub() }
  }, [])

  if (user === undefined) return <LoadingScreen text="Verificando sesión…" />

  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <LoginScreen />
      </Suspense>
    )
  }

  return children
}
