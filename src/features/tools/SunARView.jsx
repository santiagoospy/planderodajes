import { useState, useEffect, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'

// ═══════════════════════════════════════════════════════════
//  SUN AR VIEW — cámara real + arco AR responsive al giroscopio
// ═══════════════════════════════════════════════════════════
export default function SunARView({ project, onBack }) {
  const [heading, setHeading]   = useState(180) // brújula
  const [pitch, setPitch]       = useState(0)   // inclinación vertical
  const [location, setLocation] = useState(null)
  const [camError, setCamError] = useState(false)
  const [now, setNow]           = useState(new Date())
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)
  const headingRef = useRef(180)
  const pitchRef   = useRef(0)
  const locationRef = useRef(null)
  // Calibración manual de brújula (corrige declinación magnética y desvíos del sensor).
  // Se guarda por dispositivo. El usuario alinea una vez con el sol real y queda fijo.
  const [calib, setCalib] = useState(() => {
    const v = parseFloat(localStorage.getItem('sunar-calib')); return isNaN(v) ? 0 : v
  })
  const calibRef = useRef(0)
  useEffect(() => { calibRef.current = calib }, [calib])
  const [compassAcc, setCompassAcc] = useState(null) // precisión reportada por iOS
  const adjustCalib = (delta) => {
    setCalib(prev => {
      let v = Math.round((prev + delta) * 10) / 10
      if (v > 90) v = 90; if (v < -90) v = -90
      try { localStorage.setItem('sunar-calib', String(v)) } catch {}
      calibRef.current = v
      setHeading(Math.round((headingRef.current + v + 360) % 360))
      return v
    })
  }
  const resetCalib = () => {
    try { localStorage.setItem('sunar-calib', '0') } catch {}
    calibRef.current = 0
    setCalib(0)
    setHeading(Math.round((headingRef.current + 360) % 360))
  }

  // Cámara
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      } catch (e) { console.warn('Cam:', e); setCamError(true) }
    })()
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  // GPS
  useEffect(() => {
    if (!navigator.geolocation) { locationRef.current = { lat: -25.2867, lng: -57.6470 }; setLocation(locationRef.current); return }
    navigator.geolocation.getCurrentPosition(
      pos => { locationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setLocation(locationRef.current) },
      () => { locationRef.current = { lat: -25.2867, lng: -57.6470 }; setLocation(locationRef.current) }
    )
  }, [])

  // Brújula + pitch (beta = inclinación hacia adelante)
  useEffect(() => {
    // Suavizado angular (low-pass circular): toma el camino corto entre ángulos
    const smoothAngle = (prev, next, f) => {
      let diff = ((next - prev + 540) % 360) - 180
      return (prev + diff * f + 360) % 360
    }
    const screenAngle = () => {
      try {
        if (screen.orientation && typeof screen.orientation.angle === 'number') return screen.orientation.angle
        if (typeof window.orientation === 'number') return window.orientation
      } catch {}
      return 0
    }
    const handle = (e) => {
      let raw = null
      if (e.webkitCompassHeading != null) {
        // iOS: heading magnético ya corregido por orientación de pantalla.
        raw = e.webkitCompassHeading
        if (e.webkitCompassAccuracy != null) setCompassAcc(e.webkitCompassAccuracy)
      } else if (e.alpha != null) {
        // Android/otros: compensar la rotación de pantalla manualmente.
        raw = (360 - e.alpha + screenAngle() + 360) % 360
      }
      if (raw != null) {
        // Suavizar para quitar tembleque del magnetómetro
        headingRef.current = smoothAngle(headingRef.current, raw, 0.25)
        const eff = (headingRef.current + calibRef.current + 360) % 360
        setHeading(Math.round(eff))
      }
      if (e.beta != null) {
        // Suavizar también la inclinación
        pitchRef.current = pitchRef.current + (e.beta - pitchRef.current) * 0.3
        setPitch(pitchRef.current)
      }
    }
    const setup = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try { const p = await DeviceOrientationEvent.requestPermission(); if (p === 'granted') { window.addEventListener('deviceorientationabsolute', handle, true); window.addEventListener('deviceorientation', handle, true) } } catch {}
      } else {
        window.addEventListener('deviceorientationabsolute', handle, true)
        window.addEventListener('deviceorientation', handle, true)
      }
    }
    setup()
    return () => { window.removeEventListener('deviceorientationabsolute', handle, true); window.removeEventListener('deviceorientation', handle, true) }
  }, [])

  // Actualizar reloj cada minuto
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(id)
  }, [])

  // Poll para detectar cuando SunCalc termina de cargar (CDN async) y forzar re-render del panel inferior
  useEffect(() => {
    if (window.SunCalc) return
    let tries = 0
    const id = setInterval(() => {
      tries++
      if (window.SunCalc) { setNow(new Date()); clearInterval(id) }
      else if (tries > 60) { clearInterval(id) } // 30s máx
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Estado del sol actual para mostrar en panel
  const [sunInfo, setSunInfo] = useState({ az: 0, alt: 0, inView: false, dx: 0, dy: 0 })

  // ── Loop de dibujo AR en canvas ────────────────────────────
  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }

      const W = canvas.offsetWidth  || window.innerWidth
      const H = canvas.offsetHeight || window.innerHeight
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H }

      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      // Esperar SunCalc
      const SC = window.SunCalc
      if (!SC) { rafRef.current = requestAnimationFrame(draw); return }

      // Usar ubicación disponible (GPS o fallback inmediato)
      const loc = locationRef.current || { lat: -25.2867, lng: -57.6470 }

      const date  = new Date()
      let times
      try { times = SC.getTimes(date, loc.lat, loc.lng) }
      catch (e) { rafRef.current = requestAnimationFrame(draw); return }

      if (!times.sunrise || isNaN(times.sunrise)) { rafRef.current = requestAnimationFrame(draw); return }

      const HFOV = 62   // FOV horizontal aproximado de cámara trasera
      const VFOV = 48   // FOV vertical
      const hdg  = (headingRef.current + calibRef.current + 360) % 360 // + calibración manual

      // ── PITCH: convertir beta (0=plano, 90=vertical) en "ángulo donde apunta el centro de cámara"
      let cameraAlt = 90 - pitchRef.current
      if (cameraAlt > 89)  cameraAlt = 89
      if (cameraAlt < -89) cameraAlt = -89

      // azimut/altitud reales → píxel en pantalla (proyección plana simple)
      const toScreen = (azDeg, altDeg) => {
        const azDiff   = ((azDeg - hdg) + 540) % 360 - 180
        const altDiff  = altDeg - cameraAlt
        return {
          x: W / 2 + (azDiff  / HFOV) * W,
          y: H / 2 - (altDiff / VFOV) * H,
          azDiff, altDiff
        }
      }

      // ── Línea de horizonte (alt=0) ────────────────────────
      {
        const hzY = H / 2 - (0 - cameraAlt) / VFOV * H
        if (hzY > -50 && hzY < H + 50) {
          ctx.strokeStyle = 'rgba(255,255,255,0.18)'
          ctx.lineWidth = 1
          ctx.setLineDash([6, 8])
          ctx.beginPath()
          ctx.moveTo(0, hzY); ctx.lineTo(W, hzY)
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.font = '10px Inter,sans-serif'
          ctx.textAlign = 'left'
          ctx.fillText('horizonte', 12, hzY - 4)
        }
      }

      // ── Arco completo de la trayectoria ───────────────────
      const sr = times.sunrise.getTime()
      const ss = times.sunset.getTime()
      const totalMin = (ss - sr) / 60000
      const arcPts = []
      for (let m = 0; m <= totalMin; m += 4) {
        const t   = new Date(sr + m * 60000)
        const pos = SC.getPosition(t, loc.lat, loc.lng)
        const az  = ((pos.azimuth * 180 / Math.PI) + 180 + 360) % 360
        const alt = pos.altitude * 180 / Math.PI
        arcPts.push({ az, alt })
      }

      // Dibujar arco — solo segmentos dentro del FOV extendido
      if (arcPts.length > 1) {
        ctx.strokeStyle = '#FFD050'
        ctx.lineWidth   = 3.5
        ctx.shadowColor = 'rgba(255, 208, 80, 0.7)'
        ctx.shadowBlur  = 10
        ctx.lineCap     = 'round'
        ctx.lineJoin    = 'round'
        ctx.beginPath()
        let penDown = false
        for (const p of arcPts) {
          const azDiff = ((p.az - hdg) + 540) % 360 - 180
          const sp = toScreen(p.az, p.alt)
          if (Math.abs(azDiff) > HFOV * 1.5) { penDown = false; continue }
          if (!penDown) { ctx.moveTo(sp.x, sp.y); penDown = true }
          else          { ctx.lineTo(sp.x, sp.y) }
        }
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // ── Sol actual ────────────────────────────────────────
      const nowPos = SC.getPosition(date, loc.lat, loc.lng)
      const nowAz  = ((nowPos.azimuth * 180 / Math.PI) + 180 + 360) % 360
      const nowAlt = nowPos.altitude * 180 / Math.PI
      const nowAzDiff = ((nowAz - hdg) + 540) % 360 - 180
      const nowAltDiff = nowAlt - cameraAlt
      const sunInView = Math.abs(nowAzDiff) < HFOV / 2 && Math.abs(nowAltDiff) < VFOV / 2 && nowAlt > -2

      if (sunInView) {
        const sp = toScreen(nowAz, nowAlt)
        // Glow exterior
        const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 50)
        g.addColorStop(0, 'rgba(255,220,80,0.55)')
        g.addColorStop(1, 'rgba(255,220,80,0)')
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 50, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        // Círculo sólido
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 18, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD050'
        ctx.shadowColor = 'rgba(255,208,80,1)'; ctx.shadowBlur = 25
        ctx.fill(); ctx.shadowBlur = 0
        // Etiqueta hora actual
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'
        ctx.font = 'bold 13px Inter,sans-serif'
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 6
        ctx.fillText('AHORA', sp.x, sp.y - 30)
        ctx.shadowBlur = 0
      } else if (nowAlt > -2) {
        // ── Flecha indicadora si el sol está FUERA del FOV ─────
        const dx = nowAzDiff / HFOV   // unidades de medio-FOV
        const dy = -nowAltDiff / VFOV
        const angle = Math.atan2(dy, dx)
        const m = 70
        const cx = W / 2, cy = H / 2
        const maxX = (W / 2 - m)
        const maxY = (H / 2 - m)
        const tx = Math.abs(maxX / Math.cos(angle))
        const ty = Math.abs(maxY / Math.sin(angle))
        const t  = Math.min(tx, ty)
        const ax = cx + Math.cos(angle) * t
        const ay = cy + Math.sin(angle) * t

        // Círculo de fondo
        ctx.beginPath(); ctx.arc(ax, ay, 28, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 208, 80, 0.18)'; ctx.fill()
        ctx.strokeStyle = '#FFD050'; ctx.lineWidth = 2
        ctx.stroke()

        // Sol pequeño en el centro del círculo
        ctx.beginPath(); ctx.arc(ax, ay, 9, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD050'
        ctx.shadowColor = 'rgba(255,208,80,0.9)'; ctx.shadowBlur = 12
        ctx.fill(); ctx.shadowBlur = 0

        // Flecha apuntando hacia donde está el sol (hacia afuera del círculo)
        ctx.save()
        ctx.translate(ax + Math.cos(angle) * 36, ay + Math.sin(angle) * 36)
        ctx.rotate(angle)
        ctx.fillStyle = '#FFD050'
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 4
        ctx.beginPath()
        ctx.moveTo(10, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()

        // Texto guía: "gira →" o "↑ subí cámara"
        ctx.fillStyle = 'white'
        ctx.font = 'bold 11px Inter,sans-serif'
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 4
        const labelY = ay > H / 2 ? ay - 42 : ay + 50
        let hint = ''
        if (Math.abs(nowAzDiff) > HFOV / 2) hint = nowAzDiff > 0 ? 'girá derecha →' : '← girá izquierda'
        else hint = nowAltDiff > 0 ? '↑ subí cámara' : '↓ bajá cámara'
        ctx.fillText(hint, ax, labelY)
        ctx.shadowBlur = 0
      }

      // Guardar info actual del sol para el panel (cada ~500ms)
      if (!draw._lastInfo || (date.getTime() - draw._lastInfo) > 500) {
        draw._lastInfo = date.getTime()
        setSunInfo({
          az: nowAz, alt: nowAlt,
          inView: sunInView,
          azDiff: nowAzDiff, altDiff: nowAltDiff,
          belowHorizon: nowAlt <= 0
        })
      }

      // ── Marcador Salida ───────────────────────────────────
      const srPos    = SC.getPosition(times.sunrise, loc.lat, loc.lng)
      const srAz     = ((srPos.azimuth * 180 / Math.PI) + 180 + 360) % 360
      const srAzDiff = ((srAz - hdg) + 540) % 360 - 180
      if (Math.abs(srAzDiff) < HFOV / 2 + 5) {
        const sp = toScreen(srAz, 0)
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD050'; ctx.fill()
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'
        ctx.font = 'bold 12px Inter,sans-serif'
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 6
        ctx.fillText('Salida', sp.x, sp.y - 18)
        ctx.font = '11px Inter,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'
        const srH = String(times.sunrise.getHours()).padStart(2, '0')
        const srM = String(times.sunrise.getMinutes()).padStart(2, '0')
        ctx.fillText(`${srH}:${srM}`, sp.x, sp.y - 4)
        ctx.shadowBlur = 0
      }

      // ── Marcador Puesta ───────────────────────────────────
      const ssPos    = SC.getPosition(times.sunset, loc.lat, loc.lng)
      const ssAz     = ((ssPos.azimuth * 180 / Math.PI) + 180 + 360) % 360
      const ssAzDiff = ((ssAz - hdg) + 540) % 360 - 180
      if (Math.abs(ssAzDiff) < HFOV / 2 + 5) {
        const sp = toScreen(ssAz, 0)
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 10, 0, Math.PI * 2)
        ctx.fillStyle = '#FF8C00'; ctx.fill()
        ctx.fillStyle = 'white'; ctx.textAlign = 'center'
        ctx.font = 'bold 12px Inter,sans-serif'
        ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 6
        ctx.fillText('Puesta', sp.x, sp.y - 18)
        ctx.font = '11px Inter,sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.85)'
        const ssH = String(times.sunset.getHours()).padStart(2, '0')
        const ssM = String(times.sunset.getMinutes()).padStart(2, '0')
        ctx.fillText(`${ssH}:${ssM}`, sp.x, sp.y - 4)
        ctx.shadowBlur = 0
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    // Arrancar inmediatamente con fallback GPS
    if (!locationRef.current) locationRef.current = { lat: -25.2867, lng: -57.6470 }
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  // Datos panel inferior — usar fallback inmediato
  const SC2  = window.SunCalc
  const loc2 = location || { lat: -25.2867, lng: -57.6470 }
  const times2 = SC2 ? (() => { try { return SC2.getTimes(now, loc2.lat, loc2.lng) } catch { return null } })() : null
  const fmtT = (d) => (d && !isNaN(d.getTime())) ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : '--:--'
  const srT  = times2 ? times2.sunrise : null
  const ssT  = times2 ? times2.sunset  : null
  const ghRS = fmtT(srT)
  const ghRE = srT ? fmtT(new Date(srT.getTime() + 3600000)) : '--:--'
  const ghSS = ssT ? fmtT(new Date(ssT.getTime() - 3600000)) : '--:--'
  const ghSE = fmtT(ssT)

  const compassLabels = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']

  return (
    <div style={{ width: '100%', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#000' }} className="slide-l">

      {/* Video fondo */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
      {camError && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#1a2a3a,#2a3d52 40%,#3d5a3a)', zIndex: 1 }} />}

      {/* Canvas AR encima del video */}
      <canvas ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }} />

      {/* Header respeta notch */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 'env(safe-area-inset-top,44px)', zIndex: 20, background: 'linear-gradient(180deg,rgba(0,0,0,0.55) 0%,transparent 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Sun AR {!location && <span style={{ opacity: 0.5 }}>· GPS…</span>}
            {!window.SunCalc && <span style={{ opacity: 0.7, color: '#ff9a6a', marginLeft: 6 }}>· cargando librería…</span>}
          </div>
          <button onClick={onBack} className="tap" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ChevronLeft" size={16} color="white" />
          </button>
        </div>
      </div>

      {/* Calibración de brújula + aviso de precisión */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,44px) + 50px)', left: '50%', transform: 'translateX(-50%)', zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20, padding: '4px 4px' }}>
          <button onClick={() => adjustCalib(-2)} className="tap" style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>−</button>
          <button onClick={resetCalib} className="tap" title="Tocá para reiniciar la calibración" style={{ background: 'none', border: 'none', color: calib !== 0 ? '#FFD050' : 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer', minWidth: 78, textAlign: 'center' }}>
            cal {calib > 0 ? '+' : ''}{calib}°
          </button>
          <button onClick={() => adjustCalib(2)} className="tap" style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', lineHeight: 1 }}>+</button>
        </div>
        {(compassAcc != null && (compassAcc < 0 || compassAcc > 20)) && (
          <div style={{ background: 'rgba(200,80,30,0.85)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 8, fontFamily: 'inherit', textAlign: 'center', maxWidth: 240 }}>
            ↺ Movés el teléfono en forma de 8 para calibrar la brújula
          </div>
        )}
      </div>

      {/* Chip info Sol actual */}
      <div style={{ position: 'absolute', bottom: 245, left: '50%', transform: 'translateX(-50%)', zIndex: 11, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,208,80,0.35)', borderRadius: 14, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: sunInfo.belowHorizon ? '#666' : '#FFD050', boxShadow: sunInfo.belowHorizon ? 'none' : '0 0 8px rgba(255,208,80,0.9)' }} />
        <div style={{ color: 'white', fontSize: 11, fontFamily: 'inherit', lineHeight: 1.3 }}>
          <div style={{ fontWeight: 700, color: '#FFD050', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sol ahora</div>
          <div style={{ opacity: 0.9, fontFamily: 'monospace', fontSize: 11 }}>
            AZ {Math.round(sunInfo.az || 0)}° · ALT {Math.round(sunInfo.alt || 0)}°
            {sunInfo.belowHorizon && <span style={{ marginLeft: 6, color: '#888' }}>· bajo horizonte</span>}
            {!sunInfo.belowHorizon && sunInfo.inView && <span style={{ marginLeft: 6, color: '#7dffa9' }}>· en cuadro ✓</span>}
          </div>
        </div>
      </div>

      {/* Brújula horizontal */}
      <div style={{ position: 'absolute', bottom: 195, left: 0, right: 0, zIndex: 10, overflow: 'hidden', height: 36 }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.15)' }} />
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', color: 'white', fontSize: 9, zIndex: 2, fontWeight: 700 }}>▲</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', transform: `translateX(${-((heading % 360) / 360 * 800 % 800)}px)`, whiteSpace: 'nowrap', transition: 'transform 0.05s linear' }}>
            {[-1, 0, 1].map(rep => compassLabels.map((c, i) => (
              <div key={`${rep}-${i}`} style={{ width: 100, textAlign: 'center', paddingTop: 12, color: ['N', 'S', 'E', 'O'].includes(c) ? 'white' : 'rgba(255,255,255,0.4)', fontSize: ['N', 'S', 'E', 'O'].includes(c) ? 12 : 10, fontWeight: 600, fontFamily: 'inherit', letterSpacing: '0.05em' }}>
                {c}
              </div>
            )))}
          </div>
        </div>
      </div>

      {/* Panel inferior Golden Hour */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '14px 16px calc(env(safe-area-inset-bottom,0px) + 14px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFD050' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'inherit', fontWeight: 500 }}>Golden Hour (Salida)</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#FFD050', fontFamily: 'inherit', marginBottom: 2 }}>{ghRS} – {ghRE}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit' }}>Duración: 1h</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF8C00' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'inherit', fontWeight: 500 }}>Golden Hour (Puesta)</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#FF8C00', fontFamily: 'inherit', marginBottom: 2 }}>{ghSS} – {ghSE}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'inherit' }}>Duración: 1h</div>
          </div>
        </div>
      </div>
    </div>
  )
}
