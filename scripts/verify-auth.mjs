/**
 * Verificación E2E del modelo de identidad/membresía contra `netlify dev` (8888).
 * Crea usuarios de prueba con la service key, se loguea, y ejercita claim +
 * enforcement. Limpia todo al final. NO se deploya — es solo para verificar.
 *
 * Uso: node scripts/verify-auth.mjs   (con `netlify dev` corriendo)
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// ── cargar .env a mano ──
const env = {}
for (const line of readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2]
}
const URL_ = env.SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const SERVICE = env.SUPABASE_SERVICE_KEY
const BASE = 'http://localhost:8888/.netlify/functions'
const sha = s => createHash('sha256').update(String(s), 'utf8').digest('hex')

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } })

let pass = 0, fail = 0
const ok  = (msg) => { console.log('  ✅', msg); pass++ }
const bad = (msg) => { console.log('  ❌', msg); fail++ }
const check = (cond, msg) => cond ? ok(msg) : bad(msg)

async function mkUser(email, password) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw new Error('createUser: ' + error.message)
  const anon = createClient(URL_, ANON, { auth: { persistSession: false } })
  const { data: s, error: e2 } = await anon.auth.signInWithPassword({ email, password })
  if (e2) throw new Error('signIn: ' + e2.message)
  return { id: data.user.id, token: s.session.access_token }
}

async function call(path, token, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...opts,
  })
  let body = null; try { body = await res.json() } catch {}
  return { status: res.status, body }
}

const PROD = 'zzz-verif-' + Date.now()
const PWD = 'clave1234'
let userA, userB

try {
  console.log('\n— Setup —')
  userA = await mkUser(`verifA_${Date.now()}@example.com`, 'passwordA1')
  userB = await mkUser(`verifB_${Date.now()}@example.com`, 'passwordB1')
  ok('dos usuarios de prueba creados y logueados')

  console.log('\n— 1. Crear productora (usuario logueado puede) —')
  const create = await call('/data', userA.token, {
    method: 'POST',
    body: JSON.stringify({ store: 'productoras', key: PROD, value: { id: PROD, name: 'Verif', passwordHash: sha(PWD) } }),
  })
  check(create.status === 200, `crear productora → ${create.status}`)

  console.log('\n— 2. Reclamo —')
  const claimBad = await call('/claim-productora', userA.token, { method: 'POST', body: JSON.stringify({ productoraId: PROD, password: 'mal' }) })
  check(claimBad.status === 403, `reclamo con contraseña INCORRECTA → ${claimBad.status} (debe 403)`)
  const claimOk = await call('/claim-productora', userA.token, { method: 'POST', body: JSON.stringify({ productoraId: PROD, password: PWD }) })
  check(claimOk.status === 200 && claimOk.body?.role === 'owner', `reclamo con contraseña correcta → ${claimOk.status} role=${claimOk.body?.role}`)
  const claimBwrong = await call('/claim-productora', userB.token, { method: 'POST', body: JSON.stringify({ productoraId: PROD, password: 'mal' }) })
  check(claimBwrong.status === 403, `userB con contraseña incorrecta → ${claimBwrong.status} (debe 403, queda afuera)`)

  console.log('\n— 3. Crear un proyecto en esa productora (owner puede) —')
  const proj = 'proj-verif-' + Date.now()
  const pc = await call('/data', userA.token, { method: 'POST', body: JSON.stringify({ store: 'projects', key: proj, value: { id: proj, title: 'P', productoraId: PROD } }) })
  check(pc.status === 200, `owner crea proyecto → ${pc.status}`)

  console.log('\n— 4. Enforcement de lectura —')
  const readA = await call(`/data?store=projects&key=${proj}`, userA.token)
  check(readA.status === 200 && readA.body?.title === 'P', `owner LEE su proyecto → ${readA.status}`)
  const readB = await call(`/data?store=projects&key=${proj}`, userB.token)
  check(readB.status === 403, `userB (NO miembro) intenta leer el proyecto → ${readB.status} (debe 403)`)

  console.log('\n— 5. list-projects filtra por membresía —')
  const listA = await call('/list-projects', userA.token)
  const seesA = (listA.body?.projects || []).some(p => p.id === proj)
  check(listA.status === 200 && seesA, `userA ve su proyecto en la lista → ${seesA}`)
  const listB = await call('/list-projects', userB.token)
  const seesB = (listB.body?.projects || []).some(p => p.id === proj)
  check(listB.status === 200 && !seesB, `userB NO ve el proyecto ajeno en su lista → ${!seesB}`)

  console.log('\n— 6. userB entra con la MISMA contraseña → queda MIEMBRO —')
  const joinB = await call('/claim-productora', userB.token, { method: 'POST', body: JSON.stringify({ productoraId: PROD, password: PWD }) })
  check(joinB.status === 200 && joinB.body?.role === 'member', `userB entra con contraseña correcta → ${joinB.status} role=${joinB.body?.role} (debe member)`)
  const readB2 = await call(`/data?store=projects&key=${proj}`, userB.token)
  check(readB2.status === 200, `userB ahora SÍ lee el proyecto (ya es miembro) → ${readB2.status}`)
  const reJoinA = await call('/claim-productora', userA.token, { method: 'POST', body: JSON.stringify({ productoraId: PROD, password: PWD }) })
  check(reJoinA.status === 200 && reJoinA.body?.role === 'owner', `userA re-entra → sigue owner (idempotente) → role=${reJoinA.body?.role}`)

  // limpiar blobs de prueba
  await call('/data', userA.token, { method: 'POST', body: JSON.stringify({ store: 'projects', key: proj, delete: true }) })
  await call('/data', userA.token, { method: 'POST', body: JSON.stringify({ store: 'productoras', key: PROD, delete: true }) })
} catch (e) {
  bad('EXCEPCIÓN: ' + e.message)
} finally {
  console.log('\n— Limpieza —')
  try {
    await admin.from('memberships').delete().eq('productora_id', PROD)
    await admin.from('invites').delete().eq('productora_id', PROD)
    if (userA) await admin.auth.admin.deleteUser(userA.id)
    if (userB) await admin.auth.admin.deleteUser(userB.id)
    ok('usuarios y membresías de prueba borrados')
  } catch (e) { bad('limpieza: ' + e.message) }
  console.log(`\nRESULTADO: ${pass} ✅  ${fail} ❌\n`)
  process.exit(fail ? 1 : 0)
}
