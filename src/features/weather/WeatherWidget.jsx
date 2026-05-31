import { useState, useEffect, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'

// ── WMO weather code → display info ─────────────────────────
function wmoToInfo(code) {
  if (code === 0)                              return { ic:'Sun',            txt:'Soleado',        bg:'#fff7e0', border:'#f5d76e', accent:'#c08600' }
  if ([1,2].includes(code))                   return { ic:'CloudSun',       txt:'Mayor. soleado', bg:'#fdf3d7', border:'#eecf6e', accent:'#a87e1f' }
  if (code === 3)                             return { ic:'Cloud',          txt:'Nublado',        bg:'#eef0f3', border:'#d0d4da', accent:'#5a6470' }
  if ([45,48].includes(code))                 return { ic:'CloudFog',       txt:'Niebla',         bg:'#ecedef', border:'#cbcdd2', accent:'#6a6f78' }
  if ([51,53,55,56,57].includes(code))        return { ic:'CloudDrizzle',   txt:'Llovizna',       bg:'#e3edf7', border:'#a8c4e0', accent:'#3568a0' }
  if ([61,63,65,66,67].includes(code))        return { ic:'CloudRain',      txt:'Lluvia',         bg:'#dde9f5', border:'#8eb0d4', accent:'#2a5790' }
  if ([71,73,75,77].includes(code))           return { ic:'Snowflake',      txt:'Nieve',          bg:'#eaf2f8', border:'#bcd5e8', accent:'#3a6a92' }
  if ([80,81,82].includes(code))              return { ic:'CloudRain',      txt:'Chubascos',      bg:'#dde9f5', border:'#8eb0d4', accent:'#2a5790' }
  if ([85,86].includes(code))                 return { ic:'CloudSnow',      txt:'Nevadas',        bg:'#eaf2f8', border:'#bcd5e8', accent:'#3a6a92' }
  if ([95,96,99].includes(code))              return { ic:'CloudLightning', txt:'Tormenta',       bg:'#dad6e6', border:'#9b91bc', accent:'#3e3270' }
  return { ic:'CloudSun', txt:'Variable', bg:'#eef0f3', border:'#d0d4da', accent:'#5a6470' }
}

// ── Parse a day "date" string → YYYY-MM-DD ───────────────────
function parsearFechaDia(dateStr, fallbackYear = new Date().getFullYear()) {
  if (!dateStr) return null
  const s = dateStr.toLowerCase().trim()
  const iso = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2,'0')}-${String(iso[3]).padStart(2,'0')}`
  const slash = s.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
  if (slash) {
    const y = slash[3] ? (slash[3].length===2 ? '20'+slash[3] : slash[3]) : fallbackYear
    return `${y}-${String(slash[2]).padStart(2,'0')}-${String(slash[1]).padStart(2,'0')}`
  }
  const meses = { ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11 }
  const txt = s.match(/(\d{1,2})\s*(?:de\s+)?([a-zñ]+)(?:\s+(\d{4}))?/)
  if (txt) {
    const dia = parseInt(txt[1])
    const mesKey = txt[2].normalize('NFD').replace(/[̀-ͯ]/g,'').slice(0,3)
    const mes = meses[mesKey]
    const año = txt[3] ? parseInt(txt[3]) : fallbackYear
    if (mes !== undefined && dia >= 1 && dia <= 31)
      return `${año}-${String(mes+1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`
  }
  return null
}

function fechaCorta(iso) {
  if (!iso) return ''
  const [y,m,d] = iso.split('-').map(Number)
  return new Date(y, m-1, d)
    .toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short' })
    .replace('.','')
}

// ── Single location card ─────────────────────────────────────
function WeatherLocationCard({ loc, projectDays, isAdmin, onUpdate, onDelete }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [editing, setEditing] = useState(false)

  const customDates = loc.customDates || []
  const fechasProyecto = (projectDays || [])
    .map(d => ({ label: d.label, raw: d.date, fecha: parsearFechaDia(d.date) }))
    .filter(x => x.fecha)
  const usarCustom = customDates.length > 0
  const fechasFinales = usarCustom
    ? customDates.map(f => ({ label: fechaCorta(f), raw: f, fecha: f }))
    : fechasProyecto

  useEffect(() => {
    if (fechasFinales.length === 0) { setData(null); return }
    setLoading(true); setError('')
    const fechas = fechasFinales.map(x => x.fecha).sort()
    const start = fechas[0], end = fechas[fechas.length-1]
    const hoy = new Date().toISOString().slice(0,10)
    const baseUrl = end >= hoy
      ? 'https://api.open-meteo.com/v1/forecast'
      : 'https://archive-api.open-meteo.com/v1/archive'
    const params = new URLSearchParams({
      latitude: loc.lat, longitude: loc.lon,
      start_date: start, end_date: end,
      daily: 'weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      hourly: 'precipitation_probability',
      timezone: 'auto',
    })
    fetch(`${baseUrl}?${params}`)
      .then(r => r.json())
      .then(j => { if (j.error) throw new Error(j.reason||'API error'); setData(j); setLoading(false) })
      .catch(() => { setError('No se pudo cargar'); setLoading(false) })
  }, [loc.lat, loc.lon, JSON.stringify(fechasFinales.map(x=>x.fecha))])

  const agregarFecha = (iso) => {
    if (!iso) return
    const nuevas = [...customDates, iso].filter((v,i,a)=>a.indexOf(v)===i).sort()
    onUpdate({ ...loc, customDates: nuevas })
  }
  const quitarFecha = (iso) => onUpdate({ ...loc, customDates: customDates.filter(f=>f!==iso) })

  return (
    <div style={{ background:'var(--bg-secondary)', borderRadius:12, border:'1px solid var(--border-light)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', borderBottom:'1px solid var(--border-light)' }}>
        <span style={{ fontSize:11, color:'var(--text-tertiary)', flex:1, fontWeight:700, fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
          <Icon name="MapPin" size={11} color="currentColor"/> {loc.name}
        </span>
        {isAdmin && (
          <>
            <button onClick={() => setEditing(!editing)} style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', padding:'2px 4px' }}>
              <Icon name="Calendar" size={14} color="currentColor"/>
            </button>
            <button onClick={() => { if(confirm(`¿Quitar ${loc.name}?`)) onDelete() }} style={{ background:'none', border:'none', color:'var(--color-primary)', fontSize:12, cursor:'pointer', padding:'2px 4px' }}>✕</button>
          </>
        )}
      </div>

      {/* Date editor */}
      {editing && isAdmin && (
        <div style={{ padding:'10px 12px', background:'var(--bg-card)', borderBottom:'1px solid var(--border-light)' }}>
          <div style={{ fontSize:10, color:'#aaa', letterSpacing:'0.06em', marginBottom:6, fontFamily:'inherit' }}>
            FECHAS {usarCustom ? '(custom)' : '(días del proyecto)'}
          </div>
          {customDates.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
              {customDates.map(f => (
                <span key={f} style={{ fontSize:11, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:8, padding:'3px 8px', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit' }}>
                  {fechaCorta(f)}
                  <button onClick={() => quitarFecha(f)} style={{ background:'none', border:'none', color:'var(--color-primary)', fontSize:11, cursor:'pointer', padding:0 }}>✕</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            <input type="date" onChange={e => { if(e.target.value) { agregarFecha(e.target.value); e.target.value='' } }}
              style={{ flex:1, fontFamily:'inherit', fontSize:11, background:'var(--bg-secondary)', border:'1px solid var(--border-light)', borderRadius:8, padding:'5px 8px', color:'var(--text-primary)', outline:'none' }}/>
            <button onClick={() => setEditing(false)} style={{ fontFamily:'inherit', fontSize:10, background:'var(--bg-card)', color:'var(--text-tertiary)', border:'none', borderRadius:8, padding:'5px 9px', cursor:'pointer' }}>Listo</button>
          </div>
          {customDates.length > 0 && (
            <button onClick={() => onUpdate({ ...loc, customDates:[] })} style={{ marginTop:6, fontFamily:'inherit', fontSize:10, color:'var(--text-tertiary)', background:'none', border:'none', cursor:'pointer', padding:0 }}>
              ↺ Usar días del proyecto
            </button>
          )}
        </div>
      )}

      {/* States */}
      {loading && (
        <div style={{ padding:'14px', fontSize:11, color:'var(--text-muted)', textAlign:'center', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <Icon name="Loader" size={11} color="currentColor"/> Cargando…
        </div>
      )}
      {error && (
        <div style={{ padding:'10px 12px', fontSize:11, color:'var(--color-primary)', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
          <Icon name="AlertTriangle" size={11} color="var(--color-primary)"/> {error}
        </div>
      )}
      {fechasFinales.length === 0 && (
        <div style={{ padding:'12px', fontSize:11, color:'#aaa', fontFamily:'inherit', textAlign:'center', fontStyle:'italic' }}>
          {isAdmin ? 'Tocá el calendario para elegir fechas' : 'Sin fechas configuradas'}
        </div>
      )}

      {/* Forecast rows */}
      {data?.daily && fechasFinales.length > 0 && (
        <div style={{ padding:8 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {fechasFinales.map(({ label, fecha }) => {
              const idx = data.daily.time.indexOf(fecha)
              if (idx < 0) return (
                <div key={fecha} style={{ background:'var(--bg-card)', borderRadius:8, padding:'6px 10px', fontSize:10, color:'#aaa', fontFamily:'inherit' }}>
                  {label} — fuera de rango
                </div>
              )
              const code = data.daily.weathercode[idx]
              const info = wmoToInfo(code)
              const tMax = Math.round(data.daily.temperature_2m_max[idx])
              const tMin = Math.round(data.daily.temperature_2m_min[idx])
              const probDia = data.daily.precipitation_probability_max?.[idx] ?? null

              // AM/PM rain detail
              let detalle = ''
              if (data.hourly?.time) {
                const horasDia = data.hourly.time
                  .map((t,i) => ({ t, prob: data.hourly.precipitation_probability?.[i]||0 }))
                  .filter(h => h.t.startsWith(fecha))
                if (horasDia.length) {
                  const mañana = horasDia.filter(h => { const hh=parseInt(h.t.slice(11,13)); return hh>=6&&hh<13 })
                  const tarde  = horasDia.filter(h => { const hh=parseInt(h.t.slice(11,13)); return hh>=13&&hh<20 })
                  const probM = mañana.length ? Math.max(...mañana.map(h=>h.prob)) : 0
                  const probT = tarde.length  ? Math.max(...tarde.map(h=>h.prob))  : 0
                  if (probM>=50 && probT<50)       detalle = `lluvia AM (${probM}%)`
                  else if (probT>=50 && probM<50)  detalle = `lluvia PM (${probT}%)`
                  else if (probM>=50 && probT>=50) detalle = 'lluvia todo el día'
                  else if (probM<30 && probT<30)   detalle = 'estable'
                }
              }

              return (
                <div key={fecha} style={{ background:info.bg, borderRadius:8, padding:'7px 10px', display:'flex', alignItems:'center', gap:9, border:`1px solid ${info.border}` }}>
                  <Icon name={info.ic} size={22} color={info.accent}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                      <span style={{ fontSize:11, fontWeight:700, color:info.accent, fontFamily:'inherit' }}>{label}</span>
                      <span style={{ fontSize:10, color:info.accent, opacity:0.6, fontFamily:'inherit' }}>{info.txt}</span>
                    </div>
                    {detalle && <div style={{ fontSize:9, color:info.accent, opacity:0.75, fontFamily:'inherit', marginTop:1 }}>{detalle}</div>}
                  </div>
                  <div style={{ textAlign:'right', fontFamily:'inherit', flexShrink:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:info.accent }}>{tMax}°<span style={{ opacity:0.5 }}>/{tMin}°</span></div>
                    {probDia!=null && probDia>0 && (
                      <div style={{ fontSize:9, color:info.accent, opacity:0.7, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:2 }}>
                        <Icon name="Droplets" size={9} color={info.accent}/> {probDia}%
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main widget ──────────────────────────────────────────────
export default function WeatherWidget({ project, isAdmin, onUpdateProject }) {
  const locs = project.weatherLocations
    || (project.weatherLocation ? [{ id:'wl_legacy', ...project.weatherLocation, customDates:[] }] : [])

  const updateLoc = (id, newLoc) =>
    onUpdateProject({ ...project, weatherLocations: locs.map(l => l.id===id ? newLoc : l) })

  const deleteLoc = (id) =>
    onUpdateProject({ ...project, weatherLocations: locs.filter(l => l.id!==id) })

  const [adding, setAdding]           = useState(false)
  const [city, setCity]               = useState('')
  const [busy, setBusy]               = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [showSug, setShowSug]         = useState(false)
  const searchTimer                   = useRef(null)

  const handleCityChange = (val) => {
    setCity(val); setSuggestions([]); setShowSug(false)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (val.trim().length < 2) return
    searchTimer.current = setTimeout(async () => {
      setBusy(true)
      try {
        const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(val.trim())}&count=8&language=es`)
        const j = await r.json()
        if (j.results?.length) {
          setSuggestions(j.results.map(g => ({
            id: 'wl_'+g.id+'_'+Date.now(),
            name: `${g.name}${g.admin1?', '+g.admin1:''}${g.country?', '+g.country:''}`,
            lat: g.latitude, lon: g.longitude, customDates: []
          })))
          setShowSug(true)
        }
      } catch {}
      setBusy(false)
    }, 400)
  }

  const selectSuggestion = (loc) => {
    onUpdateProject({ ...project, weatherLocations: [...locs, { ...loc, id:'wl_'+Date.now() }] })
    setCity(''); setAdding(false); setSuggestions([]); setShowSug(false)
  }

  if (locs.length === 0 && !isAdmin) return null

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.12em', fontFamily:'inherit', display:'flex', alignItems:'center', gap:5 }}>
          <Icon name="CloudSun" size={11} color="var(--text-muted)"/> CLIMA EN RODAJE
        </div>
        {isAdmin && !adding && (
          <button onClick={() => setAdding(true)}
            style={{ fontFamily:'inherit', fontSize:10, color:'#2f7ed8', background:'none', border:'1px solid #2f7ed844', borderRadius:14, padding:'3px 10px', cursor:'pointer', fontWeight:700 }}>
            + Ciudad
          </button>
        )}
      </div>

      {adding && (
        <div style={{ position:'relative', marginBottom:8 }}>
          <div style={{ display:'flex', gap:5 }}>
            <input value={city} onChange={e => handleCityChange(e.target.value)} autoFocus
              onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); } if(e.key==='Escape'){ setAdding(false); setCity(''); setSuggestions([]) } }}
              placeholder="Buscar ciudad…"
              style={{ flex:1, fontFamily:'inherit', fontSize:14, background:'#1a3a50', border:'2px solid rgba(255,255,255,0.4)', borderRadius:8, padding:'9px 12px', color:'#fff', outline:'none', fontWeight:600 }}/>
            <button onClick={() => { setAdding(false); setCity(''); setSuggestions([]); setShowSug(false) }}
              style={{ fontFamily:'inherit', fontSize:11, background:'rgba(255,255,255,0.15)', color:'#fff', border:'none', borderRadius:8, padding:'9px 12px', cursor:'pointer' }}>✕</button>
          </div>
          {busy && (
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', padding:'4px 2px', fontFamily:'inherit', display:'flex', alignItems:'center', gap:4 }}>
              <Icon name="Search" size={11} color="rgba(255,255,255,0.6)"/> Buscando...
            </div>
          )}
          {showSug && suggestions.length > 0 && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'#fff', borderRadius:10, boxShadow:'0 8px 24px rgba(0,0,0,0.25)', zIndex:200, overflow:'hidden', marginTop:4, border:'1px solid var(--border-light)' }}>
              {suggestions.map((s, i) => (
                <button key={s.id} onClick={() => selectSuggestion(s)}
                  style={{ display:'flex', alignItems:'center', gap:6, width:'100%', fontFamily:'inherit', fontSize:13, color:'#1a1714', background:i%2===0?'#fff':'#faf8f5', border:'none', borderBottom:i<suggestions.length-1?'1px solid #f0ede8':'none', padding:'11px 14px', cursor:'pointer', textAlign:'left', fontWeight:600 }}>
                  <Icon name="MapPin" size={12} color="currentColor"/> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {locs.length === 0 ? (
        <div style={{ background:'var(--bg-secondary)', borderRadius:10, padding:'10px 12px', border:'1px dashed var(--border-light)', fontSize:11, color:'#aaa', fontFamily:'inherit', textAlign:'center' }}>
          {isAdmin ? 'Tocá "+ Ciudad" para agregar una ubicación' : 'Sin clima configurado'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {locs.map(loc => (
            <WeatherLocationCard key={loc.id} loc={loc} projectDays={project.days} isAdmin={isAdmin}
              onUpdate={nl => updateLoc(loc.id, nl)} onDelete={() => deleteLoc(loc.id)}/>
          ))}
        </div>
      )}
    </div>
  )
}
