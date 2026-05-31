import { useState, useEffect, useRef } from 'react'
import { Icon } from '../../components/ui/Icon'

// ═══════════════════════════════════════════════════════════
//  COLOR TEMPERATURE VIEW — solo el número, sin íconos
// ═══════════════════════════════════════════════════════════
export default function ColorTempView({ project, onBack }) {
  const [currentTemp, setCurrentTemp] = useState(null)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [camError, setCamError]       = useState(false)
  const [flash, setFlash]             = useState(false)
  const [wbLocked, setWbLocked]       = useState(null) // null=desconocido, true=bloqueado, false=no soportado
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Tamaño del rectángulo de medición en pantalla (porcentaje del viewport)
  const RECT_W_PCT = 0.55  // 55% del ancho
  const RECT_H_PCT = 0.32  // 32% del alto — zona cuadrada-ish centrada

  // Cámara real — intenta BLOQUEAR el balance de blancos para medir la luz real
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
        })
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }

        // Intentar fijar el balance de blancos para que NO auto-corrija el color.
        try {
          const track = stream.getVideoTracks()[0]
          const caps  = track.getCapabilities ? track.getCapabilities() : {}
          const adv = []
          if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes('manual')) {
            adv.push({ whiteBalanceMode: 'manual' })
            // Fijar a una referencia luz día para que el sensor responda de forma consistente
            if (caps.colorTemperature) {
              const mid = Math.round((caps.colorTemperature.min + caps.colorTemperature.max) / 2)
              adv.push({ colorTemperature: Math.min(caps.colorTemperature.max, Math.max(caps.colorTemperature.min, 5500 || mid)) })
            }
          }
          if (adv.length) {
            await track.applyConstraints({ advanced: adv })
            setWbLocked(true)
          } else {
            setWbLocked(false) // el dispositivo (ej. iPhone/Safari) no permite fijar el WB
          }
        } catch (err) {
          console.warn('WB lock no soportado:', err)
          setWbLocked(false)
        }
      } catch (e) { console.warn('Cam:', e); setCamError(true) }
    })()
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [])

  const lightSources = {
    1700: { name: 'Vela', desc: 'Muy cálida', color: '#ff6a00' },
    2500: { name: 'Tungsteno', desc: 'Cálida artificial', color: '#ff9a3c' },
    3200: { name: 'Tungsteno Estándar', desc: 'Estudio cinematográfico', color: '#ffb347' },
    5500: { name: 'Luz Natural', desc: 'Sol al mediodía', color: '#fff4e0' },
    6500: { name: 'Daylight', desc: 'Luz natural promedio', color: '#f0f8ff' },
    7500: { name: 'Cielo Nublado', desc: 'Luz fría difusa', color: '#d0e8ff' },
    10000: { name: 'Cielo Despejado', desc: 'Luz muy azul', color: '#a8cfff' }
  }

  // Analizar píxeles del rectángulo central visible
  const measureTemp = () => {
    if (isMeasuring) return
    setIsMeasuring(true)
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
    setTimeout(() => {
      let temp = null
      try {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (video && canvas && video.readyState >= 2) {
          const ctx = canvas.getContext('2d')
          const vw = video.videoWidth
          const vh = video.videoHeight
          // El rectángulo de muestreo corresponde al área visible del reticle
          const sw = Math.round(vw * RECT_W_PCT)
          const sh = Math.round(vh * RECT_H_PCT)
          const sx = Math.round((vw - sw) / 2)
          const sy = Math.round((vh - sh) / 2)
          canvas.width  = sw
          canvas.height = sh
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh)
          const data = ctx.getImageData(0, 0, sw, sh).data
          let R = 0, G = 0, B = 0, count = 0
          // Sub-muestreo + descartar píxeles quemados (>=250) o muy oscuros (<=18)
          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i + 1], b = data[i + 2]
            const mx = Math.max(r, g, b)
            if (mx >= 250 || mx <= 18) continue
            R += r; G += g; B += b; count++
          }
          if (count > 30) {
            R /= count; G /= count; B /= count
            // sRGB (0-255) → lineal
            const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4) }
            const rl = lin(R), gl = lin(G), bl = lin(B)
            // lineal sRGB → XYZ (matriz D65)
            const X = rl * 0.4124 + gl * 0.3576 + bl * 0.1805
            const Y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722
            const Z = rl * 0.0193 + gl * 0.1192 + bl * 0.9505
            const sum = X + Y + Z
            if (sum > 0) {
              const x = X / sum, y = Y / sum
              // McCamy: temperatura de color correlacionada (CCT)
              const n = (x - 0.3320) / (0.1858 - y)
              temp = 437 * n * n * n + 3601 * n * n + 6861 * n + 5517
              temp = Math.max(1700, Math.min(12000, Math.round(temp)))
            }
          }
        }
      } catch (e) { console.warn('Pixel analysis:', e) }
      if (temp) {
        setCurrentTemp(temp)
      }
      // Si no se pudo medir (sin video / zona muy oscura o quemada), mantener el valor anterior.
      setIsMeasuring(false)
    }, 700)
  }

  const light = currentTemp ? lightSources[Object.keys(lightSources).reduce((p, c) => Math.abs(c - currentTemp) < Math.abs(p - currentTemp) ? c : p)] : null

  // Barra de gradiente de temperatura de color
  const tempGradient = 'linear-gradient(90deg, #ff6a00 0%, #ffb347 18%, #fff4e0 45%, #f0f8ff 65%, #d0e8ff 82%, #a8cfff 100%)'
  const tempToPercent = (k) => Math.max(0, Math.min(100, ((k - 1700) / (10000 - 1700)) * 100))

  return (
    <div style={{ width: '100%', height: '100dvh', position: 'relative', overflow: 'hidden', background: '#000' }} className="slide-l">
      {/* Video cámara real */}
      <video ref={videoRef} autoPlay playsInline muted
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 1 }} />
      {camError && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)', zIndex: 1 }} />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Overlay oscuro FUERA del rectángulo — 4 franjas */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${(100 - (RECT_H_PCT * 100)) / 2}%`, background: 'rgba(0,0,0,0.55)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(100 - (RECT_H_PCT * 100)) / 2}%`, background: 'rgba(0,0,0,0.55)' }} />
        <div style={{ position: 'absolute', top: `${(100 - (RECT_H_PCT * 100)) / 2}%`, left: 0, width: `${(100 - (RECT_W_PCT * 100)) / 2}%`, height: `${RECT_H_PCT * 100}%`, background: 'rgba(0,0,0,0.55)' }} />
        <div style={{ position: 'absolute', top: `${(100 - (RECT_H_PCT * 100)) / 2}%`, right: 0, width: `${(100 - (RECT_W_PCT * 100)) / 2}%`, height: `${RECT_H_PCT * 100}%`, background: 'rgba(0,0,0,0.55)' }} />
      </div>

      {/* Flash de medición */}
      {flash && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.18)', zIndex: 15, pointerEvents: 'none' }} />}

      {/* Reticle — borde del rectángulo de medición con esquinas */}
      <div style={{
        position: 'absolute',
        top: `${(100 - (RECT_H_PCT * 100)) / 2}%`,
        left: `${(100 - (RECT_W_PCT * 100)) / 2}%`,
        width: `${RECT_W_PCT * 100}%`,
        height: `${RECT_H_PCT * 100}%`,
        zIndex: 10, pointerEvents: 'none'
      }}>
        {/* Borde completo tenue */}
        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,255,255,0.25)', borderRadius: 2 }} />
        {/* Esquinas con acento */}
        {[['topleft', '0', '0'], ['topright', '0', 'auto'], ['bottomleft', 'auto', '0'], ['bottomright', 'auto', 'auto']].map(([key], idx) => {
          const isRight = idx === 1 || idx === 3
          const isBottom = idx >= 2
          const cs = 18
          return (
            <div key={key} style={{
              position: 'absolute',
              top: isBottom ? 'auto' : 0, bottom: isBottom ? 0 : 'auto',
              left: isRight ? 'auto' : 0, right: isRight ? 0 : 'auto',
              width: cs, height: cs, pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                top: isBottom ? 'auto' : 0, bottom: isBottom ? 0 : 'auto',
                left: isRight ? 'auto' : 0, right: isRight ? 0 : 'auto',
                width: cs, height: 2, background: 'white',
                boxShadow: '0 0 6px rgba(255,255,255,0.8)'
              }} />
              <div style={{
                position: 'absolute',
                top: isBottom ? 'auto' : 0, bottom: isBottom ? 0 : 'auto',
                left: isRight ? 'auto' : 0, right: isRight ? 0 : 'auto',
                width: 2, height: cs, background: 'white',
                boxShadow: '0 0 6px rgba(255,255,255,0.8)'
              }} />
            </div>
          )
        })}
        {/* Label "ZONA DE MEDICIÓN" arriba del rect */}
        <div style={{ position: 'absolute', top: -22, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', fontWeight: 600 }}>
          Zona de medición
        </div>
        {/* Crosshair central pequeño */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 16, height: 16, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.45)', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.45)', transform: 'translateX(-50%)' }} />
        </div>
        {/* Animación de escaneo mientras mide */}
        {isMeasuring && (
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.7)', boxShadow: '0 0 12px rgba(255,255,255,0.9)', animation: 'scan 0.7s linear', zIndex: 3 }} />
        )}
      </div>

      {/* Header — respeta notch */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 'env(safe-area-inset-top,44px)', zIndex: 20, background: 'linear-gradient(180deg,rgba(0,0,0,0.6) 0%,transparent 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Color Temp
            {wbLocked === true && <span style={{ marginLeft: 8, color: '#7dffa9', fontSize: 10, letterSpacing: '0.04em' }}>· WB fijo ✓</span>}
            {wbLocked === false && <span style={{ marginLeft: 8, color: '#ff9a6a', fontSize: 10, letterSpacing: '0.04em', textTransform: 'none' }}>· auto-WB (aprox.)</span>}
          </div>
          <button onClick={onBack} className="tap" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="ChevronLeft" size={16} color="white" />
          </button>
        </div>
      </div>

      {/* Panel inferior — temperatura + barra + botón */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 'env(safe-area-inset-bottom,20px)', zIndex: 20 }}>
        <div style={{ background: 'linear-gradient(0deg,rgba(0,0,0,0.85) 0%,transparent 100%)', padding: '32px 24px 24px' }}>

          {/* Número de temperatura */}
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            {isMeasuring ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, height: 64 }}>
                <div style={{ width: 22, height: 22, border: '2px solid rgba(255,255,255,0.2)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'inherit', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Midiendo…</span>
              </div>
            ) : currentTemp ? (
              <>
                <div style={{ fontSize: 72, fontWeight: 200, color: 'white', letterSpacing: '-3px', lineHeight: 1, fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif', textShadow: '0 2px 24px rgba(0,0,0,0.6)' }}>
                  {currentTemp.toLocaleString()}<span style={{ fontSize: 40, fontWeight: 200, opacity: 0.6 }}> K</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'inherit', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>{light?.name}</div>
                <div style={{ marginTop: 3, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>{light?.desc}</div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit', letterSpacing: '0.1em', textTransform: 'uppercase', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Apuntá a la fuente de luz
              </div>
            )}
          </div>

          {/* Barra de temperatura de color */}
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <div style={{ height: 6, borderRadius: 3, background: tempGradient, position: 'relative', overflow: 'visible' }}>
              {/* Labels extremos */}
              <span style={{ position: 'absolute', left: 0, top: 10, fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }}>1700K</span>
              <span style={{ position: 'absolute', right: 0, top: 10, fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: 'inherit' }}>10K</span>
              {/* Indicador de posición actual */}
              {currentTemp && (
                <div style={{
                  position: 'absolute',
                  left: `${tempToPercent(currentTemp)}%`,
                  top: '50%',
                  transform: 'translate(-50%,-50%)',
                  width: 14, height: 14,
                  borderRadius: '50%',
                  background: light?.color || 'white',
                  border: '2px solid white',
                  boxShadow: `0 0 10px ${light?.color || 'white'}, 0 2px 8px rgba(0,0,0,0.6)`,
                  transition: 'left 0.4s ease',
                  zIndex: 2
                }} />
              )}
            </div>
          </div>

          {/* Botón medir */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={measureTemp} disabled={isMeasuring} className="tap"
              style={{ width: 64, height: 64, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.1)', cursor: isMeasuring ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', opacity: isMeasuring ? 0.4 : 1, backdropFilter: 'blur(12px)' }}>
              <Icon name="ScanEye" size={26} color="white" strokeWidth={1.5} />
            </button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform:rotate(360deg) } }
        @keyframes scan { 0%{top:0%} 100%{top:100%} }
      `}</style>
    </div>
  )
}
