/**
 * Shared utilities for all Netlify Functions.
 */

const ALLOWED_HEADERS = 'Content-Type, Authorization'

/** Build a standard JSON response */
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    },
  })
}

/** Build an error response */
export function error(message, status = 400) {
  return json({ error: message }, status)
}

/** Parse JSON body safely */
export async function parseBody(req) {
  try {
    return await req.json()
  } catch {
    throw new Error('Invalid JSON body')
  }
}

/** Handle CORS preflight */
export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    },
  })
}

/** Validate required fields in a body object */
export function requireFields(body, fields) {
  const missing = fields.filter(f => body[f] == null || body[f] === '')
  if (missing.length) throw new Error(`Missing required fields: ${missing.join(', ')}`)
}
