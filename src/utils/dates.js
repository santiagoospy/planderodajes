/**
 * Parse a day label like "Domingo 25 May" into a JS Date,
 * falling back to the project's base year.
 */
export function parsearFechaDia(dateStr, fallbackYear = new Date().getFullYear()) {
  if (!dateStr) return null
  const MONTHS = {
    ene: 0, enero: 0, feb: 1, febrero: 1, mar: 2, marzo: 2,
    abr: 3, abril: 3, may: 4, mayo: 4, jun: 5, junio: 5,
    jul: 6, julio: 6, ago: 7, agosto: 7, sep: 8, septiembre: 8,
    oct: 9, octubre: 9, nov: 10, noviembre: 10, dic: 11, diciembre: 11,
  }
  const parts = dateStr.toLowerCase().split(/[\s,/]+/)
  let day = null, month = null, year = fallbackYear

  for (const part of parts) {
    if (/^\d{4}$/.test(part)) { year = parseInt(part); continue }
    if (/^\d{1,2}$/.test(part) && day === null) { day = parseInt(part); continue }
    if (MONTHS[part] !== undefined) { month = MONTHS[part]; continue }
  }

  if (day === null || month === null) return null
  return new Date(year, month, day)
}

/**
 * Format an ISO date string as a short locale date
 */
export function fechaCorta(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
  } catch {
    return iso
  }
}

/**
 * Format a timestamp (ms) as a relative or absolute time string
 */
export function fmtTs(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diffMs = now - d
  const diffMins = Math.floor(diffMs / 60_000)
  if (diffMins < 1)   return 'ahora'
  if (diffMins < 60)  return `${diffMins}m`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24)   return `${diffHrs}h`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}
