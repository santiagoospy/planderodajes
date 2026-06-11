// Content-Security-Policy dinámico (Capa 3).
// Estricto en producción; en localhost afloja lo justo para el HMR de Vite.
//
// ⚠️ ROLLOUT: arranca en modo REPORT-ONLY (reporta violaciones en la consola sin
// bloquear nada). Verificá en prod que TODO anda (login, export PDF/Excel, subir
// fotos, cámara, clima, mapas) y que la consola no tira violations en flujos
// legítimos. Recién ahí poné REPORT_ONLY = false para que empiece a bloquear.

const REPORT_ONLY = true

const SUPABASE = 'https://edkustriidxptxdkivpv.supabase.co'
const R2 = 'https://b55ca17d3e570f6641f664f1fdc1fc58.r2.cloudflarestorage.com'

const ORIGINS = {
  script:  ['https://cdnjs.cloudflare.com', 'https://accounts.google.com'], // xlsx + Google login
  style:   ['https://fonts.googleapis.com'],
  font:    ['https://fonts.gstatic.com'],
  connect: [
    SUPABASE,
    R2,
    'https://api.open-meteo.com',
    'https://archive-api.open-meteo.com',
    'https://geocoding-api.open-meteo.com',
    'https://accounts.google.com',
    'https://oauth2.googleapis.com',
  ],
  frame:   ['https://accounts.google.com'],
}

function buildCsp(isDev) {
  const script  = ["'self'", ...ORIGINS.script]
  const connect = ["'self'", ...ORIGINS.connect]

  if (isDev) {
    script.push("'unsafe-inline'", "'unsafe-eval'") // React Refresh preamble + eval
    connect.push('ws:', 'wss:')                     // HMR websocket
  }

  const directives = [
    `default-src 'self'`,
    `script-src ${script.join(' ')}`,
    `style-src 'self' 'unsafe-inline' ${ORIGINS.style.join(' ')}`, // inline styles de React
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data: ${ORIGINS.font.join(' ')}`,
    `connect-src ${connect.join(' ')}`,
    `frame-src ${ORIGINS.frame.join(' ')}`,
    `media-src 'self' blob:`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ]
  if (!isDev) directives.push('upgrade-insecure-requests')

  return directives.join('; ')
}

// Headers de seguridad para el documento HTML. Se setean acá (no en netlify.toml)
// porque con edge functions el pipeline de headers de netlify.toml no llega a la
// salida. El edge function sí setea headers de forma confiable.
const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // La app usa cámara (continuidad/claqueta/visor) y geolocalización (sol/clima):
  // se permiten para el propio origen; el resto se bloquea.
  'Permissions-Policy':
    'camera=(self), geolocation=(self), gyroscope=(self), accelerometer=(self), microphone=(), payment=(), usb=()',
}

export default async (request, context) => {
  const response = await context.next()
  // El CSP solo gobierna documentos HTML; no tocar assets ni JSON.
  if (!(response.headers.get('content-type') || '').includes('text/html')) return response

  const host = new URL(request.url).hostname
  const isDev = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')

  for (const [k, v] of Object.entries(SECURITY_HEADERS)) response.headers.set(k, v)

  const header = REPORT_ONLY ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy'
  response.headers.set(header, buildCsp(isDev))
  return response
}

export const config = { path: '/*', excludedPath: ['/.netlify/*', '/assets/*'] }
