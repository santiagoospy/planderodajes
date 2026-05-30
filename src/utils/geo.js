/**
 * Haversine distance between two lat/lon points in km
 */
export function distanciaEnKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Extract lat/lon from a Google Maps URL
 * @returns {{ lat: number, lon: number } | null}
 */
export function extraerCoordsDeGoogleMaps(url) {
  if (!url) return null
  const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) return { lat: parseFloat(match[1]), lon: parseFloat(match[2]) }
  return null
}

/**
 * Estimated transit time in minutes (60 km/h avg + 15 min equipment buffer)
 */
export function calcularTrasladoMinutos(km) {
  if (!km || km <= 0) return 0
  return Math.round((km / 60) * 60) + 15
}
