/**
 * Pantalla de login (Capa 1). Google OAuth + email/contraseña.
 * Estética alineada con LandingPage (gradiente + texto blanco).
 */

import { useState } from 'react'
import { Icon } from '../../components/ui/Icon'
import { Auth } from '../../services/auth'
import { getTheme } from '../../constants/themes'

export default function LoginScreen() {
  const grad = getTheme('celeste').grad
  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const google = async () => {
    setError(''); setBusy(true)
    try { await Auth.signInWithGoogle() } // redirige; no vuelve acá
    catch (e) { setError(traducir(e)); setBusy(false) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setInfo(''); setBusy(true)
    try {
      if (mode === 'signin') {
        await Auth.signInWithPassword(email.trim(), password)
        // onChange en AuthGate detecta la sesión y entra solo
      } else if (mode === 'signup') {
        const r = await Auth.signUpWithPassword(email.trim(), password)
        if (!r.session) setInfo('Te mandamos un email para confirmar tu cuenta. Revisá tu casilla.')
      } else if (mode === 'reset') {
        await Auth.resetPassword(email.trim())
        setInfo('Si el email existe, te llegó un link para resetear la contraseña.')
      }
    } catch (e) {
      setError(traducir(e))
    } finally {
      setBusy(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)',
  }

  return (
    <div className="min-h-screen flex flex-col font-[Inter]" style={{ background: grad }}>
      <div className="flex-1 max-w-[420px] mx-auto w-full flex flex-col justify-center px-6 py-12">
        <div className="text-[30px] font-black text-white leading-tight tracking-tight mb-1">
          Plan de Rodaje
        </div>
        <div className="text-[14px] text-white/50 mb-8">
          {mode === 'signup' ? 'Creá tu cuenta' : mode === 'reset' ? 'Recuperar acceso' : 'Ingresá a tu cuenta'}
        </div>

        {/* Google */}
        {mode !== 'reset' && (
          <>
            <button
              onClick={google}
              disabled={busy}
              className="tap w-full flex items-center justify-center gap-3 py-3.5 rounded-[14px] text-[15px] font-bold border-0 cursor-pointer disabled:opacity-50 mb-4"
              style={{ background: '#fff', color: '#222' }}
            >
              <GoogleG />
              Continuar con Google
            </button>

            <div className="flex items-center gap-3 my-2 text-white/40 text-xs">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.18)' }} />
              o con email
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.18)' }} />
            </div>
          </>
        )}

        <form onSubmit={submit} className="flex flex-col gap-3 mt-2">
          <input
            type="email" value={email} autoComplete="email"
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="tu@email.com" required autoFocus
            className="w-full rounded-[14px] px-4 py-3.5 text-base outline-none font-[Inter]"
            style={inputStyle}
          />
          {mode !== 'reset' && (
            <input
              type="password" value={password}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="Contraseña" required minLength={6}
              className="w-full rounded-[14px] px-4 py-3.5 text-base outline-none font-[Inter]"
              style={inputStyle}
            />
          )}

          {error && <div className="text-red-200 text-sm">{error}</div>}
          {info && <div className="text-emerald-100 text-sm">{info}</div>}

          <button
            type="submit" disabled={busy}
            className="tap w-full py-3.5 rounded-[14px] text-base font-bold text-white border-0 cursor-pointer disabled:opacity-40 mt-1"
            style={{ background: 'rgba(255,255,255,0.22)' }}
          >
            {busy ? 'Un momento…' : mode === 'signup' ? 'Crear cuenta' : mode === 'reset' ? 'Enviar link' : 'Ingresar'}
          </button>
        </form>

        {/* Cambiar de modo */}
        <div className="flex flex-col items-center gap-2 mt-6 text-sm">
          {mode === 'signin' && (
            <>
              <button onClick={() => switchTo('signup')} className="text-white/70 bg-transparent border-0 cursor-pointer">
                ¿No tenés cuenta? <span className="font-bold text-white">Crear una</span>
              </button>
              <button onClick={() => switchTo('reset')} className="text-white/40 bg-transparent border-0 cursor-pointer text-xs">
                Olvidé mi contraseña
              </button>
            </>
          )}
          {mode !== 'signin' && (
            <button onClick={() => switchTo('signin')} className="text-white/70 bg-transparent border-0 cursor-pointer">
              ← Volver a ingresar
            </button>
          )}
        </div>
      </div>
    </div>
  )

  function switchTo(m) { setMode(m); setError(''); setInfo('') }
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
    </svg>
  )
}

function traducir(e) {
  const m = (e?.message || '').toLowerCase()
  if (m.includes('invalid login')) return 'Email o contraseña incorrectos.'
  if (m.includes('already registered')) return 'Ese email ya tiene cuenta. Probá ingresar.'
  if (m.includes('email not confirmed')) return 'Confirmá tu email antes de ingresar (revisá tu casilla).'
  if (m.includes('provider is not enabled')) return 'El login con Google todavía no está habilitado.'
  if (m.includes('password')) return 'La contraseña debe tener al menos 6 caracteres.'
  return e?.message || 'Algo salió mal. Probá de nuevo.'
}
