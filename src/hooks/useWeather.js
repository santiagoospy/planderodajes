/**
 * Fetches weather forecast from Open-Meteo (free, no key required).
 */

import { useState, useEffect } from 'react'

const WMO_MAP = {
  0:  { icon: 'Sun',            label: 'Soleado' },
  1:  { icon: 'CloudSun',       label: 'Mayormente soleado' },
  2:  { icon: 'CloudSun',       label: 'Parcialmente nublado' },
  3:  { icon: 'Cloud',          label: 'Nublado' },
  45: { icon: 'CloudFog',       label: 'Niebla' },
  48: { icon: 'CloudFog',       label: 'Niebla intensa' },
  51: { icon: 'CloudDrizzle',   label: 'Llovizna leve' },
  53: { icon: 'CloudDrizzle',   label: 'Llovizna moderada' },
  55: { icon: 'CloudDrizzle',   label: 'Llovizna densa' },
  61: { icon: 'CloudRain',      label: 'Lluvia leve' },
  63: { icon: 'CloudRain',      label: 'Lluvia moderada' },
  65: { icon: 'CloudRain',      label: 'Lluvia intensa' },
  71: { icon: 'Snowflake',      label: 'Nevada leve' },
  73: { icon: 'Snowflake',      label: 'Nevada moderada' },
  75: { icon: 'Snowflake',      label: 'Nevada intensa' },
  80: { icon: 'CloudRain',      label: 'Chubascos leves' },
  81: { icon: 'CloudRain',      label: 'Chubascos moderados' },
  82: { icon: 'CloudRain',      label: 'Chubascos fuertes' },
  95: { icon: 'CloudLightning', label: 'Tormenta' },
  99: { icon: 'CloudLightning', label: 'Tormenta con granizo' },
}

export function wmoToInfo(code) {
  return WMO_MAP[code] ?? { icon: 'CloudSun', label: 'Variable' }
}

/**
 * @param {{ lat: number, lon: number }} location
 * @param {string[]} dates - ISO date strings to fetch
 * @returns {{ data: object|null, loading: boolean, error: string|null }}
 */
export function useWeather(location, dates = []) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!location?.lat || !location?.lon || dates.length === 0) return

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      latitude:  location.lat,
      longitude: location.lon,
      daily:     'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone:  'auto',
      start_date: dates[0],
      end_date:   dates[dates.length - 1],
    })

    fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal })
      .then(r => r.json())
      .then(json => { setData(json); setLoading(false) })
      .catch(e => {
        if (e.name !== 'AbortError') { setError(e.message); setLoading(false) }
      })

    return () => controller.abort()
  }, [location?.lat, location?.lon, dates.join(',')])

  return { data, loading, error }
}
